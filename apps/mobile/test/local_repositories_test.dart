import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/repositories/local_billing_repository.dart';
import 'package:pos_mobile/core/repositories/local_catalog_repository.dart';
import 'package:pos_mobile/core/repositories/local_customer_repository.dart';
import 'package:pos_mobile/core/services/offline_billing_service.dart';
import 'package:pos_mobile/core/models/cart_item.dart';

void main() {
  late AppDatabase db;
  late LocalCatalogRepository catalogRepo;
  late LocalCustomerRepository customerRepo;
  late LocalBillingRepository billingRepo;

  Future<void> _insertTestProducts() async {
    await catalogRepo.createProduct(
      sku: 'GROC-001',
      name: 'Aashirvaad Atta 5kg',
      barcode: '890103000001',
      sellingPricePaisa: 24000,
      purchaseCostPaisa: 21000,
      initialStock: 50.0,
      gstRate: 5.0,
      hsnCode: '11010000',
      category: 'Groceries',
      unit: 'PKT',
    );
    await catalogRepo.createProduct(
      sku: 'DAIRY-001',
      name: 'Amul Butter 500g',
      barcode: '890103000002',
      sellingPricePaisa: 27500,
      purchaseCostPaisa: 24500,
      initialStock: 4.0,
      gstRate: 12.0,
      hsnCode: '04051000',
      category: 'Dairy',
      unit: 'PKT',
    );
    await catalogRepo.createProduct(
      sku: 'SNACK-002',
      name: 'Maggi Masala 280g',
      barcode: '890103000006',
      sellingPricePaisa: 5500,
      purchaseCostPaisa: 4600,
      initialStock: 3.0,
      gstRate: 12.0,
      hsnCode: '19023010',
      category: 'Snacks',
      unit: 'PKT',
    );
  }

  Future<void> _insertTestCustomers() async {
    final c1 = await customerRepo.createCustomer(
      name: 'Ramesh Sharma',
      phone: '+919876543210',
      creditLimitPaisa: 500000,
    );
    await customerRepo.adjustCustomerBalance(c1.id, 125000);

    final c2 = await customerRepo.createCustomer(
      name: 'Pooja Verma',
      phone: '+919876543211',
      creditLimitPaisa: 300000,
    );
    await customerRepo.adjustCustomerBalance(c2.id, 42000);
  }

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
    test('inserts and retrieves catalog products in SQLite', () async {
      await _insertTestProducts();
      final products = await catalogRepo.getAllProducts();
      expect(products.length, 3);

      // Verify purge routine purges legacy mock data
      await catalogRepo.purgeMockDataIfPresent('test-tenant');
      final productsAfterPurge = await catalogRepo.getAllProducts();
      expect(productsAfterPurge.length, 0);
    });

    test('finds product by barcode or SKU and deducts stock in SQLite', () async {
      await _insertTestProducts();

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
      await _insertTestProducts();

      final lowStock = await catalogRepo.getLowStockProducts(threshold: 5.0);
      expect(lowStock.length, 2); // Amul Butter (4.0) & Maggi Masala (3.0)
      expect(lowStock.any((p) => p.name.contains('Butter')), isTrue);
      expect(lowStock.any((p) => p.name.contains('Maggi')), isTrue);
    });
  });

  group('LocalCustomerRepository & Khata Ledger Tests', () {
    test('inserts customers and calculates total Khata due', () async {
      await _insertTestCustomers();
      final customers = await customerRepo.getAllCustomers();
      expect(customers.length, 2);

      final totalDuePaisa = await customerRepo.getTotalKhataOutstandingPaisa();
      // 125000 + 42000 = 167000 Paisa (₹1,670.00)
      expect(totalDuePaisa, 167000);
    });

    test('creates new customer record and updates Khata debt balance', () async {
      await _insertTestCustomers();

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
      await _insertTestProducts();
      await _insertTestCustomers();

      final products = await catalogRepo.getAllProducts();
      final atta = products.firstWhere((p) => p.name.contains('Atta'));

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

