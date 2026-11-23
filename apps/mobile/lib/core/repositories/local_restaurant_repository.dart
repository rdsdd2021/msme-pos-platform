import 'dart:async';
import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
import '../database/app_database.dart';
import '../models/cart_item.dart';
import '../models/product.dart';

class LocalRestaurantRepository {
  final AppDatabase _db;
  static int _outboxSequence = 1;

  LocalRestaurantRepository(this._db);

  /// Streams all tables from local SQLite Drift database
  Stream<List<LocalRestaurantTable>> watchTables({String? tenantId, String? branchId}) {
    final query = _db.select(_db.localRestaurantTables);
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((t) => t.tenantId.equals(tenantId));
    }
    if (branchId != null && branchId.isNotEmpty) {
      query.where((t) => t.branchId.equals(branchId));
    }
    return (query..orderBy([(t) => OrderingTerm(expression: t.sortOrder, mode: OrderingMode.asc)]))
        .watch();
  }

  /// Get all tables as snapshot
  Future<List<LocalRestaurantTable>> getAllTables({String? tenantId, String? branchId}) async {
    final query = _db.select(_db.localRestaurantTables);
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((t) => t.tenantId.equals(tenantId));
    }
    if (branchId != null && branchId.isNotEmpty) {
      query.where((t) => t.branchId.equals(branchId));
    }
    return (query..orderBy([(t) => OrderingTerm(expression: t.sortOrder, mode: OrderingMode.asc)]))
        .get();
  }

  /// Get active order lines for a table
  Future<List<LocalRestaurantKotLine>> getTableKotLines(String orderId) async {
    return (_db.select(_db.localRestaurantKotLines)..where((l) => l.orderId.equals(orderId))).get();
  }

  /// Safely resolves a table row in local SQLite without throwing StateError if duplicate codes exist across tenants
  Future<LocalRestaurantTable?> _resolveTable(
    String tableId, {
    String? tableNumber,
    String? tenantId,
    String? branchId,
  }) async {
    final query = _db.select(_db.localRestaurantTables);
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((t) => t.tenantId.equals(tenantId));
    }
    if (branchId != null && branchId.isNotEmpty) {
      query.where((t) => t.branchId.equals(branchId));
    }
    query.where((t) =>
        t.id.equals(tableId) |
        t.tableNumber.equals(tableId) |
        (tableNumber != null && tableNumber.isNotEmpty
            ? (t.tableNumber.equals(tableNumber) | t.name.equals(tableNumber))
            : const Constant(false)));

    final matches = await (query..limit(1)).get();
    if (matches.isNotEmpty) return matches.first;

    // Fallback without branchId if tenant matches
    if (tenantId != null && tenantId.isNotEmpty) {
      final fallbackQuery = _db.select(_db.localRestaurantTables)
        ..where((t) => t.tenantId.equals(tenantId))
        ..where((t) =>
            t.id.equals(tableId) |
            t.tableNumber.equals(tableId) |
            (tableNumber != null && tableNumber.isNotEmpty
                ? (t.tableNumber.equals(tableNumber) | t.name.equals(tableNumber))
                : const Constant(false)))
        ..limit(1);
      final fallbackMatches = await fallbackQuery.get();
      if (fallbackMatches.isNotEmpty) return fallbackMatches.first;
    }

    // Global fallback
    final globalMatches = await (_db.select(_db.localRestaurantTables)
          ..where((t) =>
              t.id.equals(tableId) |
              t.tableNumber.equals(tableId) |
              (tableNumber != null && tableNumber.isNotEmpty
                  ? (t.tableNumber.equals(tableNumber) | t.name.equals(tableNumber))
                  : const Constant(false)))
          ..limit(1))
        .get();
    return globalMatches.firstOrNull;
  }

  /// Get active CartItems for a table from SQLite (hydrates dishes from KOT lines)
  Future<List<CartItem>> getTableActiveCartItems(
    String tableId, {
    String? tenantId,
    String? branchId,
  }) async {
    try {
      final matchingTable = await _resolveTable(tableId, tenantId: tenantId, branchId: branchId);

      final targetIds = {tableId};
      if (matchingTable != null) {
        targetIds.add(matchingTable.id);
        targetIds.add(matchingTable.tableNumber);
      }

      final orderQuery = _db.select(_db.localRestaurantOrders)
        ..where((o) => o.tableId.isIn(targetIds) | o.tableNumberSnapshot.isIn(targetIds))
        ..where((o) => o.status.isIn(const ['open', 'billed', 'ordered']))
        ..orderBy([(o) => OrderingTerm(expression: o.openedAt, mode: OrderingMode.desc)]);

      if (tenantId != null && tenantId.isNotEmpty) {
        orderQuery.where((o) => o.tenantId.equals(tenantId));
      }

      final activeOrders = await orderQuery.get();
      if (activeOrders.isEmpty) return [];

      // A table has at most ONE authoritative active order at a time (the newest open/ordered/billed one).
      final currentOrder = activeOrders.first;
      final activeOrderIds = [currentOrder.id];

      // Auto-clean any stale older orders for this table in SQLite so their lines don't bleed or duplicate
      if (activeOrders.length > 1) {
        final olderOrderIds = activeOrders.skip(1).map((o) => o.id).toList();
        (_db.update(_db.localRestaurantOrders)..where((o) => o.id.isIn(olderOrderIds)))
            .write(const LocalRestaurantOrdersCompanion(status: Value('completed')));
      }

      final kotLines = await (_db.select(_db.localRestaurantKotLines)
            ..where((l) => l.orderId.isIn(activeOrderIds)))
          .get();

      if (kotLines.isEmpty) return [];

      final Map<String, CartItem> itemsMap = {};
      for (final line in kotLines) {
        final key = '${line.productId}_${line.productName}_${line.unitPricePaisa}_${line.specialInstructions ?? ""}';
        final qty = line.quantity.round();
        if (itemsMap.containsKey(key)) {
          final existing = itemsMap[key]!;
          itemsMap[key] = existing.copyWith(quantity: existing.quantity + qty);
        } else {
          String? variantName;
          final match = RegExp(r'^(.*?)\s*\(([^)]+)\)$').firstMatch(line.productName);
          if (match != null) {
            variantName = match.group(2);
          }
          itemsMap[key] = CartItem(
            product: Product(
              id: line.productId,
              name: match != null ? match.group(1)! : line.productName,
              sku: line.productId,
              category: 'Kitchen',
              unit: 'PCS',
              sellingPricePaisa: line.unitPricePaisa,
              purchaseCostPaisa: line.unitPricePaisa,
              gstRate: 5,
              currentStock: 100.0,
            ),
            quantity: qty,
            notes: line.specialInstructions,
            variantName: variantName,
            variantPricePaisa: line.unitPricePaisa,
          );
        }
      }

      return itemsMap.values.toList();
    } catch (_) {
      return [];
    }
  }

  /// Atomically dispatch a KOT ticket: updates table to 'ordered', persists lines, enqueues DISPATCH_KOT in SyncOutbox
  Future<String> dispatchKotAtomic({
    required String tableId,
    String? tableNumber,
    required String orderId,
    required List<CartItem> lines,
    required String captainName,
    required String tenantId,
    required String branchId,
    required String deviceId,
  }) async {
    final kotId = const Uuid().v4();
    final now = DateTime.now();

    // Resolve human-readable table number and authoritative table UUID
    String resolvedTableId = tableId;
    String resolvedTableNumber = tableNumber ?? '';
    final tblRow = await _resolveTable(
      tableId,
      tableNumber: tableNumber,
      tenantId: tenantId,
      branchId: branchId,
    );
    if (tblRow != null) {
      resolvedTableId = tblRow.id;
      resolvedTableNumber = tblRow.tableNumber;
    } else if (resolvedTableNumber.isEmpty || resolvedTableNumber == tableId) {
      resolvedTableNumber = tableId.length <= 16 ? tableId : 'T-01';
    }

    final syncPayload = {
      'orderId': orderId,
      'tableId': resolvedTableId,
      'tableNumber': resolvedTableNumber,
      'branchId': branchId,
      'captainName': captainName,
      'lines': lines.map((i) => {
        'productId': i.product.id,
        'productName': i.displayName,
        'variantName': i.variantName,
        'quantity': i.quantity,
        'unitPrice': (i.unitPricePaisa / 100).toStringAsFixed(2),
        'kitchenStation': i.product.kitchenStation ?? 'main_kitchen',
        'specialInstructions': i.notes,
      }).toList(),
    };

    await _db.transaction(() async {
      // 1. Update table status to ordered
      await (_db.update(_db.localRestaurantTables)
            ..where((t) => (t.id.equals(resolvedTableId) | t.id.equals(tableId) | t.tableNumber.equals(resolvedTableNumber)) &
                (tenantId.isNotEmpty ? t.tenantId.equals(tenantId) : const Constant(true))))
          .write(
        LocalRestaurantTablesCompanion(
          status: const Value('ordered'),
          updatedAt: Value(now),
        ),
      );

      // 2. Ensure active order exists in local SQLite
      final existingOrder = await (_db.select(_db.localRestaurantOrders)
            ..where((o) => o.id.equals(orderId)))
          .getSingleOrNull();

      if (existingOrder == null) {
        final activeOrderForTable = await (_db.select(_db.localRestaurantOrders)
              ..where((o) => o.tableId.equals(resolvedTableId) | o.tableId.equals(tableId) | o.tableNumberSnapshot.equals(resolvedTableNumber))
              ..where((o) => o.status.isIn(const ['open', 'billed', 'ordered']))
              ..orderBy([(o) => OrderingTerm(expression: o.openedAt, mode: OrderingMode.desc)]))
            .get();

        if (activeOrderForTable.isEmpty) {
          final isTakeaway = resolvedTableNumber.startsWith('TAK-') || resolvedTableNumber.toLowerCase().contains('takeaway');
          await _db.into(_db.localRestaurantOrders).insertOnConflictUpdate(
            LocalRestaurantOrdersCompanion(
              id: Value(orderId),
              tenantId: Value(tenantId),
              branchId: Value(branchId),
              orderNumber: Value('ORD-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}'),
              orderType: Value(isTakeaway ? 'takeaway' : 'dine_in'),
              tableId: Value(resolvedTableId),
              tableNumberSnapshot: Value(resolvedTableNumber),
              sectionSnapshot: Value(tblRow?.section ?? 'Main Dining'),
              guestCount: Value(tblRow?.currentGuestCount != null && tblRow!.currentGuestCount > 0 ? tblRow.currentGuestCount : 2),
              status: const Value('ordered'),
              captainNameSnapshot: Value(captainName),
              openedAt: Value(now),
            ),
          );
        }
      }

      // 3. Insert KOT lines into local SQLite
      for (final line in lines) {
        await _db.into(_db.localRestaurantKotLines).insert(
          LocalRestaurantKotLinesCompanion.insert(
            id: const Uuid().v4(),
            tenantId: tenantId,
            orderId: orderId,
            kotId: Value(kotId),
            productId: line.product.id,
            productName: line.displayName,
            quantity: Value(line.quantity.toDouble()),
            unitPricePaisa: Value(line.unitPricePaisa),
            totalPaisa: Value(line.totalPaisa),
            kitchenStation: Value(line.product.kitchenStation ?? 'main_kitchen'),
            specialInstructions: Value(line.notes),
            status: const Value('pending'),
            createdAt: Value(now),
          ),
        );
      }

      // 4. Queue DISPATCH_KOT outbox operation
      await _db.into(_db.syncOutbox).insert(
        SyncOutboxCompanion.insert(
          operationId: const Uuid().v4(),
          deviceId: deviceId,
          sequence: _outboxSequence++,
          operationType: 'DISPATCH_KOT',
          schemaVersion: const Value(1),
          payload: jsonEncode(syncPayload),
          status: const Value('pending'),
          retryCount: const Value(0),
          createdAt: Value(now),
        ),
      );
    });

    return kotId;
  }

  /// Atomically marks a table as billed in local SQLite and queues UPDATE_TABLE_STATUS outbox mutation
  Future<void> markTableBilledAtomic({
    required String tableId,
    required String tenantId,
    required String branchId,
    required String deviceId,
  }) async {
    final now = DateTime.now();

    String resolvedTableId = tableId;
    String resolvedTableNumber = tableId;
    final tblRow = await _resolveTable(tableId, tenantId: tenantId, branchId: branchId);
    if (tblRow != null) {
      resolvedTableId = tblRow.id;
      resolvedTableNumber = tblRow.tableNumber;
    }

    final statusPayload = {
      'tableId': resolvedTableId,
      'tableNumber': resolvedTableNumber,
      'status': 'billed',
      'branchId': branchId,
    };

    await _db.transaction(() async {
      await (_db.update(_db.localRestaurantTables)
            ..where((t) => (t.id.equals(resolvedTableId) | t.id.equals(tableId) | t.tableNumber.equals(resolvedTableNumber)) &
                (tenantId.isNotEmpty ? t.tenantId.equals(tenantId) : const Constant(true))))
          .write(
        LocalRestaurantTablesCompanion(
          status: const Value('billed'),
          updatedAt: Value(now),
        ),
      );

      // Also mark active orders for this table as billed in local SQLite
      await (_db.update(_db.localRestaurantOrders)
            ..where((o) => (o.tableId.equals(resolvedTableId) | o.tableId.equals(tableId) | o.tableNumberSnapshot.equals(resolvedTableNumber)) &
                (tenantId.isNotEmpty ? o.tenantId.equals(tenantId) : const Constant(true)))
            ..where((o) => o.status.isIn(const ['open', 'ordered'])))
          .write(
        const LocalRestaurantOrdersCompanion(
          status: Value('billed'),
        ),
      );

      await _db.into(_db.syncOutbox).insert(
        SyncOutboxCompanion.insert(
          operationId: const Uuid().v4(),
          deviceId: deviceId,
          sequence: _outboxSequence++,
          operationType: 'UPDATE_TABLE_STATUS',
          schemaVersion: const Value(1),
          payload: jsonEncode(statusPayload),
          status: const Value('pending'),
          retryCount: const Value(0),
          createdAt: Value(now),
        ),
      );
    });
  }

  /// Atomically settle a restaurant table: marks table vacant, closes order, enqueues UPDATE_TABLE_STATUS and SETTLE_RESTAURANT_ORDER
  Future<void> settleTableAtomic({
    required String tableId,
    required String tenantId,
    required String branchId,
    required String deviceId,
    String? orderId,
    String? invoiceId,
  }) async {
    final now = DateTime.now();

    String resolvedTableId = tableId;
    String resolvedTableNumber = tableId;
    final tblRow = await _resolveTable(tableId, tenantId: tenantId, branchId: branchId);
    if (tblRow != null) {
      resolvedTableId = tblRow.id;
      resolvedTableNumber = tblRow.tableNumber;
    }

    final statusPayload = {
      'tableId': resolvedTableId,
      'tableNumber': resolvedTableNumber,
      'status': 'vacant',
      'branchId': branchId,
    };

    await _db.transaction(() async {
      // 1. Update local table to vacant
      await (_db.update(_db.localRestaurantTables)
            ..where((t) => (t.id.equals(resolvedTableId) | t.id.equals(tableId) | t.tableNumber.equals(resolvedTableNumber)) &
                (tenantId.isNotEmpty ? t.tenantId.equals(tenantId) : const Constant(true))))
          .write(
        LocalRestaurantTablesCompanion(
          status: const Value('vacant'),
          currentGuestCount: const Value(0),
          occupiedAt: const Value(null),
          updatedAt: Value(now),
        ),
      );

      // 2. Mark active order(s) completed
      if (orderId != null && orderId.isNotEmpty) {
        await (_db.update(_db.localRestaurantOrders)..where((o) => o.id.equals(orderId))).write(
          LocalRestaurantOrdersCompanion(
            status: const Value('completed'),
            invoiceId: Value(invoiceId),
            closedAt: Value(now),
          ),
        );
      } else {
        await (_db.update(_db.localRestaurantOrders)
              ..where((o) => (o.tableId.equals(resolvedTableId) | o.tableId.equals(tableId) | o.tableNumberSnapshot.equals(resolvedTableNumber)) &
                  (tenantId.isNotEmpty ? o.tenantId.equals(tenantId) : const Constant(true)))
              ..where((o) => o.status.isIn(const ['open', 'billed', 'ordered'])))
            .write(
          LocalRestaurantOrdersCompanion(
            status: const Value('completed'),
            invoiceId: Value(invoiceId),
            closedAt: Value(now),
          ),
        );
      }

      // 3. Queue UPDATE_TABLE_STATUS outbox mutation so server table vacates
      await _db.into(_db.syncOutbox).insert(
        SyncOutboxCompanion.insert(
          operationId: const Uuid().v4(),
          deviceId: deviceId,
          sequence: _outboxSequence++,
          operationType: 'UPDATE_TABLE_STATUS',
          schemaVersion: const Value(1),
          payload: jsonEncode(statusPayload),
          status: const Value('pending'),
          retryCount: const Value(0),
          createdAt: Value(now),
        ),
      );

      // 4. Also queue SETTLE_RESTAURANT_ORDER if orderId present so server order completes
      if (orderId != null && orderId.isNotEmpty) {
        final settlePayload = {
          'orderId': orderId,
          'tableId': resolvedTableId,
          'branchId': branchId,
          'status': 'completed',
        };
        await _db.into(_db.syncOutbox).insert(
          SyncOutboxCompanion.insert(
            operationId: const Uuid().v4(),
            deviceId: deviceId,
            sequence: _outboxSequence++,
            operationType: 'SETTLE_RESTAURANT_ORDER',
            schemaVersion: const Value(1),
            payload: jsonEncode(settlePayload),
            status: const Value('pending'),
            retryCount: const Value(0),
            createdAt: Value(now),
          ),
        );
      }
    });
  }

  /// Atomically updates a table's status (e.g. seated, vacant, dirty) and queues UPDATE_TABLE_STATUS in SyncOutbox
  Future<void> markTableStatusAtomic({
    required String tableId,
    required String status,
    required String tenantId,
    required String branchId,
    required String deviceId,
    int? guestCount,
  }) async {
    final now = DateTime.now();

    String resolvedTableId = tableId;
    String resolvedTableNumber = tableId;
    final tblRow = await _resolveTable(tableId, tenantId: tenantId, branchId: branchId);
    if (tblRow != null) {
      resolvedTableId = tblRow.id;
      resolvedTableNumber = tblRow.tableNumber;
    }

    final statusPayload = {
      'tableId': resolvedTableId,
      'tableNumber': resolvedTableNumber,
      'status': status,
      'branchId': branchId,
      if (guestCount != null && guestCount > 0) 'guestCount': guestCount,
    };

    await _db.transaction(() async {
      await (_db.update(_db.localRestaurantTables)
            ..where((t) => (t.id.equals(resolvedTableId) | t.id.equals(tableId) | t.tableNumber.equals(resolvedTableNumber)) &
                (tenantId.isNotEmpty ? t.tenantId.equals(tenantId) : const Constant(true))))
          .write(
        LocalRestaurantTablesCompanion(
          status: Value(status),
          currentGuestCount: guestCount != null && guestCount > 0
              ? Value(guestCount)
              : (status == 'vacant' ? const Value(0) : const Value.absent()),
          occupiedAt: status == 'vacant'
              ? const Value(null)
              : (status == 'seated' && tblRow?.occupiedAt == null ? Value(now) : const Value.absent()),
          updatedAt: Value(now),
        ),
      );

      await _db.into(_db.syncOutbox).insert(
        SyncOutboxCompanion.insert(
          operationId: const Uuid().v4(),
          deviceId: deviceId,
          sequence: _outboxSequence++,
          operationType: 'UPDATE_TABLE_STATUS',
          schemaVersion: const Value(1),
          payload: jsonEncode(statusPayload),
          status: const Value('pending'),
          retryCount: const Value(0),
          createdAt: Value(now),
        ),
      );
    });
  }

  /// Atomically transfers an active order and table status to a target table and queues TRANSFER_TABLE in SyncOutbox
  Future<void> transferTableAtomic({
    required String sourceTableId,
    required String targetTableId,
    required String tenantId,
    required String branchId,
    required String deviceId,
  }) async {
    final now = DateTime.now();

    final sourceRow = await _resolveTable(sourceTableId, tenantId: tenantId, branchId: branchId);
    final targetRow = await _resolveTable(targetTableId, tenantId: tenantId, branchId: branchId);

    final resolvedSourceId = sourceRow?.id ?? sourceTableId;
    final resolvedTargetId = targetRow?.id ?? targetTableId;

    final transferPayload = {
      'sourceTableId': resolvedSourceId,
      'targetTableId': resolvedTargetId,
      'branchId': branchId,
    };

    await _db.transaction(() async {
      // 1. Move active orders from source to target
      await (_db.update(_db.localRestaurantOrders)
            ..where((o) => (o.tableId.equals(resolvedSourceId) | o.tableId.equals(sourceTableId) | o.tableNumberSnapshot.equals(sourceRow?.tableNumber ?? sourceTableId)) &
                (tenantId.isNotEmpty ? o.tenantId.equals(tenantId) : const Constant(true)))
            ..where((o) => o.status.isIn(const ['open', 'billed', 'ordered'])))
          .write(
        LocalRestaurantOrdersCompanion(
          tableId: Value(resolvedTargetId),
          tableNumberSnapshot: Value(targetRow?.tableNumber ?? targetTableId),
          sectionSnapshot: Value(targetRow?.section ?? 'Main Dining'),
        ),
      );

      // 2. Set target table status to source table status
      final currentStatus = sourceRow?.status ?? 'seated';
      await (_db.update(_db.localRestaurantTables)
            ..where((t) => (t.id.equals(resolvedTargetId) | t.id.equals(targetTableId)) &
                (tenantId.isNotEmpty ? t.tenantId.equals(tenantId) : const Constant(true))))
          .write(
        LocalRestaurantTablesCompanion(
          status: Value(currentStatus),
          currentGuestCount: Value(sourceRow?.currentGuestCount ?? 2),
          occupiedAt: Value(sourceRow?.occupiedAt ?? now),
          updatedAt: Value(now),
        ),
      );

      // 3. Set source table to vacant
      await (_db.update(_db.localRestaurantTables)
            ..where((t) => (t.id.equals(resolvedSourceId) | t.id.equals(sourceTableId)) &
                (tenantId.isNotEmpty ? t.tenantId.equals(tenantId) : const Constant(true))))
          .write(
        LocalRestaurantTablesCompanion(
          status: const Value('vacant'),
          currentGuestCount: const Value(0),
          occupiedAt: const Value(null),
          updatedAt: Value(now),
        ),
      );

      // 4. Queue TRANSFER_TABLE outbox mutation
      await _db.into(_db.syncOutbox).insert(
        SyncOutboxCompanion.insert(
          operationId: const Uuid().v4(),
          deviceId: deviceId,
          sequence: _outboxSequence++,
          operationType: 'TRANSFER_TABLE',
          schemaVersion: const Value(1),
          payload: jsonEncode(transferPayload),
          status: const Value('pending'),
          retryCount: const Value(0),
          createdAt: Value(now),
        ),
      );
    });
  }

  /// Update table status locally without queuing external outbox mutation
  Future<void> updateTableStatus(String tableId, String status) async {
    try {
      await (_db.update(_db.localRestaurantTables)
            ..where((t) => t.id.equals(tableId) | t.tableNumber.equals(tableId)))
          .write(
        LocalRestaurantTablesCompanion(
          status: Value(status),
          updatedAt: Value(DateTime.now()),
        ),
      );
    } catch (_) {}
  }

  /// Purges local SQLite records for a tenant on logout or account switch
  Future<void> clearAllTenantData(String tenantId) async {
    if (tenantId.isEmpty) return;
    await (_db.delete(_db.localRestaurantTables)..where((t) => t.tenantId.equals(tenantId))).go();
    await (_db.delete(_db.localRestaurantOrders)..where((t) => t.tenantId.equals(tenantId))).go();
    await (_db.delete(_db.localRestaurantKotLines)..where((t) => t.tenantId.equals(tenantId))).go();
  }

  /// Global purge of any orphaned or legacy tables
  Future<void> clearAllTablesGlobally() async {
    await _db.delete(_db.localRestaurantTables).go();
    await _db.delete(_db.localRestaurantOrders).go();
    await _db.delete(_db.localRestaurantKotLines).go();
  }
}
