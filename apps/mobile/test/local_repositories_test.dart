import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/repositories/local_billing_repository.dart';
import 'package:pos_mobile/core/repositories/local_catalog_repository.dart';
import 'package:pos_mobile/core/repositories/local_customer_repository.dart';
import 'package:pos_mobile/core/services/offline_billing_service.dart';
import 'package:pos_mobile/core/models/cart_item.dart';
import 'package:pos_mobile/core/models/product.dart';

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
  });

  tearDown(() async {
    await db.close();
  });

  group('LocalCatalogRepository Tests', () {
    test('seeds initial catalog into SQLite idempotently', () async {
      await catalogRepo.seedInitialProductsIfEmpty();
      final products = await catalogRepo.getAllProducts();
      expect(products.length, 6);

      // Re-running seed must be idempotent (Rule 12)
      await catalogRepo.seedInitialProductsIfEmpty();
      final productsAfter = await catalogRepo.getAllProducts();
      expect(productsAfter.length, 6);
    });

    test('finds product by barcode or SKU and deducts stock in SQLite', () async {
      await catalogRepo.seedInitialProductsIfEmpty();

      final byBarcode = await catalogRepo.findByBarcodeOrSku('890103000001');
      expect(byBarcode, isNotNull);
      expect(byBarcode!.name, 'Aashirvaad Atta 5kg');
      expect(byBarcode.currentStock, 50.0);

      final bySku = await catalogRepo.findByBarcodeOrSku('GROC-001');
      expect(bySku, isNotNull);
      expect(bySku!.id, byBarcode.id);

      // Deduct stock in SQLite
      await catalogRepo.deductStock(byBarcode.id, 5.0);
      final updated = await catalogRepo.findByBarcodeOrSku('890103000001');
      expect(updated!.currentStock, 45.0);
    });

    test('identifies low stock products with threshold <= 5.0', () async {
      await catalogRepo.seedInitialProductsIfEmpty();

      final lowStock = await catalogRepo.getLowStockProducts(threshold: 5.0);
      expect(lowStock.length, 2); // Amul Butter (4.0) & Maggi Masala (3.0)
      expect(lowStock.any((p) => p.name.contains('Butter')), isTrue);
      expect(lowStock.any((p) => p.name.contains('Maggi')), isTrue);
    });
  });

  group('LocalCustomerRepository & Khata Ledger Tests', () {
    test('seeds initial customers and calculates total Khata due', () async {
      await customerRepo.seedInitialCustomersIfEmpty();
      final customers = await customerRepo.getAllCustomers();
      expect(customers.length, 3);

      final totalDuePaisa = await customerRepo.getTotalKhataOutstandingPaisa();
      // Ramesh (125000) + Pooja (42000) + Suresh (0) = 167000 Paisa (₹1,670.00)
      expect(totalDuePaisa, 167000);
    });

    test('creates new customer record and updates Khata debt balance', () async {
      await customerRepo.seedInitialCustomersIfEmpty();

      final newCust = await customerRepo.createCustomer(
        name: 'Anita Desai',
        phone: '+919876543299',
        creditLimitPaisa: 500000,
      );

      expect(newCust.name, 'Anita Desai');
      expect(newCust.phone, '+919876543299');
      expect(newCust.currentBalancePaisa, 0);

      // Adjust Khata balance
      await customerRepo.adjustCustomerBalance(newCust.id, 45000); // +₹450.00 debt
      final fetched = await customerRepo.getCustomerById(newCust.id);
      expect(fetched!.currentBalancePaisa, 45000);
      expect(fetched.currentBalanceRupees, 450.0);
    });
  });

  group('LocalBillingRepository Today Metrics Tests', () {
    test('computes live daily sales performance metrics from real SQLite transactions', () async {
      await catalogRepo.seedInitialProductsIfEmpty();
      await customerRepo.seedInitialCustomersIfEmpty();

      final products = await catalogRepo.getAllProducts();
      final atta = products.firstWhere((p) => p.id == 'prod-1');

      // Process a sale for ₹240.00 via Cash
      await billingRepo.createSaleAtomic(
        items: [
          CartItem(product: atta, quantity: 1),
        ],
        paymentMethod: 'cash',
      );

      // Process another sale for ₹480.00 via UPI
      await billingRepo.createSaleAtomic(
        items: [
          CartItem(product: atta, quantity: 2),
        ],
        paymentMethod: 'upi',
      );

      // Process a Khata sale for Ramesh Sharma
      final ramesh = (await customerRepo.getAllCustomers()).firstWhere((c) => c.name.contains('Ramesh'));
      await billingRepo.createSaleAtomic(
        items: [
          CartItem(product: atta, quantity: 1),
        ],
        paymentMethod: 'khata',
        customerId: ramesh.id,
        customerName: ramesh.name,
      );

      final metrics = await billingRepo.getTodayMetrics();
      expect(metrics['billCount'], 3);
      // Item price = 24000 paisa, tax at 5% = 1200 paisa, total per item = 25200 paisa
      // 1 item sale = 25200
      // 2 items sale = 50400
      // 1 item khata sale = 25200
      // Total = 100800 paisa (₹1,008.00)
      expect(metrics['grossSalesPaisa'], 100800);
      expect(metrics['cashPaisa'], 25200);
      expect(metrics['upiPaisa'], 50400);
      expect(metrics['khataPaisa'], 25200);

      // Verify Ramesh's balance was atomically updated in SQLite (Rule 13)
      final rameshAfter = await customerRepo.getCustomerById(ramesh.id);
      expect(rameshAfter!.currentBalancePaisa, ramesh.currentBalancePaisa + 25200);
    });
  });
}
