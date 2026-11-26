import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product.dart';
import '../repositories/local_catalog_repository.dart';
import 'sync_provider.dart';

import 'auth_provider.dart';

final localCatalogRepoProvider = Provider<LocalCatalogRepository>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return LocalCatalogRepository(db);
});

const initialProducts = <Product>[];

const defaultMenuCategories = <String>[
  'Starters & Appetizers',
  'Main Course',
  'Breads & Rice',
  'Tandoori & Grills',
  'Beverages & Shakes',
  'Desserts & Sweets',
  'Snacks & Fast Food',
];

class CatalogState {
  final List<Product> allProducts;
  final List<Map<String, dynamic>> categories;
  final String selectedCategory;
  final String searchQuery;
  final bool isLoading;

  const CatalogState({
    required this.allProducts,
    this.categories = const [],
    this.selectedCategory = 'All',
    this.searchQuery = '',
    this.isLoading = false,
  });

  List<String> get availableCategories {
    final cats = <String>{'All'};
    for (final c in categories) {
      final name = (c['name'] as String? ?? '').trim();
      if (name.isNotEmpty) cats.add(name);
    }
    for (final p in allProducts) {
      if (p.category.isNotEmpty) {
        cats.add(p.category);
      }
    }
    return cats.toList();
  }

  List<String> get menuCategories {
    final cats = <String>{};
    if (categories.isNotEmpty) {
      for (final c in categories) {
        final name = (c['name'] as String? ?? '').trim();
        if (name.isNotEmpty) cats.add(name);
      }
    } else {
      cats.addAll(defaultMenuCategories);
    }
    for (final p in allProducts) {
      if (p.category.isNotEmpty && p.category != 'General' && p.category != 'Groceries') {
        cats.add(p.category);
      }
    }
    if (cats.isEmpty) cats.addAll(defaultMenuCategories);
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
    List<Map<String, dynamic>>? categories,
    String? selectedCategory,
    String? searchQuery,
    bool? isLoading,
  }) {
    return CatalogState(
      allProducts: allProducts ?? this.allProducts,
      categories: categories ?? this.categories,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      searchQuery: searchQuery ?? this.searchQuery,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class CatalogNotifier extends StateNotifier<CatalogState> {
  final LocalCatalogRepository _repo;
  final String? activeTenantId;
  final Ref? _ref;

  CatalogNotifier(this._repo, [this.activeTenantId, this._ref])
      : super(const CatalogState(allProducts: initialProducts, isLoading: false)) {
    _init();
  }

  Future<void> _init() async {
    try {
      await _repo.purgeMockDataIfPresent(activeTenantId ?? '');
      final items = await _repo.getAllProducts(tenantId: activeTenantId);
      if (!mounted) return;
      if (items.isNotEmpty) {
        state = state.copyWith(allProducts: items, isLoading: false);
      } else {
        state = state.copyWith(isLoading: false);
      }
      await fetchCategories();
    } catch (_) {
      if (mounted) {
        state = state.copyWith(isLoading: false);
      }
    }
  }

  Future<void> fetchCategories() async {
    final tid = activeTenantId;
    if (tid == null || tid.isEmpty || tid == 'tenant-1') return;
    try {
      final authRepo = _ref?.read(authRepositoryProvider);
      if (authRepo == null) return;
      final cats = await authRepo.getCategories(tid);
      if (mounted) {
        state = state.copyWith(categories: cats);
      }
    } catch (_) {}
  }

  Future<Map<String, dynamic>?> addCategory(String name) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return null;
    final tid = activeTenantId;
    if (tid == null || tid.isEmpty || tid == 'tenant-1') {
      final local = {'id': 'local-${DateTime.now().millisecondsSinceEpoch}', 'name': trimmed};
      state = state.copyWith(categories: [...state.categories, local]);
      return local;
    }
    final authRepo = _ref?.read(authRepositoryProvider);
    if (authRepo == null) return null;
    final created = await authRepo.createCategory(
      tenantId: tid,
      name: trimmed,
      sortOrder: state.categories.length + 1,
    );
    await fetchCategories();
    if (state.categories.every((c) => (c['name'] as String?)?.toLowerCase() != trimmed.toLowerCase())) {
      state = state.copyWith(categories: [...state.categories, created]);
    }
    return created;
  }

  Future<void> renameCategory(String? categoryId, String oldName, String newName) async {
    final trimmedNew = newName.trim();
    if (trimmedNew.isEmpty) return;
    final tid = activeTenantId;
    final authRepo = _ref?.read(authRepositoryProvider);
    if (tid != null && tid.isNotEmpty && tid != 'tenant-1' && authRepo != null) {
      if (categoryId != null && categoryId.isNotEmpty && !categoryId.startsWith('local-')) {
        await authRepo.updateCategory(tenantId: tid, categoryId: categoryId, name: trimmedNew);
      } else {
        await authRepo.createCategory(tenantId: tid, name: trimmedNew);
      }
    }
    await _repo.renameCategoryOnProducts(oldName, trimmedNew, tenantId: tid);
    final updatedCats = state.categories.map((c) {
      if ((categoryId != null && c['id'] == categoryId) || (c['name'] as String?) == oldName) {
        return {...c, 'name': trimmedNew};
      }
      return c;
    }).toList();
    state = state.copyWith(categories: updatedCats);
    await reload();
    await fetchCategories();
  }

  Future<void> deleteCategory(String? categoryId, String name) async {
    final tid = activeTenantId;
    final authRepo = _ref?.read(authRepositoryProvider);
    if (tid != null && tid.isNotEmpty && tid != 'tenant-1' && authRepo != null && categoryId != null && !categoryId.startsWith('local-')) {
      await authRepo.deleteCategory(tenantId: tid, categoryId: categoryId);
    }
    final updatedCats = state.categories
        .where((c) => (categoryId != null ? c['id'] != categoryId : true) && c['name'] != name)
        .toList();
    state = state.copyWith(categories: updatedCats);
    await fetchCategories();
  }

  Future<void> loadCatalog() => _init();

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
    String? imageUrl,
    String? foodType,
    String? kitchenStation,
    int? prepTimeMinutes,
    bool isAvailable = true,
    bool isMadeToOrder = false,
    List<ProductVariant>? variants,
    String? tenantId,
  }) async {
    final resolvedTenantId = (tenantId != null && tenantId.isNotEmpty && tenantId != 'tenant-1')
        ? tenantId
        : (activeTenantId != null && activeTenantId!.isNotEmpty
            ? activeTenantId!
            : 'tenant-1');

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
      imageUrl: imageUrl,
      foodType: foodType,
      kitchenStation: kitchenStation,
      prepTimeMinutes: prepTimeMinutes,
      isAvailable: isAvailable,
      isMadeToOrder: isMadeToOrder,
      variants: variants,
      tenantId: resolvedTenantId,
    );
    state = state.copyWith(allProducts: [newProduct, ...state.allProducts]);
    _ref?.read(syncStateProvider.notifier).syncNow();
    return newProduct;
  }

  Future<void> updateProduct(Product product) async {
    await _repo.updateProduct(product);
    final updated = state.allProducts.map((p) => p.id == product.id ? product : p).toList();
    state = state.copyWith(allProducts: updated);
    _ref?.read(syncStateProvider.notifier).syncNow();
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
    _ref?.read(syncStateProvider.notifier).syncNow();
  }

  Future<void> reload([String? tenantId, bool fetchRemoteCategories = false]) async {
    final tid = tenantId ?? activeTenantId;
    final items = await _repo.getAllProducts(tenantId: tid);
    state = state.copyWith(allProducts: items);
    if (fetchRemoteCategories || state.categories.isEmpty) {
      await fetchCategories();
    }
  }
}

final catalogProvider = StateNotifierProvider<CatalogNotifier, CatalogState>((ref) {
  final repo = ref.watch(localCatalogRepoProvider);
  final authState = ref.watch(authProvider);
  final tenantId = authState.activeMembership?.tenantId;
  return CatalogNotifier(repo, tenantId, ref);
});
