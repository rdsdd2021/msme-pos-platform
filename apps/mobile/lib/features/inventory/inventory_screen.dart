import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models/product.dart';
import '../../core/providers/catalog_provider.dart';
import '../../core/theme/shadcn_colors.dart';
import '../../core/theme/shadcn_typography.dart';
import '../../core/widgets/shadcn_card.dart';
import '../../core/widgets/shadcn_badge.dart';
import '../../core/widgets/shadcn_button.dart';
import '../../core/widgets/shadcn_input.dart';
import '../../core/widgets/shadcn_empty_state.dart';
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
      backgroundColor: ShadcnColors.background,
      appBar: AppBar(
        title: const Text('Inventory & Stock'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            tooltip: 'Refresh Catalog',
            onPressed: () {
              HapticFeedback.selectionClick();
              ref.read(catalogProvider.notifier).reload();
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Summary KPI Banner
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: ShadcnCard(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total SKUs', style: ShadcnTypography.caption),
                        const SizedBox(height: 2),
                        Text(
                          '${catalogState.allProducts.length}',
                          style: ShadcnTypography.h2.copyWith(color: ShadcnColors.foreground),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ShadcnCard(
                    padding: const EdgeInsets.all(12),
                    backgroundColor: lowStockCount > 0 ? ShadcnColors.warningLight : ShadcnColors.card,
                    borderColor: lowStockCount > 0 ? ShadcnColors.warning.withOpacity(0.4) : ShadcnColors.border,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Low Stock (<5)', style: ShadcnTypography.caption),
                        const SizedBox(height: 2),
                        Text(
                          '$lowStockCount items',
                          style: ShadcnTypography.h2.copyWith(
                            color: lowStockCount > 0 ? ShadcnColors.warningForeground : ShadcnColors.foreground,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ShadcnCard(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Stock Value', style: ShadcnTypography.caption),
                        const SizedBox(height: 2),
                        Text(
                          '₹${(totalInventoryPaisa / 100).toStringAsFixed(0)}',
                          style: ShadcnTypography.h2.copyWith(color: ShadcnColors.primary),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Search Input
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: ShadcnInput(
              controller: _searchController,
              placeholder: 'Search by product name, SKU or barcode...',
              prefixIcon: const Icon(Icons.search, size: 18, color: ShadcnColors.mutedForeground),
              showClearButton: true,
              onChanged: (val) => ref.read(catalogProvider.notifier).updateSearch(val),
            ),
          ),

          // Category Chips Filter
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: catalogState.availableCategories.map((cat) {
                final isSelected = catalogState.selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: InkWell(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      ref.read(catalogProvider.notifier).selectCategory(cat);
                    },
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: isSelected ? ShadcnColors.foreground : ShadcnColors.surface,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: isSelected ? ShadcnColors.foreground : ShadcnColors.border,
                          width: 1.0,
                        ),
                      ),
                      child: Text(
                        cat,
                        style: ShadcnTypography.caption.copyWith(
                          color: isSelected ? Colors.white : ShadcnColors.foreground,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 4),

          // Product List
          Expanded(
            child: products.isEmpty
                ? ShadcnEmptyState(
                    icon: Icons.inventory_2_outlined,
                    title: 'No Products in Catalog',
                    description: 'Tap "+ Add Item" below to register products and stock.',
                    actionText: 'Add Product',
                    onActionPressed: _openAddProductDialog,
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 6, 16, 80),
                    itemCount: products.length,
                    itemBuilder: (ctx, idx) {
                      final p = products[idx];
                      final isLowStock = p.currentStock <= 5.0;
                      final isOut = p.currentStock <= 0;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: ShadcnCard(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Leading initial avatar
                                  Container(
                                    width: 38,
                                    height: 38,
                                    decoration: BoxDecoration(
                                      color: ShadcnColors.secondary,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: ShadcnColors.border),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      p.name.isNotEmpty ? p.name.substring(0, 1).toUpperCase() : 'P',
                                      style: ShadcnTypography.bodySemibold.copyWith(color: ShadcnColors.foreground),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(p.name, style: ShadcnTypography.bodySemibold),
                                        const SizedBox(height: 2),
                                        Row(
                                          children: [
                                            Text(
                                              '${p.category} • ${p.sku}',
                                              style: ShadcnTypography.caption,
                                            ),
                                            if (p.barcode != null && p.barcode!.isNotEmpty) ...[
                                              const SizedBox(width: 4),
                                              Text('• ${p.barcode}', style: ShadcnTypography.code.copyWith(fontSize: 10)),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '₹${(p.sellingPricePaisa / 100).toStringAsFixed(2)}',
                                        style: ShadcnTypography.currency.copyWith(fontSize: 15),
                                      ),
                                      if (p.purchaseCostPaisa > 0)
                                        Text(
                                          'Cost: ₹${(p.purchaseCostPaisa / 100).toStringAsFixed(2)}',
                                          style: ShadcnTypography.caption.copyWith(fontSize: 10),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              const Divider(height: 1, color: ShadcnColors.border),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  ShadcnBadge(
                                    text: isOut
                                        ? 'Out of Stock'
                                        : (isLowStock
                                            ? '${p.currentStock.toStringAsFixed(0)} ${p.unit} left'
                                            : '${p.currentStock.toStringAsFixed(0)} ${p.unit} in stock'),
                                    variant: isOut
                                        ? ShadcnBadgeVariant.destructive
                                        : (isLowStock ? ShadcnBadgeVariant.warning : ShadcnBadgeVariant.success),
                                  ),
                                  Row(
                                    children: [
                                      ShadcnButton(
                                        text: 'Adjust',
                                        size: ShadcnButtonSize.sm,
                                        variant: ShadcnButtonVariant.outline,
                                        leadingIcon: const Icon(Icons.tune_outlined, size: 14),
                                        onPressed: () => _openStockAdjustmentDialog(p),
                                      ),
                                      const SizedBox(width: 6),
                                      ShadcnButton(
                                        text: 'Edit',
                                        size: ShadcnButtonSize.sm,
                                        variant: ShadcnButtonVariant.secondary,
                                        leadingIcon: const Icon(Icons.edit_outlined, size: 14),
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
        backgroundColor: ShadcnColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add, size: 20),
        label: const Text('Add Item', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        elevation: 2,
      ),
    );
  }
}
