import 'dart:async';
import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
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
      imageUrl: row.imageUrl,
    );
  }

  /// Purges any legacy seed or mock products ('tenant-1' or demo product IDs)
  Future<void> purgeMockDataIfPresent(String activeTenantId) async {
    final mockIds = ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6'];
    await (_db.delete(_db.localProducts)
          ..where((t) => t.tenantId.equals('tenant-1') | t.id.isIn(mockIds)))
        .go();
    await (_db.delete(_db.localCustomers)
          ..where((t) => t.tenantId.equals('tenant-1') | t.id.isIn(['c-1', 'c-2', 'c-3'])))
        .go();
  }

  /// Reactive stream of all products, ordered by name, filtered by tenant
  Stream<List<Product>> watchAllProducts({String? tenantId}) {
    final query = _db.select(_db.localProducts);
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((p) => p.tenantId.equals(tenantId));
    }
    return (query..orderBy([(p) => OrderingTerm(expression: p.name, mode: OrderingMode.asc)]))
        .watch()
        .map((rows) => rows.map(_mapToModel).toList());
  }

  /// Get snapshot list of all products, filtered by tenant
  Future<List<Product>> getAllProducts({String? tenantId}) async {
    final query = _db.select(_db.localProducts);
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((p) => p.tenantId.equals(tenantId));
    }
    final rows = await (query
          ..orderBy([(p) => OrderingTerm(expression: p.name, mode: OrderingMode.asc)]))
        .get();
    return rows.map(_mapToModel).toList();
  }

  /// Find single product by barcode or SKU, optionally filtered by tenant
  Future<Product?> findByBarcodeOrSku(String code, {String? tenantId}) async {
    final trimmed = code.trim();
    final clean = trimmed.toLowerCase();
    final query = _db.select(_db.localProducts)
      ..where((p) =>
          p.barcode.equals(trimmed) |
          p.sku.equals(trimmed) |
          p.sku.lower().equals(clean));
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((p) => p.tenantId.equals(tenantId));
    }
    final row = await query.getSingleOrNull();
    return row != null ? _mapToModel(row) : null;
  }

  /// Purges local SQLite records for a tenant on logout or account switch
  Future<void> clearAllTenantData(String tenantId) async {
    if (tenantId.isEmpty) return;
    await (_db.delete(_db.localProducts)..where((t) => t.tenantId.equals(tenantId))).go();
    await (_db.delete(_db.localCustomers)..where((t) => t.tenantId.equals(tenantId))).go();
    await (_db.delete(_db.localInvoices)..where((t) => t.tenantId.equals(tenantId))).go();
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

  /// Create a new product locally and queue for background sync
  Future<Product> createProduct({
    required String name,
    required String sku,
    String? barcode,
    required String category,
    required int sellingPricePaisa,
    int purchaseCostPaisa = 0,
    int mrpPaisa = 0,
    double gstRate = 0.0,
    String? hsnCode,
    String unit = 'PCS',
    double initialStock = 0.0,
    String? imageUrl,
    String tenantId = 'tenant-1',
    String deviceId = 'pos-mobile-01',
  }) async {
    final id = const Uuid().v4();
    final now = DateTime.now();

    await _db.transaction(() async {
      await _db.into(_db.localProducts).insert(
        LocalProductsCompanion.insert(
          id: id,
          tenantId: tenantId,
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          barcode: Value(barcode?.trim()),
          sellingPricePaisa: sellingPricePaisa,
          purchaseCostPaisa: Value(purchaseCostPaisa),
          mrpPaisa: Value(mrpPaisa > 0 ? mrpPaisa : sellingPricePaisa),
          gstRatePercent: Value(gstRate),
          hsnCode: Value(hsnCode?.trim()),
          categoryName: Value(category.trim()),
          unit: Value(unit),
          stockQuantity: Value(initialStock),
          imageUrl: Value(imageUrl),
          updatedAt: Value(now),
        ),
      );

      if (initialStock > 0) {
        await _db.into(_db.localStockMovements).insert(
          LocalStockMovementsCompanion.insert(
            id: const Uuid().v4(),
            productId: id,
            movementType: 'initial_stock',
            quantity: initialStock,
            referenceId: 'INIT-$id',
            reason: 'Initial stock on item creation',
            createdAt: Value(now),
          ),
        );
      }

      // Outbox operation
      await _db.into(_db.syncOutbox).insert(
        SyncOutboxCompanion.insert(
          operationId: const Uuid().v4(),
          deviceId: deviceId,
          sequence: DateTime.now().millisecondsSinceEpoch % 1000000,
          operationType: 'CREATE_PRODUCT',
          schemaVersion: const Value(1),
          payload: jsonEncode({
            'name': name.trim(),
            'sku': sku.trim().toUpperCase(),
            'barcode': barcode?.trim(),
            'category': category.trim(),
            'sellingPrice': (sellingPricePaisa / 100.0).toStringAsFixed(2),
            'costPrice': (purchaseCostPaisa / 100.0).toStringAsFixed(2),
            'taxRate': gstRate.toString(),
            'hsnCode': hsnCode?.trim(),
            'unit': unit,
            'initialStock': initialStock,
            'imageUrl': imageUrl,
          }),
          status: const Value('pending'),
          retryCount: const Value(0),
          createdAt: Value(now),
        ),
      );
    });

    return Product(
      id: id,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode?.trim(),
      category: category.trim(),
      unit: unit,
      sellingPricePaisa: sellingPricePaisa,
      purchaseCostPaisa: purchaseCostPaisa,
      gstRate: gstRate.round(),
      currentStock: initialStock,
      hsnCode: hsnCode?.trim(),
      imageUrl: imageUrl,
    );
  }

  /// Update an existing product's details and price
  Future<void> updateProduct(Product product, {String deviceId = 'pos-mobile-01'}) async {
    final now = DateTime.now();
    await (_db.update(_db.localProducts)..where((p) => p.id.equals(product.id))).write(
      LocalProductsCompanion(
        name: Value(product.name.trim()),
        sku: Value(product.sku.trim().toUpperCase()),
        barcode: Value(product.barcode?.trim()),
        categoryName: Value(product.category),
        unit: Value(product.unit),
        sellingPricePaisa: Value(product.sellingPricePaisa),
        purchaseCostPaisa: Value(product.purchaseCostPaisa),
        gstRatePercent: Value(product.gstRate.toDouble()),
        hsnCode: Value(product.hsnCode?.trim()),
        imageUrl: Value(product.imageUrl),
        updatedAt: Value(now),
      ),
    );

    // Queue sync outbox
    await _db.into(_db.syncOutbox).insert(
      SyncOutboxCompanion.insert(
        operationId: const Uuid().v4(),
        deviceId: deviceId,
        sequence: DateTime.now().millisecondsSinceEpoch % 1000000,
        operationType: 'UPDATE_PRODUCT',
        schemaVersion: const Value(1),
        payload: jsonEncode({
          'id': product.id,
          'name': product.name.trim(),
          'sku': product.sku.trim().toUpperCase(),
          'barcode': product.barcode?.trim(),
          'category': product.category,
          'sellingPrice': (product.sellingPricePaisa / 100.0).toStringAsFixed(2),
          'costPrice': (product.purchaseCostPaisa / 100.0).toStringAsFixed(2),
          'taxRate': product.gstRate.toString(),
          'hsnCode': product.hsnCode?.trim(),
          'unit': product.unit,
          'imageUrl': product.imageUrl,
        }),
        status: const Value('pending'),
        retryCount: const Value(0),
        createdAt: Value(now),
      ),
    );
  }

  /// Adjust stock quantity (Restock / Damage / Audit)
  Future<void> adjustStock({
    required String productId,
    required double delta,
    required String reason,
    String deviceId = 'pos-mobile-01',
  }) async {
    final now = DateTime.now();
    final existing = await (_db.select(_db.localProducts)..where((p) => p.id.equals(productId))).getSingleOrNull();
    if (existing == null) return;

    final newStock = (existing.stockQuantity + delta).clamp(0.0, double.infinity);

    await _db.transaction(() async {
      await (_db.update(_db.localProducts)..where((p) => p.id.equals(productId))).write(
        LocalProductsCompanion(
          stockQuantity: Value(newStock),
          updatedAt: Value(now),
        ),
      );

      await _db.into(_db.localStockMovements).insert(
        LocalStockMovementsCompanion.insert(
          id: const Uuid().v4(),
          productId: productId,
          movementType: delta >= 0 ? 'restock' : 'damage_correction',
          quantity: delta,
          referenceId: 'ADJ-$productId-${now.millisecondsSinceEpoch}',
          reason: reason,
          createdAt: Value(now),
        ),
      );

      await _db.into(_db.syncOutbox).insert(
        SyncOutboxCompanion.insert(
          operationId: const Uuid().v4(),
          deviceId: deviceId,
          sequence: DateTime.now().millisecondsSinceEpoch % 1000000,
          operationType: 'STOCK_ADJUSTMENT',
          schemaVersion: const Value(1),
          payload: jsonEncode({
            'productId': productId,
            'delta': delta,
            'reason': reason,
            'newStock': newStock,
          }),
          status: const Value('pending'),
          retryCount: const Value(0),
          createdAt: Value(now),
        ),
      );
    });
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

