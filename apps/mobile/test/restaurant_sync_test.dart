import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/models/cart_item.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/models/sync_models.dart';
import 'package:pos_mobile/core/repositories/local_restaurant_repository.dart';
import 'package:drift/drift.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late AppDatabase db;
  late LocalRestaurantRepository repo;

  final testProductDosa = Product(
    id: 'prod-masala-dosa',
    name: 'Special Masala Dosa',
    sku: 'DOSA-01',
    category: 'South Indian',
    unit: 'PLATE',
    sellingPricePaisa: 12000, // ₹120.00
    purchaseCostPaisa: 5000,
    gstRate: 5,
    currentStock: 40,
  );

  setUp(() async {
    db = AppDatabase.inMemory();
    repo = LocalRestaurantRepository(db);

    // Seed test table
    await db.into(db.localRestaurantTables).insert(
      LocalRestaurantTablesCompanion.insert(
        id: 'tbl-test-1',
        tenantId: 'tenant-rest-1',
        branchId: 'branch-main-1',
        tableNumber: 'T-01',
        name: const Value('Window Table 1'),
        section: const Value('AC Hall'),
        seatingCapacity: const Value(4),
        status: const Value('seated'),
        currentGuestCount: const Value(2),
      ),
    );
  });

  tearDown(() async {
    await db.close();
  });

  group('LocalRestaurantRepository Offline SQLite & Outbox Invariants', () {
    test('getAllTables returns tables persisted in SQLite', () async {
      final tables = await repo.getAllTables(tenantId: 'tenant-rest-1');
      expect(tables.length, 1);
      expect(tables.first.tableNumber, 'T-01');
      expect(tables.first.name, 'Window Table 1');
      expect(tables.first.status, 'seated');
      expect(tables.first.seatingCapacity, 4);
    });

    test('dispatchKotAtomic updates table to ordered and queues DISPATCH_KOT in SyncOutbox atomically', () async {
      final lines = [
        CartItem(product: testProductDosa, quantity: 2, notes: 'Extra crispy, less butter'),
      ];

      final kotId = await repo.dispatchKotAtomic(
        tableId: 'tbl-test-1',
        orderId: 'ord-test-01',
        lines: lines,
        captainName: 'Ravi Captain',
        tenantId: 'tenant-rest-1',
        branchId: 'branch-main-1',
        deviceId: 'pos-tab-01',
      );

      expect(kotId, isNotEmpty);

      // 1. Verify table status changed to 'ordered' in SQLite
      final table = await (db.select(db.localRestaurantTables)..where((t) => t.id.equals('tbl-test-1'))).getSingle();
      expect(table.status, 'ordered');

      // 2. Verify KOT lines persisted locally
      final kotLines = await repo.getTableKotLines('ord-test-01');
      expect(kotLines.length, 1);
      expect(kotLines.first.productName, 'Special Masala Dosa');
      expect(kotLines.first.specialInstructions, 'Extra crispy, less butter');
      expect(kotLines.first.quantity, 2.0);

      // 3. Verify SyncOutbox contains DISPATCH_KOT mutation
      final outboxItems = await db.select(db.syncOutbox).get();
      expect(outboxItems.length, 1);
      expect(outboxItems.first.operationType, 'DISPATCH_KOT');
      expect(outboxItems.first.status, 'pending');

      final payload = jsonDecode(outboxItems.first.payload) as Map<String, dynamic>;
      expect(payload['tableId'], 'tbl-test-1');
      expect(payload['orderId'], 'ord-test-01');
      expect(payload['captainName'], 'Ravi Captain');
      expect((payload['lines'] as List).length, 1);
      expect((payload['lines'] as List).first['productName'], 'Special Masala Dosa');
    });

    test('settleTableAtomic vacates table, closes order, and queues UPDATE_TABLE_STATUS mutation', () async {
      // First insert an active open order
      await db.into(db.localRestaurantOrders).insert(
        LocalRestaurantOrdersCompanion.insert(
          id: 'ord-test-01',
          tenantId: 'tenant-rest-1',
          branchId: 'branch-main-1',
          orderNumber: 'ORD-001',
          tableId: const Value('tbl-test-1'),
          status: const Value('open'),
        ),
      );

      await repo.settleTableAtomic(
        tableId: 'tbl-test-1',
        tenantId: 'tenant-rest-1',
        branchId: 'branch-main-1',
        deviceId: 'pos-tab-01',
        orderId: 'ord-test-01',
        invoiceId: 'inv-uuid-888',
      );

      // 1. Table status reset to vacant
      final table = await (db.select(db.localRestaurantTables)..where((t) => t.id.equals('tbl-test-1'))).getSingle();
      expect(table.status, 'vacant');
      expect(table.currentGuestCount, 0);

      // 2. Order status closed
      final order = await (db.select(db.localRestaurantOrders)..where((o) => o.id.equals('ord-test-01'))).getSingle();
      expect(order.status, 'completed');
      expect(order.invoiceId, 'inv-uuid-888');

      // 3. SyncOutbox has UPDATE_TABLE_STATUS
      final outboxItems = await (db.select(db.syncOutbox)..where((o) => o.operationType.equals('UPDATE_TABLE_STATUS'))).get();
      expect(outboxItems.length, 1);
      final payload = jsonDecode(outboxItems.first.payload) as Map<String, dynamic>;
      expect(payload['tableId'], 'tbl-test-1');
      expect(payload['status'], 'vacant');
    });

    test('SyncPullDeltaResult deserializes incoming restaurantTables and restaurantOrders', () {
      final json = {
        'cursor': '2026-11-15T12:00:00Z',
        'hasMore': false,
        'categories': [],
        'products': [],
        'customers': [],
        'invoices': [],
        'restaurantTables': [
          {
            'id': 'tbl-cloud-1',
            'tenantId': 'tenant-rest-1',
            'tableNumber': 'T-02',
            'status': 'seated',
            'seatingCapacity': 6,
          }
        ],
        'restaurantOrders': [
          {
            'id': 'ord-cloud-1',
            'orderNumber': 'ORD-101',
            'status': 'open',
            'subtotal': '500.00',
            'lines': [],
          }
        ],
      };

      final result = SyncPullDeltaResult.fromJson(json);
      expect(result.restaurantTables.length, 1);
      expect(result.restaurantTables.first['tableNumber'], 'T-02');
      expect(result.restaurantOrders.length, 1);
      expect(result.restaurantOrders.first['orderNumber'], 'ORD-101');
    });

    test('updateTableStatus updates local table status in SQLite', () async {
      await repo.updateTableStatus('tbl-test-1', 'seated');
      final updated = await (db.select(db.localRestaurantTables)..where((t) => t.id.equals('tbl-test-1'))).getSingle();
      expect(updated.status, 'seated');

      await repo.updateTableStatus('tbl-test-1', 'vacant');
      final vacantTbl = await (db.select(db.localRestaurantTables)..where((t) => t.id.equals('tbl-test-1'))).getSingle();
      expect(vacantTbl.status, 'vacant');
    });
  });
}
