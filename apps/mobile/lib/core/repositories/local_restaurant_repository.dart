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

  /// Get active CartItems for a table from SQLite (hydrates dishes from KOT lines)
  Future<List<CartItem>> getTableActiveCartItems(String tableId) async {
    try {
      final matchingTable = await (_db.select(_db.localRestaurantTables)
            ..where((t) => t.id.equals(tableId) | t.tableNumber.equals(tableId)))
          .getSingleOrNull();

      final targetIds = {tableId};
      if (matchingTable != null) {
        targetIds.add(matchingTable.id);
        targetIds.add(matchingTable.tableNumber);
      }

      final activeOrders = await (_db.select(_db.localRestaurantOrders)
            ..where((o) => o.tableId.isIn(targetIds) | o.tableNumberSnapshot.isIn(targetIds))
            ..where((o) => o.status.isIn(const ['open', 'billed', 'ordered']))
            ..orderBy([(o) => OrderingTerm(expression: o.openedAt, mode: OrderingMode.desc)]))
          .get();

      if (activeOrders.isEmpty) return [];

      final activeOrderIds = activeOrders.map((o) => o.id).toList();
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
    required String orderId,
    required List<CartItem> lines,
    required String captainName,
    required String tenantId,
    required String branchId,
    required String deviceId,
  }) async {
    final kotId = const Uuid().v4();
    final now = DateTime.now();

    final syncPayload = {
      'orderId': orderId,
      'tableId': tableId,
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
            ..where((t) => t.id.equals(tableId) | t.tableNumber.equals(tableId)))
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
              ..where((o) => o.tableId.equals(tableId) | o.tableNumberSnapshot.equals(tableId))
              ..where((o) => o.status.isIn(const ['open', 'billed', 'ordered']))
              ..orderBy([(o) => OrderingTerm(expression: o.openedAt, mode: OrderingMode.desc)]))
            .get();

        if (activeOrderForTable.isEmpty) {
          final isTakeaway = tableId.startsWith('TAK-') || tableId.toLowerCase().contains('takeaway');
          await _db.into(_db.localRestaurantOrders).insertOnConflictUpdate(
            LocalRestaurantOrdersCompanion(
              id: Value(orderId),
              tenantId: Value(tenantId),
              branchId: Value(branchId),
              orderNumber: Value('ORD-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}'),
              orderType: Value(isTakeaway ? 'takeaway' : 'dine_in'),
              tableId: Value(tableId),
              tableNumberSnapshot: Value(tableId),
              sectionSnapshot: const Value('Main Dining'),
              guestCount: const Value(2),
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

      // 3. Queue DISPATCH_KOT outbox operation
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

    final statusPayload = {
      'tableId': tableId,
      'status': 'billed',
      'branchId': branchId,
    };

    await _db.transaction(() async {
      await (_db.update(_db.localRestaurantTables)
            ..where((t) => t.id.equals(tableId) | t.tableNumber.equals(tableId)))
          .write(
        LocalRestaurantTablesCompanion(
          status: const Value('billed'),
          updatedAt: Value(now),
        ),
      );

      // Also mark active orders for this table as billed in local SQLite
      await (_db.update(_db.localRestaurantOrders)
            ..where((o) => o.tableId.equals(tableId) | o.tableNumberSnapshot.equals(tableId))
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

  /// Atomically settle a restaurant table: marks table vacant, closes order, enqueues UPDATE_TABLE_STATUS
  Future<void> settleTableAtomic({
    required String tableId,
    required String tenantId,
    required String branchId,
    required String deviceId,
    String? orderId,
    String? invoiceId,
  }) async {
    final now = DateTime.now();

    final statusPayload = {
      'tableId': tableId,
      'status': 'vacant',
      'branchId': branchId,
    };

    await _db.transaction(() async {
      // 1. Update local table to vacant
      await (_db.update(_db.localRestaurantTables)
            ..where((t) => t.id.equals(tableId) | t.tableNumber.equals(tableId)))
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
              ..where((o) => o.tableId.equals(tableId) | o.tableNumberSnapshot.equals(tableId))
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
}
