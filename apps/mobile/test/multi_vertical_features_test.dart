import 'package:flutter_test/flutter_test.dart';
import 'package:drift/native.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/models/cart_item.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/providers/restaurant_provider.dart';
import 'package:pos_mobile/core/repositories/local_billing_repository.dart';
import 'package:pos_mobile/core/repositories/local_catalog_repository.dart';
import 'package:pos_mobile/core/repositories/local_customer_repository.dart';
import 'package:pos_mobile/core/services/offline_billing_service.dart';

void main() {
  late AppDatabase db;
  late LocalCatalogRepository catalogRepo;
  late LocalCustomerRepository customerRepo;
  late LocalBillingRepository billingRepo;

  setUp(() async {
    db = AppDatabase.inMemory();
    catalogRepo = LocalCatalogRepository(db);
    customerRepo = LocalCustomerRepository(db);
    billingRepo = LocalBillingRepository(db);
    OfflineBillingService.setDatabase(db);

    await catalogRepo.seedInitialProductsIfEmpty();
    await customerRepo.seedInitialCustomersIfEmpty();
  });

  tearDown(() async {
    await db.close();
  });

  group('Inventory Management Feature Tests', () {
    test('creates new product and writes initial stock ledger movement', () async {
      final product = await catalogRepo.createProduct(
        name: 'Tata Tea Gold 500g',
        sku: 'TEA-001',
        barcode: '890103009999',
        category: 'Beverages',
        sellingPricePaisa: 32000,
        purchaseCostPaisa: 28000,
        gstRate: 5.0,
        initialStock: 25.0,
      );

      expect(product.name, 'Tata Tea Gold 500g');
      expect(product.sellingPricePaisa, 32000);
      expect(product.currentStock, 25.0);

      // Verify product is in SQLite database
      final found = await catalogRepo.findByBarcodeOrSku('890103009999');
      expect(found, isNotNull);
      expect(found!.sku, 'TEA-001');

      // Verify stock movement ledger
      final movements = await (db.select(db.localStockMovements)
            ..where((m) => m.productId.equals(product.id)))
          .get();
      expect(movements.length, 1);
      expect(movements.first.movementType, 'initial_stock');
      expect(movements.first.quantity, 25.0);
    });

    test('adjusts stock atomically with restock and damage write-off', () async {
      final initial = (await catalogRepo.getAllProducts()).first;
      final startStock = initial.currentStock;

      // Restock +15 units
      await catalogRepo.adjustStock(
        productId: initial.id,
        delta: 15.0,
        reason: 'Supplier Restock Shipment',
      );

      var updated = await catalogRepo.findByBarcodeOrSku(initial.sku);
      expect(updated!.currentStock, startStock + 15.0);

      // Write-off -3 damaged units
      await catalogRepo.adjustStock(
        productId: initial.id,
        delta: -3.0,
        reason: 'Broken in Store',
      );

      updated = await catalogRepo.findByBarcodeOrSku(initial.sku);
      expect(updated!.currentStock, startStock + 12.0);

      // Verify outbox queued both adjustments
      final outbox = await (db.select(db.syncOutbox)
            ..where((o) => o.operationType.equals('STOCK_ADJUSTMENT')))
          .get();
      expect(outbox.length, 2);
    });
  });

  group('Customer Khata Ledger Feature Tests', () {
    test('calculates total outstanding Khata market debt', () async {
      final totalPaisa = await customerRepo.getTotalKhataOutstandingPaisa();
      // c-1 has 125000 paisa, c-2 has 42000 paisa, c-3 has 0
      expect(totalPaisa, 167000); // ₹1,670.00
    });

    test('records partial customer repayment and updates SQLite balance', () async {
      final customers = await customerRepo.getAllCustomers();
      final ramesh = customers.firstWhere((c) => c.name == 'Ramesh Sharma');
      expect(ramesh.currentBalancePaisa, 125000); // ₹1,250.00

      // Ramesh pays ₹500.00 (50000 paisa) in Cash
      final remaining = await customerRepo.recordRepayment(
        customerId: ramesh.id,
        amountPaisa: 50000,
        paymentMethod: 'cash',
      );

      expect(remaining, 75000); // ₹750.00 remaining

      // Verify customer record updated in SQLite
      final updated = await customerRepo.getCustomerById(ramesh.id);
      expect(updated!.currentBalancePaisa, 75000);

      // Verify sync outbox has CUSTOMER_REPAYMENT
      final outbox = await (db.select(db.syncOutbox)
            ..where((o) => o.operationType.equals('CUSTOMER_REPAYMENT')))
          .get();
      expect(outbox.length, 1);
      expect(outbox.first.payload, contains('Ramesh Sharma'));
    });
  });

  group('Order & Bill History Feature Tests', () {
    test('reconstructs receipt document with DUPLICATE marker for past bills', () async {
      final products = await catalogRepo.getAllProducts();
      final sale = await billingRepo.createSaleAtomic(
        items: [
          CartItem(product: products[0], quantity: 2),
          CartItem(product: products[1], quantity: 1),
        ],
        paymentMethod: 'cash',
        customerName: 'Anil Kumar',
      );

      final invoices = await billingRepo.getAllInvoices();
      expect(invoices.isNotEmpty, isTrue);

      final doc = await billingRepo.getReceiptDocument(sale.invoiceId);
      expect(doc, isNotNull);
      expect(doc!.meta.invoiceNumber, sale.invoiceNumber);
      expect(doc.meta.isReprint, isTrue);
      expect(doc.lines.length, 2);
      expect(doc.totals.grandTotalPaisa, sale.totalPaisa);
    });
  });

  group('Restaurant Vertical State Machine Tests', () {
    test('manages dining table lifecycle from vacant to occupied to settled', () {
      final notifier = RestaurantNotifier();
      var state = notifier.state;

      expect(state.tables.length, 8);
      final t1 = state.tables.first;
      expect(t1.status, TableStatus.vacant);

      const foodItem = Product(
        id: 'food-1',
        name: 'Paneer Butter Masala',
        sku: 'DISH-001',
        category: 'Main Course',
        unit: 'PLATE',
        sellingPricePaisa: 28000,
        purchaseCostPaisa: 20000,
        gstRate: 5,
        currentStock: 50.0,
      );

      // Add 2 dishes to Table 1
      notifier.addItemToTable(t1.id, foodItem, qty: 2);
      state = notifier.state;
      final updatedT1 = state.tables.firstWhere((t) => t.id == t1.id);

      expect(updatedT1.status, TableStatus.occupied);
      expect(updatedT1.itemCount, 2);
      expect(updatedT1.runningTotalPaisa, 58800); // ₹560.00 subtotal + 5% GST (₹28.00) = ₹588.00
      expect(state.occupiedCount, 1);

      // Settle and vacate table
      notifier.clearAndVacateTable(t1.id);
      state = notifier.state;
      final vacatedT1 = state.tables.firstWhere((t) => t.id == t1.id);

      expect(vacatedT1.status, TableStatus.vacant);
      expect(vacatedT1.itemCount, 0);
      expect(vacatedT1.runningTotalPaisa, 0);
      expect(state.occupiedCount, 0);
    });
  });
}
