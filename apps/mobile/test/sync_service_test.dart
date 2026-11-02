import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/models/cart_item.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/models/sync_models.dart';
import 'package:pos_mobile/core/providers/sync_provider.dart';
import 'package:pos_mobile/core/repositories/auth_repository.dart';
import 'package:pos_mobile/core/repositories/local_billing_repository.dart';
import 'package:pos_mobile/core/repositories/sync_repository.dart';
import 'package:pos_mobile/core/services/offline_billing_service.dart';
import 'package:pos_mobile/core/services/sync_worker.dart';
import 'package:pos_mobile/features/pos/pos_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockSyncRepository extends SyncRepository {
  final List<SyncOutboxData> pushedBatches = [];
  bool shouldFailPush = false;
  bool shouldFailPull = false;

  MockSyncRepository() : super(authRepo: AuthRepository());

  @override
  Future<SyncPushResult> pushBatch(
    String tenantId,
    String deviceId,
    List<SyncOutboxData> operations,
  ) async {
    if (shouldFailPush) {
      throw Exception('Network unreachable');
    }

    pushedBatches.addAll(operations);
    return SyncPushResult(
      results: operations.map((op) {
        return SyncOperationAckResult(
          operationId: op.operationId,
          status: 'accepted',
          serverEntityId: 'server-ack-${op.operationId.substring(0, 8)}',
        );
      }).toList(),
      processedCount: operations.length,
    );
  }

  @override
  Future<SyncPullDeltaResult> pullDeltas(
    String tenantId, {
    String? cursor,
  }) async {
    if (shouldFailPull) {
      throw Exception('Pull network timeout');
    }

    return const SyncPullDeltaResult(
      cursor: '2026-11-01T20:00:00.000Z',
      hasMore: false,
      categories: [
        {'id': 'cat-sync-1', 'name': 'Bakery', 'tenantId': 'tenant-1'},
      ],
      products: [
        {
          'id': 'prod-sync-101',
          'tenantId': 'tenant-1',
          'sku': 'BREAD-400G',
          'name': 'Fresh Brown Bread 400g',
          'barcode': '890103009999',
          'sellingPrice': '45.00',
          'costPrice': '35.00',
          'mrp': '50.00',
          'gstRate': '0',
          'hsnCode': '190590',
          'unit': 'PKT',
          'updatedAt': '2026-11-01T19:55:00.000Z',
        },
      ],
    );
  }
}

void main() {
  late AppDatabase db;
  late MockSyncRepository mockRepo;
  late LocalBillingRepository billingRepo;
  late SyncWorker syncWorker;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    db = AppDatabase.inMemory();
    mockRepo = MockSyncRepository();
    billingRepo = LocalBillingRepository(db);
    syncWorker = SyncWorker(db: db, syncRepo: mockRepo);
    OfflineBillingService.setDatabase(db);
  });

  tearDown(() async {
    await db.close();
  });

  group('SyncWorker Offline-to-Backend Sync Engine', () {
    test('atomically pushes pending sales from SyncOutbox and marks as accepted', () async {
      // 1. Create an offline sale
      const sampleProduct = Product(
        id: 'p-1',
        name: 'Atta 5kg',
        sku: 'AT-5KG',
        category: 'Groceries',
        sellingPricePaisa: 21000,
        purchaseCostPaisa: 18000,
        gstRate: 0,
        currentStock: 10,
        unit: 'KG',
      );

      await billingRepo.createSaleAtomic(
        items: [const CartItem(product: sampleProduct, quantity: 2)],
        paymentMethod: 'cash',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        deviceId: 'device-test-01',
      );

      // Verify outbox has 1 pending row
      final initialPending = await syncWorker.getPendingCount();
      expect(initialPending, equals(1));

      // 2. Run synchronization cycle
      final result = await syncWorker.synchronize(
        tenantId: 'tenant-1',
        deviceId: 'device-test-01',
      );

      expect(result.isSuccess, isTrue);
      expect(result.pushedCount, equals(1));

      // Outbox status should now be accepted
      final outboxRows = await db.select(db.syncOutbox).get();
      expect(outboxRows.length, equals(1));
      expect(outboxRows.first.status, equals('accepted'));
      expect(outboxRows.first.serverEntityId, startsWith('server-ack-'));

      // Pending count should now be 0
      final finalPending = await syncWorker.getPendingCount();
      expect(finalPending, equals(0));
    });

    test('pulls catalog deltas and commits to SQLite before advancing cursor (Rule 14)', () async {
      final initialCursor = await syncWorker.getSyncCursor();
      expect(initialCursor, isNull);

      // Execute sync cycle (which triggers delta pull)
      final result = await syncWorker.synchronize(
        tenantId: 'tenant-1',
        deviceId: 'device-test-01',
      );

      expect(result.isSuccess, isTrue);
      expect(result.pulledProductsCount, equals(1));

      // Verify new product was upserted into LocalProducts table
      final products = await db.select(db.localProducts).get();
      expect(products.any((p) => p.id == 'prod-sync-101'), isTrue);

      final pulledBread = products.firstWhere((p) => p.id == 'prod-sync-101');
      expect(pulledBread.name, equals('Fresh Brown Bread 400g'));
      expect(pulledBread.sellingPricePaisa, equals(4500)); // ₹45.00 in Paisa

      // Rule 14: Verify cursor advanced only after local transaction commit
      final updatedCursor = await syncWorker.getSyncCursor();
      expect(updatedCursor, equals('2026-11-01T20:00:00.000Z'));

      final lastSync = await syncWorker.getLastSyncTime();
      expect(lastSync, isNotNull);
    });

    test('handles push failures with exponential retry count and preserves pending rows', () async {
      mockRepo.shouldFailPush = true;

      const sampleProduct = Product(
        id: 'p-2',
        name: 'Sugar 1kg',
        sku: 'SUG-1',
        category: 'Groceries',
        sellingPricePaisa: 4400,
        purchaseCostPaisa: 3800,
        gstRate: 5,
        currentStock: 20,
        unit: 'KG',
      );

      await billingRepo.createSaleAtomic(
        items: [const CartItem(product: sampleProduct, quantity: 1)],
        paymentMethod: 'upi',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        deviceId: 'device-test-01',
      );

      final result = await syncWorker.synchronize(
        tenantId: 'tenant-1',
        deviceId: 'device-test-01',
      );

      expect(result.isSuccess, isFalse);
      expect(result.error, contains('Outbox push error'));

      // Operation remains preserved in outbox with 'failed' status and incremented retryCount
      final outboxRows = await db.select(db.syncOutbox).get();
      expect(outboxRows.first.status, equals('failed'));
      expect(outboxRows.first.retryCount, equals(1));

      // Pending count still includes failed rows for automatic background retry
      final pending = await syncWorker.getPendingCount();
      expect(pending, equals(1));
    });

    testWidgets('displays Offline Ready badge and triggers manual sync from POS screen', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            appDatabaseProvider.overrideWithValue(db),
            syncWorkerProvider.overrideWithValue(syncWorker),
          ],
          child: const MaterialApp(
            home: MobilePosScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Find the sync status badge
      final syncBadge = find.byKey(const Key('pos_sync_badge'));
      expect(syncBadge, findsOneWidget);
      expect(find.text('Offline Ready'), findsOneWidget);

      // Tap sync badge to trigger manual synchronization
      await tester.tap(syncBadge);
      await tester.pump(); // Start sync

      // Pump through animation and completion
      await tester.pumpAndSettle();

      // Verify completion feedback snackbar
      expect(find.text('Synchronization complete!'), findsOneWidget);
    });
  });
}
