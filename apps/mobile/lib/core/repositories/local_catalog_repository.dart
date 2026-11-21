import 'dart:async';
import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
import '../config/app_config.dart';
import '../database/app_database.dart';
import '../models/product.dart';

class LocalCatalogRepository {
  final AppDatabase _db;

  LocalCatalogRepository(this._db);

  Product _mapToModel(LocalProduct row) {
    List<ProductVariant>? variants;
    if (row.variantsJson != null && row.variantsJson!.isNotEmpty) {
      try {
        final decoded = jsonDecode(row.variantsJson!) as List<dynamic>;
        variants = decoded
            .map((v) => ProductVariant(
                  name: v['name'] as String? ?? 'Standard',
                  price: (double.tryParse(v['price']?.toString() ?? '0') ?? 0.0),
                ))
            .toList();
      } catch (_) {}
    }

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
      foodType: row.foodType,
      kitchenStation: row.kitchenStation,
      prepTimeMinutes: row.prepTimeMinutes,
      isAvailable: row.isAvailable,
      isMadeToOrder: row.isMadeToOrder,
      variants: variants,
    );
  }

  /// Purges any legacy seed or mock products (demo product IDs only)
  Future<void> purgeMockDataIfPresent(String activeTenantId) async {
    final mockIds = ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6'];
    await (_db.delete(_db.localProducts)
          ..where((t) => t.id.isIn(mockIds)))
        .go();
    await (_db.delete(_db.localCustomers)
          ..where((t) => t.id.isIn(['c-1', 'c-2', 'c-3'])))
        .go();
  }

  /// Reactive stream of all products, ordered by name, filtered by tenant
  Stream<List<Product>> watchAllProducts({String? tenantId}) {
    final query = _db.select(_db.localProducts);
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((p) => p.tenantId.equals(tenantId) | p.tenantId.equals('tenant-1'));
    }
    return (query..orderBy([(p) => OrderingTerm(expression: p.name, mode: OrderingMode.asc)]))
        .watch()
        .map((rows) => rows.map(_mapToModel).toList());
  }

  /// Get snapshot list of all products, filtered by tenant
  Future<List<Product>> getAllProducts({String? tenantId}) async {
    final query = _db.select(_db.localProducts);
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((p) => p.tenantId.equals(tenantId) | p.tenantId.equals('tenant-1'));
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
    String? foodType,
    String? kitchenStation,
    int? prepTimeMinutes,
    bool isAvailable = true,
    bool isMadeToOrder = false,
    List<ProductVariant>? variants,
    String tenantId = 'tenant-1',
    String? deviceId,
  }) async {
    final resolvedDeviceId = (deviceId != null && deviceId.isNotEmpty && deviceId != 'pos-mobile-01')
        ? deviceId
        : await AppConfig.getDeviceId();
    final id = const Uuid().v4();
    final now = DateTime.now();

    await _db.transaction(() async {
      final companion = LocalProductsCompanion.insert(
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
        foodType: Value(foodType),
        kitchenStation: Value(kitchenStation),
        prepTimeMinutes: Value(prepTimeMinutes),
        isAvailable: Value(isAvailable),
        isMadeToOrder: Value(isMadeToOrder),
        variantsJson: Value(variants != null && variants.isNotEmpty
            ? jsonEncode(variants.map((v) => {'name': v.name, 'price': v.price}).toList())
            : null),
        updatedAt: Value(now),
      );

      try {
        await _db.into(_db.localProducts).insert(companion);
      } catch (e) {
        if (e.toString().contains('no column named')) {
          await _ensureColumnsExist();
          await _db.into(_db.localProducts).insert(companion);
        } else {
          rethrow;
        }
      }

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
          deviceId: resolvedDeviceId,
          sequence: DateTime.now().millisecondsSinceEpoch % 1000000,
          operationType: 'CREATE_PRODUCT',
          schemaVersion: const Value(1),
          payload: jsonEncode({
            'id': id,
            'productId': id,
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
            'foodType': foodType,
            'kitchenStation': kitchenStation,
            'prepTimeMinutes': prepTimeMinutes,
            'isAvailable': isAvailable,
            'isMadeToOrder': isMadeToOrder,
            'variants': variants?.map((v) => {'name': v.name, 'price': v.price}).toList(),
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
      foodType: foodType,
      kitchenStation: kitchenStation,
      prepTimeMinutes: prepTimeMinutes,
      isAvailable: isAvailable,
      isMadeToOrder: isMadeToOrder,
      variants: variants,
    );
  }

  /// Update an existing product's details and price
  Future<void> updateProduct(Product product, {String? deviceId}) async {
    final resolvedDeviceId = (deviceId != null && deviceId.isNotEmpty && deviceId != 'pos-mobile-01')
        ? deviceId
        : await AppConfig.getDeviceId();
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
        foodType: Value(product.foodType),
        kitchenStation: Value(product.kitchenStation),
        prepTimeMinutes: Value(product.prepTimeMinutes),
        isAvailable: Value(product.isAvailable),
        isMadeToOrder: Value(product.isMadeToOrder),
        variantsJson: Value(product.variants != null && product.variants!.isNotEmpty
            ? jsonEncode(product.variants!.map((v) => {'name': v.name, 'price': v.price}).toList())
            : null),
        updatedAt: Value(now),
      ),
    );

    // Queue sync outbox
    await _db.into(_db.syncOutbox).insert(
      SyncOutboxCompanion.insert(
        operationId: const Uuid().v4(),
        deviceId: resolvedDeviceId,
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
          'foodType': product.foodType,
          'kitchenStation': product.kitchenStation,
          'prepTimeMinutes': product.prepTimeMinutes,
          'isAvailable': product.isAvailable,
          'isMadeToOrder': product.isMadeToOrder,
          'variants': product.variants?.map((v) => {'name': v.name, 'price': v.price}).toList(),
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
    String? deviceId,
  }) async {
    final resolvedDeviceId = (deviceId != null && deviceId.isNotEmpty && deviceId != 'pos-mobile-01')
        ? deviceId
        : await AppConfig.getDeviceId();
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
          deviceId: resolvedDeviceId,
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

  /// Self-healing migration for missing columns
  Future<void> _ensureColumnsExist() async {
    try {
      final pragmaRows = await _db.customSelect("PRAGMA table_info('local_products')").get();
      final cols = pragmaRows.map((r) => r.read<String>('name')).toSet();
      if (!cols.contains('image_url')) {
        await _db.customStatement('ALTER TABLE local_products ADD COLUMN image_url TEXT');
      }
      if (!cols.contains('food_type')) {
        await _db.customStatement('ALTER TABLE local_products ADD COLUMN food_type TEXT');
      }
      if (!cols.contains('kitchen_station')) {
        await _db.customStatement('ALTER TABLE local_products ADD COLUMN kitchen_station TEXT');
      }
      if (!cols.contains('prep_time_minutes')) {
        await _db.customStatement('ALTER TABLE local_products ADD COLUMN prep_time_minutes INTEGER');
      }
      if (!cols.contains('is_available')) {
        await _db.customStatement('ALTER TABLE local_products ADD COLUMN is_available INTEGER NOT NULL DEFAULT 1');
      }
      if (!cols.contains('is_made_to_order')) {
        await _db.customStatement('ALTER TABLE local_products ADD COLUMN is_made_to_order INTEGER NOT NULL DEFAULT 0');
      }
      if (!cols.contains('variants_json')) {
        await _db.customStatement('ALTER TABLE local_products ADD COLUMN variants_json TEXT');
      }
    } catch (_) {}
  }
}

