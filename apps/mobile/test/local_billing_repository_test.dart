import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/models/cart_item.dart';
import 'package:pos_mobile/core/repositories/local_billing_repository.dart';
import 'package:pos_mobile/core/services/offline_billing_service.dart';

void main() {
  late AppDatabase db;
  late LocalBillingRepository repo;

  const sampleProduct1 = Product(
    id: 'prod-atta-1',
    name: 'Aashirvaad Atta 5kg',
    sku: 'GROC-001',
    barcode: '890103000001',
    category: 'Groceries',
    unit: 'PKT',
    sellingPricePaisa: 24000, // ₹240.00
    purchaseCostPaisa: 21000,
    gstRate: 5,
    currentStock: 50.0,
  );

  const sampleProduct2 = Product(
    id: 'prod-butter-2',
    name: 'Amul Butter 500g',
    sku: 'DAIRY-001',
    barcode: '890103000002',
    category: 'Dairy',
    unit: 'PKT',
    sellingPricePaisa: 27500, // ₹275.00
    purchaseCostPaisa: 24500,
    gstRate: 12,
    currentStock: 20.0,
  );

  setUp(() async {
    db = AppDatabase.inMemory();
    repo = LocalBillingRepository(db);
    OfflineBillingService.setDatabase(db);

    // Seed local products table
    await db.into(db.localProducts).insert(
      LocalProductsCompanion.insert(
        id: sampleProduct1.id,
        tenantId: 'tenant-1',
        sku: sampleProduct1.sku,
        name: sampleProduct1.name,
        sellingPricePaisa: sampleProduct1.sellingPricePaisa,
        stockQuantity: Value(sampleProduct1.currentStock),
        gstRatePercent: Value(sampleProduct1.gstRate.toDouble()),
      ),
    );

    await db.into(db.localProducts).insert(
      LocalProductsCompanion.insert(
        id: sampleProduct2.id,
        tenantId: 'tenant-1',
        sku: sampleProduct2.sku,
        name: sampleProduct2.name,
        sellingPricePaisa: sampleProduct2.sellingPricePaisa,
        stockQuantity: Value(sampleProduct2.currentStock),
        gstRatePercent: Value(sampleProduct2.gstRate.toDouble()),
      ),
    );
  });

  tearDown(() async {
    await db.close();
  });

  group('LocalBillingRepository (Drift SQLite Offline Engine)', () {
    test('atomically writes invoice, lines, payment, stock ledger, and outbox', () async {
      const items = [
        CartItem(product: sampleProduct1, quantity: 2), // 2 * 24000 = 48000
        CartItem(product: sampleProduct2, quantity: 1), // 1 * 27500 = 27500
      ];

      final result = await repo.createSaleAtomic(
        items: items,
        paymentMethod: 'cash',
        customerName: 'Ramesh Sharma',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        deviceId: 'terminal-android-01',
      );

      // Verify result metadata (includes statutory GST: ₹480 + 5% = ₹504, ₹275 + 12% = ₹308 -> ₹812.00)
      expect(result.invoiceId, isNotEmpty);
      expect(result.invoiceNumber, startsWith('INV-'));
      expect(result.paymentMethod, equals('cash'));
      expect(result.totalPaisa, equals(81200)); // ₹812.00 (with GST)
      expect(result.totalRupees, equals(812.0));
      expect(result.receiptText, contains('KIRANA SUPERMART'));
      expect(result.receiptText, contains('Ramesh Sharma'));

      // 1. Verify invoice in SQLite
      final invoices = await repo.getAllInvoices();
      expect(invoices.length, equals(1));
      final inv = invoices.first;
      expect(inv.id, equals(result.invoiceId));
      expect(inv.grandTotalPaisa, equals(81200));
      expect(inv.customerName, equals('Ramesh Sharma'));
      expect(inv.paymentMethod, equals('cash'));
      expect(inv.status, equals('completed'));

      // 2. Verify invoice lines in SQLite
      final lines = await repo.getInvoiceLines(result.invoiceId);
      expect(lines.length, equals(2));
      expect(lines.any((l) => l.productId == sampleProduct1.id && l.quantity == 2), isTrue);
      expect(lines.any((l) => l.productId == sampleProduct2.id && l.quantity == 1), isTrue);

      // 3. Verify payment in SQLite
      final payments = await db.select(db.localPayments).get();
      expect(payments.length, equals(1));
      expect(payments.first.invoiceId, equals(result.invoiceId));
      expect(payments.first.amountPaisa, equals(81200));
      expect(payments.first.paymentMethod, equals('cash'));

      // 4. Verify stock movements in SQLite (Rule 15: Ledger movements)
      final movements = await db.select(db.localStockMovements).get();
      expect(movements.length, equals(2));
      expect(movements.every((m) => m.referenceId == result.invoiceId), isTrue);
      expect(movements.firstWhere((m) => m.productId == sampleProduct1.id).quantity, equals(-2.0));
      expect(movements.firstWhere((m) => m.productId == sampleProduct2.id).quantity, equals(-1.0));

      // 5. Verify product on-hand stock projection updated in SQLite
      final product1 = await (db.select(db.localProducts)..where((p) => p.id.equals(sampleProduct1.id))).getSingle();
      final product2 = await (db.select(db.localProducts)..where((p) => p.id.equals(sampleProduct2.id))).getSingle();
      expect(product1.stockQuantity, equals(48.0)); // 50 - 2
      expect(product2.stockQuantity, equals(19.0)); // 20 - 1

      // 6. Verify SyncOutbox operation created with pending status
      final outbox = await repo.getPendingOutbox();
      expect(outbox.length, equals(1));
      final op = outbox.first;
      expect(op.operationType, equals('CREATE_SALE'));
      expect(op.status, equals('pending'));
      expect(op.deviceId, equals('terminal-android-01'));
      expect(op.payload, contains('INV-'));
      expect(op.payload, contains(sampleProduct1.id));
    });

    test('updates outbox status when acknowledged by central server', () async {
      const items = [CartItem(product: sampleProduct1, quantity: 1)];

      await repo.createSaleAtomic(
        items: items,
        paymentMethod: 'upi',
      );

      final pending = await repo.getPendingOutbox();
      expect(pending.length, equals(1));
      final opId = pending.first.operationId;

      // Mark accepted with central server invoice ID
      await repo.markOutboxAccepted(opId, 'server-inv-999');

      final remaining = await repo.getPendingOutbox();
      expect(remaining.isEmpty, isTrue);

      final accepted = await (db.select(db.syncOutbox)..where((o) => o.operationId.equals(opId))).getSingle();
      expect(accepted.status, equals('accepted'));
      expect(accepted.serverEntityId, equals('server-inv-999'));
    });

    test('OfflineBillingService delegates to SQLite LocalBillingRepository', () async {
      const items = [CartItem(product: sampleProduct2, quantity: 2)];

      final result = await OfflineBillingService.processSale(
        items: items,
        paymentMethod: 'khata',
        customerName: 'Pooja Verma',
      );

      expect(result.invoiceId, isNotEmpty);
      expect(result.totalPaisa, equals(61600)); // 2 * 27500 + 12% GST = 61600

      final invoices = await repo.getAllInvoices();
      expect(invoices.length, equals(1));
      expect(invoices.first.customerName, equals('Pooja Verma'));
    });
  });
}
