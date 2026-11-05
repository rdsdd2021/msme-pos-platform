import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models/product.dart';
import '../../core/providers/catalog_provider.dart';
import 'widgets/add_edit_product_dialog.dart';
import 'widgets/stock_adjustment_dialog.dart';

class MobileInventoryScreen extends ConsumerStatefulWidget {
  const MobileInventoryScreen({super.key});

  @override
  ConsumerState<MobileInventoryScreen> createState() => _MobileInventoryScreenState();
}

class _MobileInventoryScreenState extends ConsumerState<MobileInventoryScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openAddProductDialog() {
    showDialog(
      context: context,
      builder: (ctx) => const AddEditProductDialog(),
    );
  }

  void _openEditProductDialog(Product product) {
    showDialog(
      context: context,
      builder: (ctx) => AddEditProductDialog(product: product),
    );
  }

  void _openStockAdjustmentDialog(Product product) {
    showDialog(
      context: context,
      builder: (ctx) => StockAdjustmentDialog(product: product),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'groceries':
        return const Color(0xFF10B981); // Emerald
      case 'dairy':
        return const Color(0xFF0284C7); // Sky Blue
      case 'snacks':
        return const Color(0xFFF59E0B); // Amber
      case 'beverages':
        return const Color(0xFF8B5CF6); // Purple
      case 'restaurant / food':
        return const Color(0xFFEC4899); // Pink
      default:
        return const Color(0xFF64748B); // Slate
    }
  }

  @override
  Widget build(BuildContext context) {
    final catalogState = ref.watch(catalogProvider);
    final products = catalogState.filteredProducts;

    final lowStockCount = catalogState.allProducts.where((p) => p.currentStock <= 5.0).length;
    final totalInventoryPaisa = catalogState.allProducts.fold<int>(
      0,
      (sum, p) => sum + (p.sellingPricePaisa * p.currentStock.toInt()),
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.inventory_2, color: Color(0xFF10B981), size: 22),
            SizedBox(width: 8),
            Text(
              'Inventory & Catalog',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Inventory',
            onPressed: () => ref.read(catalogProvider.notifier).reload(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Summary Stats Cards
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Items', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        const SizedBox(height: 2),
                        Text(
                          '${catalogState.allProducts.length}',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: lowStockCount > 0 ? Colors.amber.shade50 : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: lowStockCount > 0 ? Colors.amber.shade200 : Colors.grey.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Low Stock (<5)', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        const SizedBox(height: 2),
                        Text(
                          '$lowStockCount items',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: lowStockCount > 0 ? Colors.amber.shade900 : Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blue.shade100),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Stock Value', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        const SizedBox(height: 2),
                        Text(
                          '₹${(totalInventoryPaisa / 100).toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0284C7)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => ref.read(catalogProvider.notifier).updateSearch(val),
              decoration: InputDecoration(
                hintText: 'Search by product name, SKU or barcode...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          ref.read(catalogProvider.notifier).updateSearch('');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
              ),
            ),
          ),

          // Category Chips Filter
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: catalogState.availableCategories.map((cat) {
                final isSelected = catalogState.selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(cat, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : Colors.black87)),
                    selected: isSelected,
                    selectedColor: const Color(0xFF10B981),
                    backgroundColor: Colors.white,
                    side: BorderSide(color: isSelected ? const Color(0xFF10B981) : Colors.grey.shade300),
                    onSelected: (_) => ref.read(catalogProvider.notifier).selectCategory(cat),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 6),

          // Products List
          Expanded(
            child: products.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 54, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        Text(
                          'No items found',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
                        ),
                        const SizedBox(height: 6),
                        const Text('Tap "+ Add New Item" below to create a product.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
                    itemCount: products.length,
                    itemBuilder: (ctx, idx) {
                      final p = products[idx];
                      final catColor = _getCategoryColor(p.category);
                      final isLowStock = p.currentStock <= 5.0;
                      final isOut = p.currentStock <= 0;

                      return Card(
                        elevation: 0.5,
                        margin: const EdgeInsets.only(bottom: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: BorderSide(color: Colors.grey.shade200),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Category Avatar Icon
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: catColor.withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Center(
                                      child: Text(
                                        p.name.isNotEmpty ? p.name.substring(0, 1).toUpperCase() : 'P',
                                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: catColor),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          p.name,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                        const SizedBox(height: 3),
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                              decoration: BoxDecoration(
                                                color: catColor.withOpacity(0.1),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                p.category,
                                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: catColor),
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Text(
                                              'SKU: ${p.sku}',
                                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                                            ),
                                            if (p.barcode != null && p.barcode!.isNotEmpty) ...[
                                              const SizedBox(width: 6),
                                              Text(
                                                '• ${p.barcode}',
                                                style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Price
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '₹${(p.sellingPricePaisa / 100).toStringAsFixed(2)}',
                                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                      ),
                                      if (p.purchaseCostPaisa > 0)
                                        Text(
                                          'Cost: ₹${(p.purchaseCostPaisa / 100).toStringAsFixed(2)}',
                                          style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                              const Divider(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  // Stock Status Badge
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: isOut
                                          ? Colors.red.shade50
                                          : (isLowStock ? Colors.amber.shade50 : Colors.green.shade50),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: isOut
                                            ? Colors.red.shade200
                                            : (isLowStock ? Colors.amber.shade200 : Colors.green.shade200),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          isOut ? Icons.cancel : (isLowStock ? Icons.warning_amber : Icons.check_circle),
                                          size: 13,
                                          color: isOut
                                              ? Colors.red
                                              : (isLowStock ? Colors.amber.shade800 : Colors.green),
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Stock: ${p.currentStock.toStringAsFixed(0)} ${p.unit}',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: isOut
                                                ? Colors.red.shade800
                                                : (isLowStock ? Colors.amber.shade900 : Colors.green.shade800),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Action Buttons
                                  Row(
                                    children: [
                                      OutlinedButton.icon(
                                        icon: const Icon(Icons.sync_alt, size: 13),
                                        label: const Text('Adjust', style: TextStyle(fontSize: 11)),
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          visualDensity: VisualDensity.compact,
                                        ),
                                        onPressed: () => _openStockAdjustmentDialog(p),
                                      ),
                                      const SizedBox(width: 6),
                                      OutlinedButton.icon(
                                        icon: const Icon(Icons.edit, size: 13),
                                        label: const Text('Edit', style: TextStyle(fontSize: 11)),
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          visualDensity: VisualDensity.compact,
                                        ),
                                        onPressed: () => _openEditProductDialog(p),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('add_new_product_fab'),
        onPressed: _openAddProductDialog,
        backgroundColor: const Color(0xFF10B981),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Add Item', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }
}
