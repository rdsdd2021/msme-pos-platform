import 'dart:async';
import 'package:drift/drift.dart';
import '../database/app_database.dart';
import '../models/product.dart';

class LocalCatalogRepository {
  final AppDatabase _db;

  LocalCatalogRepository(this._db);

  Product _mapToModel(LocalProduct row) {
    return Product(
      id: row.id,
      name: row.name,
      sku: row.sku,
      barcode: row.barcode,
      category: row.categoryName ?? 'Groceries',
      unit: row.unit,
      sellingPricePaisa: row.sellingPricePaisa,
      purchaseCostPaisa: row.purchaseCostPaisa,
      gstRate: row.gstRatePercent.round(),
      currentStock: row.stockQuantity,
      hsnCode: row.hsnCode,
    );
  }

  /// Purges old simulated demo data ('tenant-1') when a real merchant logs in
  Future<void> purgeMockDataIfPresent(String activeTenantId) async {
    if (activeTenantId != 'tenant-1') {
      await (_db.delete(_db.localProducts)..where((t) => t.tenantId.equals('tenant-1'))).go();
      await (_db.delete(_db.localCustomers)..where((t) => t.tenantId.equals('tenant-1'))).go();
    }
  }

  /// Seeds persistent initial catalog into SQLite if table is currently empty
  Future<void> seedInitialProductsIfEmpty({String tenantId = 'tenant-1'}) async {
    final count = await _db.localProducts.count().getSingle();
    if (count > 0) return;

    final initialSeeds = [
      LocalProductsCompanion.insert(
        id: 'prod-1',
        tenantId: tenantId,
        sku: 'GROC-001',
        name: 'Aashirvaad Atta 5kg',
        barcode: const Value('890103000001'),
        sellingPricePaisa: 24000,
        purchaseCostPaisa: const Value(21000),
        mrpPaisa: const Value(26000),
        gstRatePercent: const Value(5.0),
        hsnCode: const Value('11010000'),
        categoryName: const Value('Groceries'),
        unit: const Value('PKT'),
        stockQuantity: const Value(50.0),
      ),
      LocalProductsCompanion.insert(
        id: 'prod-2',
        tenantId: tenantId,
        sku: 'DAIRY-001',
        name: 'Amul Butter 500g',
        barcode: const Value('890103000002'),
        sellingPricePaisa: 27500,
        purchaseCostPaisa: const Value(24500),
        mrpPaisa: const Value(29000),
        gstRatePercent: const Value(12.0),
        hsnCode: const Value('04051000'),
        categoryName: const Value('Dairy'),
        unit: const Value('PKT'),
        stockQuantity: const Value(4.0), // Low stock alert
      ),
      LocalProductsCompanion.insert(
        id: 'prod-3',
        tenantId: tenantId,
        sku: 'GROC-002',
        name: 'Tata Salt 1kg',
        barcode: const Value('890103000003'),
        sellingPricePaisa: 2800,
        purchaseCostPaisa: const Value(2200),
        mrpPaisa: const Value(3000),
        gstRatePercent: const Value(0.0),
        hsnCode: const Value('25010010'),
        categoryName: const Value('Groceries'),
        unit: const Value('PKT'),
        stockQuantity: const Value(100.0),
      ),
      LocalProductsCompanion.insert(
        id: 'prod-4',
        tenantId: tenantId,
        sku: 'GROC-003',
        name: 'Fortune Sunflower Oil 1L',
        barcode: const Value('890103000004'),
        sellingPricePaisa: 16500,
        purchaseCostPaisa: const Value(14000),
        mrpPaisa: const Value(18000),
        gstRatePercent: const Value(5.0),
        hsnCode: const Value('15121110'),
        categoryName: const Value('Groceries'),
        unit: const Value('LTR'),
        stockQuantity: const Value(60.0),
      ),
      LocalProductsCompanion.insert(
        id: 'prod-5',
        tenantId: tenantId,
        sku: 'SNACK-001',
        name: 'Parle-G Biscuit 800g',
        barcode: const Value('890103000005'),
        sellingPricePaisa: 8000,
        purchaseCostPaisa: const Value(6800),
        mrpPaisa: const Value(8500),
        gstRatePercent: const Value(18.0),
        hsnCode: const Value('19053100'),
        categoryName: const Value('Snacks'),
        unit: const Value('PKT'),
        stockQuantity: const Value(80.0),
      ),
      LocalProductsCompanion.insert(
        id: 'prod-6',
        tenantId: tenantId,
        sku: 'SNACK-002',
        name: 'Maggi Masala 280g',
        barcode: const Value('890103000006'),
        sellingPricePaisa: 5500,
        purchaseCostPaisa: const Value(4600),
        mrpPaisa: const Value(6000),
        gstRatePercent: const Value(12.0),
        hsnCode: const Value('19023010'),
        categoryName: const Value('Snacks'),
        unit: const Value('PKT'),
        stockQuantity: const Value(3.0), // Low stock alert
      ),
    ];

    await _db.batch((batch) {
      batch.insertAll(_db.localProducts, initialSeeds);
    });
  }

  /// Reactive stream of all products, ordered by name
  Stream<List<Product>> watchAllProducts() {
    return (_db.select(_db.localProducts)
          ..orderBy([(p) => OrderingTerm(expression: p.name, mode: OrderingMode.asc)]))
        .watch()
        .map((rows) => rows.map(_mapToModel).toList());
  }

  /// Get snapshot list of all products
  Future<List<Product>> getAllProducts() async {
    final rows = await (_db.select(_db.localProducts)
          ..orderBy([(p) => OrderingTerm(expression: p.name, mode: OrderingMode.asc)]))
        .get();
    return rows.map(_mapToModel).toList();
  }

  /// Find single product by barcode or SKU
  Future<Product?> findByBarcodeOrSku(String code) async {
    final trimmed = code.trim();
    final clean = trimmed.toLowerCase();
    final row = await (_db.select(_db.localProducts)
          ..where((p) =>
              p.barcode.equals(trimmed) |
              p.sku.equals(trimmed) |
              p.sku.lower().equals(clean)))
        .getSingleOrNull();
    return row != null ? _mapToModel(row) : null;
  }

  /// Deduct stock projection in local SQLite
  Future<void> deductStock(String productId, double quantity) async {
    final existing = await (_db.select(_db.localProducts)
          ..where((p) => p.id.equals(productId)))
        .getSingleOrNull();
    if (existing != null) {
      final updated = (existing.stockQuantity - quantity).clamp(0.0, double.infinity);
      await (_db.update(_db.localProducts)..where((p) => p.id.equals(productId))).write(
        LocalProductsCompanion(
          stockQuantity: Value(updated),
          updatedAt: Value(DateTime.now()),
        ),
      );
    }
  }

  /// Fetch low stock items for owner dashboard
  Future<List<Product>> getLowStockProducts({double threshold = 5.0}) async {
    final rows = await (_db.select(_db.localProducts)
          ..where((p) => p.stockQuantity.isSmallerOrEqualValue(threshold))
          ..orderBy([(p) => OrderingTerm(expression: p.stockQuantity, mode: OrderingMode.asc)]))
        .get();
    return rows.map(_mapToModel).toList();
  }
}

