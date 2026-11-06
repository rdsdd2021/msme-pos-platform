import 'package:drift/drift.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../database/app_database.dart';
import '../models/sync_models.dart';
import '../repositories/sync_repository.dart';

class SyncWorker {
  final AppDatabase _db;
  final SyncRepository _syncRepo;
  final SharedPreferences? _prefs;

  static const String _keyCursor = 'kirana_sync_cursor';
  static const String _keyLastSync = 'kirana_last_sync_time';

  SyncWorker({
    required AppDatabase db,
    required SyncRepository syncRepo,
    SharedPreferences? prefs,
  })  : _db = db,
        _syncRepo = syncRepo,
        _prefs = prefs;

  /// Retrieve the local sync cursor for incremental delta pulls
  Future<String?> getSyncCursor([String? tenantId]) async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    if (tenantId != null && tenantId.isNotEmpty) {
      final tenantCursor = prefs.getString('${_keyCursor}_$tenantId');
      if (tenantCursor != null) return tenantCursor;
    }
    return prefs.getString(_keyCursor);
  }

  /// Store updated sync cursor after local transaction commit
  Future<void> setSyncCursor(String cursor, [String? tenantId]) async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    await prefs.setString(_keyCursor, cursor);
    if (tenantId != null && tenantId.isNotEmpty) {
      await prefs.setString('${_keyCursor}_$tenantId', cursor);
    }
  }

  /// Timestamp of the last successful sync cycle
  Future<DateTime?> getLastSyncTime() async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    final str = prefs.getString(_keyLastSync);
    if (str == null) return null;
    return DateTime.tryParse(str);
  }

  /// Save timestamp of last successful sync
  Future<void> setLastSyncTime(DateTime time) async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    await prefs.setString(_keyLastSync, time.toIso8601String());
  }

  /// Count of unsynced operations pending in local SQLite outbox
  Future<int> getPendingCount([String? tenantId]) async {
    final query = _db.select(_db.syncOutbox)
      ..where((t) => t.status.isIn(const ['pending', 'failed', 'sending']));
    final rows = await query.get();
    return rows.length;
  }

  /// Full bi-directional synchronization cycle:
  /// 1. Push pending local mutations to backend (idempotent, Rule 12).
  /// 2. Pull server deltas and commit locally in atomic SQLite transaction before advancing cursor (Rule 14).
  Future<SyncCycleResult> synchronize({
    required String tenantId,
    required String deviceId,
  }) async {
    // 1. Fetch pending outbox operations in sequence order
    final pendingOps = await (_db.select(_db.syncOutbox)
          ..where((t) => t.status.isIn(const ['pending', 'failed']))
          ..orderBy([(t) => OrderingTerm(expression: t.sequence, mode: OrderingMode.asc)]))
        .get();

    int pushedCount = 0;
    String? pushError;

    if (pendingOps.isNotEmpty) {
      // Chunk pending mutations into manageable batches of at most 5
      // to avoid payload spikes and isolate any problematic records.
      const int batchSize = 5;
      for (int i = 0; i < pendingOps.length; i += batchSize) {
        final chunk = pendingOps.sublist(
          i,
          (i + batchSize > pendingOps.length) ? pendingOps.length : i + batchSize,
        );
        final opIds = chunk.map((op) => op.operationId).toList();
        await (_db.update(_db.syncOutbox)..where((t) => t.operationId.isIn(opIds))).write(
          const SyncOutboxCompanion(status: Value('sending')),
        );

        try {
          final pushResult = await _syncRepo.pushBatch(tenantId, deviceId, chunk);
          for (final ack in pushResult.results) {
            if (ack.status == 'accepted' || ack.status == 'already_processed') {
              await (_db.update(_db.syncOutbox)..where((t) => t.operationId.equals(ack.operationId))).write(
                SyncOutboxCompanion(
                  status: const Value('accepted'),
                  serverEntityId: Value(ack.serverEntityId),
                  lastError: const Value(null),
                ),
              );
              pushedCount++;
            } else {
              await (_db.update(_db.syncOutbox)..where((t) => t.operationId.equals(ack.operationId))).write(
                SyncOutboxCompanion(
                  status: const Value('rejected'),
                  lastError: Value(ack.errorMessage ?? 'Rejected by server'),
                ),
              );
            }
          }
        } catch (e) {
          pushError = 'Outbox push error: ${_formatError(e)}';
          // Fallback: If a multi-op batch fails (e.g. 413 or timeout), retry items individually
          // so that valid operations succeed and only the oversized operation is isolated.
          if (chunk.length > 1) {
            for (final singleOp in chunk) {
              try {
                final singleResult = await _syncRepo.pushBatch(tenantId, deviceId, [singleOp]);
                final ack = singleResult.results.firstOrNull;
                if (ack != null && (ack.status == 'accepted' || ack.status == 'already_processed')) {
                  await (_db.update(_db.syncOutbox)..where((t) => t.operationId.equals(singleOp.operationId))).write(
                    SyncOutboxCompanion(
                      status: const Value('accepted'),
                      serverEntityId: Value(ack.serverEntityId),
                      lastError: const Value(null),
                    ),
                  );
                  pushedCount++;
                } else {
                  await (_db.update(_db.syncOutbox)..where((t) => t.operationId.equals(singleOp.operationId))).write(
                    SyncOutboxCompanion(
                      status: const Value('rejected'),
                      lastError: Value(ack?.errorMessage ?? 'Rejected by server'),
                    ),
                  );
                }
              } catch (singleErr) {
                await (_db.update(_db.syncOutbox)..where((t) => t.operationId.equals(singleOp.operationId))).write(
                  SyncOutboxCompanion(
                    status: const Value('failed'),
                    retryCount: Value(singleOp.retryCount + 1),
                    lastError: Value(_formatError(singleErr)),
                  ),
                );
              }
            }
          } else {
            // Single operation failed
            for (final op in chunk) {
              await (_db.update(_db.syncOutbox)..where((t) => t.operationId.equals(op.operationId))).write(
                SyncOutboxCompanion(
                  status: const Value('failed'),
                  retryCount: Value(op.retryCount + 1),
                  lastError: Value(_formatError(e)),
                ),
              );
            }
          }
        }
      }
    }

    // 2. Pull server deltas (catalog, customers & reference data)
    int pulledProducts = 0;
    int pulledCategories = 0;
    int pulledCustomers = 0;
    String newCursor = '';

    try {
      final currentCursor = await getSyncCursor(tenantId);
      final pullResult = await _syncRepo.pullDeltas(tenantId, cursor: currentCursor);
      newCursor = pullResult.cursor;

      // Rule 14: Pull cursor advances ONLY after local SQLite transaction commits!
      await _db.transaction(() async {
        for (final p in pullResult.products) {
          final prodId = p['id'] as String? ?? '';
          if (prodId.isEmpty) continue;

          final barcode = (p['barcodePrimary'] ?? p['barcode']) as String?;
          final purchaseCost = p['purchaseCost'] ?? p['costPrice'];
          final gstRate = p['gstRatePercent'] ?? p['gstRate'];
          final stockQty = p['currentStock'] ?? p['stockQuantity'] ?? 50.0;
          final img = (p['imageUrl'] ?? p['image']) as String?;

          await _db.into(_db.localProducts).insertOnConflictUpdate(
            LocalProductsCompanion(
              id: Value(prodId),
              tenantId: Value(p['tenantId'] as String? ?? tenantId),
              sku: Value(p['sku'] as String? ?? 'SKU'),
              name: Value(p['name'] as String? ?? 'Product'),
              barcode: Value(barcode),
              sellingPricePaisa: Value(
                ((double.tryParse(p['sellingPrice']?.toString() ?? '0') ?? 0) * 100).round(),
              ),
              purchaseCostPaisa: Value(
                ((double.tryParse(purchaseCost?.toString() ?? '0') ?? 0) * 100).round(),
              ),
              mrpPaisa: Value(
                ((double.tryParse(p['mrp']?.toString() ?? '0') ?? 0) * 100).round(),
              ),
              gstRatePercent: Value(double.tryParse(gstRate?.toString() ?? '0') ?? 0.0),
              hsnCode: Value(p['hsnCode'] as String?),
              unit: Value(p['unit'] as String? ?? 'PCS'),
              stockQuantity: Value(double.tryParse(stockQty.toString()) ?? 50.0),
              imageUrl: Value(img),
              updatedAt: Value(DateTime.tryParse(p['updatedAt']?.toString() ?? '') ?? DateTime.now()),
            ),
          );
          pulledProducts++;
        }

        for (final c in pullResult.customers) {
          final custId = c['id'] as String? ?? '';
          if (custId.isEmpty) continue;

          await _db.into(_db.localCustomers).insertOnConflictUpdate(
            LocalCustomersCompanion(
              id: Value(custId),
              tenantId: Value(c['tenantId'] as String? ?? tenantId),
              name: Value(c['name'] as String? ?? 'Customer'),
              phone: Value(c['phone']?.toString() ?? ''),
              currentBalancePaisa: Value(
                ((double.tryParse(c['currentBalance']?.toString() ?? '0') ?? 0) * 100).round(),
              ),
              creditLimitPaisa: Value(
                ((double.tryParse(c['creditLimit']?.toString() ?? '0') ?? 0) * 100).round(),
              ),
              updatedAt: Value(DateTime.tryParse(c['updatedAt']?.toString() ?? '') ?? DateTime.now()),
            ),
          );
          pulledCustomers++;
        }
      });

      // Save cursor and timestamp only after transaction succeeded
      if (newCursor.isNotEmpty) {
        await setSyncCursor(newCursor, tenantId);
      }
      await setLastSyncTime(DateTime.now());
      pulledCategories = pullResult.categories.length;
    } catch (e) {
      final cleanPullError = _formatError(e);
      return SyncCycleResult(
        pushedCount: pushedCount,
        pulledProductsCount: 0,
        pulledCategoriesCount: 0,
        pulledCustomersCount: 0,
        newCursor: '',
        isSuccess: false,
        error: pushError != null
            ? '$pushError | Pull: $cleanPullError'
            : cleanPullError,
      );
    }

    return SyncCycleResult(
      pushedCount: pushedCount,
      pulledProductsCount: pulledProducts,
      pulledCategoriesCount: pulledCategories,
      pulledCustomersCount: pulledCustomers,
      newCursor: newCursor,
      isSuccess: pushError == null,
      error: pushError,
    );
  }

  String _formatError(dynamic e) {
    final str = e.toString().replaceFirst('Exception: ', '').trim();
    final lower = str.toLowerCase();
    if (str.contains('401') || lower.contains('session expired') || lower.contains('unauthorized')) {
      return 'Session expired — please log in again';
    }
    if (str.contains('400')) {
      return 'Sync rejected by server (400)';
    }
    if (str.contains('403')) {
      return 'Sync permission denied (403)';
    }
    if (str.contains('500') || str.contains('502') || str.contains('503')) {
      return 'Server temporarily busy (500)';
    }
    if (lower.contains('unreachable') ||
        lower.contains('socket') ||
        lower.contains('timeout') ||
        lower.contains('connection refused') ||
        lower.contains('connection reset') ||
        lower.contains('network is unreachable')) {
      return 'Server unreachable (offline)';
    }
    if (str.contains('DioException')) {
      return 'Sync communication error';
    }
    if (str.length > 70) {
      return str.substring(0, 70);
    }
    return str;
  }
}

