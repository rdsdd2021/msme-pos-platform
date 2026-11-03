import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product.dart';
import '../repositories/local_catalog_repository.dart';
import 'sync_provider.dart';

final localCatalogRepoProvider = Provider<LocalCatalogRepository>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return LocalCatalogRepository(db);
});

const initialProducts = <Product>[
  const Product(
    id: 'prod-1',
    name: 'Aashirvaad Atta 5kg',
    sku: 'GROC-001',
    barcode: '890103000001',
    category: 'Groceries',
    unit: 'PKT',
    sellingPricePaisa: 24000, // ₹240.00
    purchaseCostPaisa: 21000,
    gstRate: 5,
    currentStock: 50.0,
    hsnCode: '11010000',
  ),
  const Product(
    id: 'prod-2',
    name: 'Amul Butter 500g',
    sku: 'DAIRY-001',
    barcode: '890103000002',
    category: 'Dairy',
    unit: 'PKT',
    sellingPricePaisa: 27500, // ₹275.00
    purchaseCostPaisa: 24500,
    gstRate: 12,
    currentStock: 4.0, // Low stock demo
    hsnCode: '04051000',
  ),
  const Product(
    id: 'prod-3',
    name: 'Tata Salt 1kg',
    sku: 'GROC-002',
    barcode: '890103000003',
    category: 'Groceries',
    unit: 'PKT',
    sellingPricePaisa: 2800, // ₹28.00
    purchaseCostPaisa: 2200,
    gstRate: 0,
    currentStock: 100.0,
    hsnCode: '25010010',
  ),
  const Product(
    id: 'prod-4',
    name: 'Fortune Sunflower Oil 1L',
    sku: 'GROC-003',
    barcode: '890103000004',
    category: 'Groceries',
    unit: 'LTR',
    sellingPricePaisa: 16500, // ₹165.00
    purchaseCostPaisa: 14000,
    gstRate: 5,
    currentStock: 60.0,
    hsnCode: '15121110',
  ),
  const Product(
    id: 'prod-5',
    name: 'Parle-G Biscuit 800g',
    sku: 'SNACK-001',
    barcode: '890103000005',
    category: 'Snacks',
    unit: 'PKT',
    sellingPricePaisa: 8000, // ₹80.00
    purchaseCostPaisa: 6800,
    gstRate: 18,
    currentStock: 80.0,
    hsnCode: '19053100',
  ),
  const Product(
    id: 'prod-6',
    name: 'Maggi Masala 280g',
    sku: 'SNACK-002',
    barcode: '890103000006',
    category: 'Snacks',
    unit: 'PKT',
    sellingPricePaisa: 5500, // ₹55.00
    purchaseCostPaisa: 4600,
    gstRate: 12,
    currentStock: 3.0, // Low stock demo
    hsnCode: '19023010',
  ),
];

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
      // Seed SQLite if empty so offline installs have working data immediately
      await _repo.seedInitialProductsIfEmpty();
      final items = await _repo.getAllProducts();
      if (items.isNotEmpty) {
        state = state.copyWith(allProducts: items, isLoading: false);
      }
    } catch (_) {
      // Fallback gracefully to memory defaults if database initialization is delayed
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
        );
      }
      return p;
    }).toList();
    state = state.copyWith(allProducts: updated);
  }

  Future<void> reload() async {
    final items = await _repo.getAllProducts();
    if (items.isNotEmpty) {
      state = state.copyWith(allProducts: items);
    }
  }
}

final catalogProvider = StateNotifierProvider<CatalogNotifier, CatalogState>((ref) {
  final repo = ref.watch(localCatalogRepoProvider);
  return CatalogNotifier(repo);
});
