import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product.dart';
import '../repositories/local_catalog_repository.dart';
import 'sync_provider.dart';

final localCatalogRepoProvider = Provider<LocalCatalogRepository>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return LocalCatalogRepository(db);
});

const initialProducts = <Product>[];

class CatalogState {
  final List<Product> allProducts;
  final String selectedCategory;
  final String searchQuery;
  final bool isLoading;

  const CatalogState({
    required this.allProducts,
    this.selectedCategory = 'All',
    this.searchQuery = '',
    this.isLoading = false,
  });

  List<String> get availableCategories {
    final cats = <String>{'All'};
    for (final p in allProducts) {
      if (p.category.isNotEmpty) {
        cats.add(p.category);
      }
    }
    return cats.toList();
  }

  List<Product> get filteredProducts {
    return allProducts.where((p) {
      final matchesCategory = selectedCategory == 'All' || p.category == selectedCategory;
      final q = searchQuery.toLowerCase().trim();
      final matchesQuery = q.isEmpty ||
          p.name.toLowerCase().contains(q) ||
          p.sku.toLowerCase().contains(q) ||
          (p.barcode != null && p.barcode!.contains(q));
      return matchesCategory && matchesQuery;
    }).toList();
  }

  CatalogState copyWith({
    List<Product>? allProducts,
    String? selectedCategory,
    String? searchQuery,
    bool? isLoading,
  }) {
    return CatalogState(
      allProducts: allProducts ?? this.allProducts,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      searchQuery: searchQuery ?? this.searchQuery,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class CatalogNotifier extends StateNotifier<CatalogState> {
  final LocalCatalogRepository _repo;

  CatalogNotifier(this._repo)
      : super(const CatalogState(allProducts: initialProducts, isLoading: false)) {
    _init();
  }

  Future<void> _init() async {
    try {
      await _repo.purgeMockDataIfPresent('');
      final items = await _repo.getAllProducts();
      if (items.isNotEmpty) {
        state = state.copyWith(allProducts: items, isLoading: false);
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  void selectCategory(String category) {
    state = state.copyWith(selectedCategory: category);
  }

  void updateSearch(String query) {
    state = state.copyWith(searchQuery: query);
  }

  Future<void> deductStock(String productId, int quantity) async {
    await _repo.deductStock(productId, quantity.toDouble());
    final updated = state.allProducts.map((p) {
      if (p.id == productId) {
        return Product(
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          category: p.category,
          unit: p.unit,
          sellingPricePaisa: p.sellingPricePaisa,
          purchaseCostPaisa: p.purchaseCostPaisa,
          gstRate: p.gstRate,
          currentStock: (p.currentStock - quantity).clamp(0.0, double.infinity),
          hsnCode: p.hsnCode,
          imageUrl: p.imageUrl,
        );
      }
      return p;
    }).toList();
    state = state.copyWith(allProducts: updated);
  }

  Future<Product> addProduct({
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
    String tenantId = 'tenant-1',
  }) async {
    final newProduct = await _repo.createProduct(
      name: name,
      sku: sku,
      barcode: barcode,
      category: category,
      sellingPricePaisa: sellingPricePaisa,
      purchaseCostPaisa: purchaseCostPaisa,
      mrpPaisa: mrpPaisa,
      gstRate: gstRate,
      hsnCode: hsnCode,
      unit: unit,
      initialStock: initialStock,
      tenantId: tenantId,
    );
    state = state.copyWith(allProducts: [newProduct, ...state.allProducts]);
    return newProduct;
  }

  Future<void> updateProduct(Product product) async {
    await _repo.updateProduct(product);
    final updated = state.allProducts.map((p) => p.id == product.id ? product : p).toList();
    state = state.copyWith(allProducts: updated);
  }

  Future<void> adjustStock({
    required String productId,
    required double delta,
    required String reason,
  }) async {
    await _repo.adjustStock(productId: productId, delta: delta, reason: reason);
    final updated = state.allProducts.map((p) {
      if (p.id == productId) {
        return Product(
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          category: p.category,
          unit: p.unit,
          sellingPricePaisa: p.sellingPricePaisa,
          purchaseCostPaisa: p.purchaseCostPaisa,
          gstRate: p.gstRate,
          currentStock: (p.currentStock + delta).clamp(0.0, double.infinity),
          hsnCode: p.hsnCode,
          imageUrl: p.imageUrl,
        );
      }
      return p;
    }).toList();
    state = state.copyWith(allProducts: updated);
  }

  Future<void> reload() async {
    final items = await _repo.getAllProducts();
    state = state.copyWith(allProducts: items);
  }
}

final catalogProvider = StateNotifierProvider<CatalogNotifier, CatalogState>((ref) {
  final repo = ref.watch(localCatalogRepoProvider);
  return CatalogNotifier(repo);
});
