import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product.dart';

final initialProducts = [
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
  ),
];

class CatalogState {
  final List<Product> allProducts;
  final String selectedCategory;
  final String searchQuery;

  const CatalogState({
    required this.allProducts,
    this.selectedCategory = 'All',
    this.searchQuery = '',
  });

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
}

class CatalogNotifier extends StateNotifier<CatalogState> {
  CatalogNotifier() : super(CatalogState(allProducts: initialProducts));

  void selectCategory(String category) {
    state = CatalogState(
      allProducts: state.allProducts,
      selectedCategory: category,
      searchQuery: state.searchQuery,
    );
  }

  void updateSearch(String query) {
    state = CatalogState(
      allProducts: state.allProducts,
      selectedCategory: state.selectedCategory,
      searchQuery: query,
    );
  }

  void deductStock(String productId, int quantity) {
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
        );
      }
      return p;
    }).toList();

    state = CatalogState(
      allProducts: updated,
      selectedCategory: state.selectedCategory,
      searchQuery: state.searchQuery,
    );
  }
}

final catalogProvider = StateNotifierProvider<CatalogNotifier, CatalogState>((ref) {
  return CatalogNotifier();
});

