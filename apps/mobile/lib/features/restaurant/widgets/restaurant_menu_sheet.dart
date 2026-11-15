import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/product.dart';
import '../../../core/providers/catalog_provider.dart';
import '../../../core/theme/shadcn_colors.dart';
import '../../../core/theme/shadcn_typography.dart';
import 'add_edit_restaurant_dish_dialog.dart';

class RestaurantMenuSheet extends ConsumerStatefulWidget {
  const RestaurantMenuSheet({super.key});

  @override
  ConsumerState<RestaurantMenuSheet> createState() => _RestaurantMenuSheetState();
}

class _RestaurantMenuSheetState extends ConsumerState<RestaurantMenuSheet> {
  String _searchQuery = '';
  String _selectedDietaryFilter = 'ALL'; // 'ALL', 'VEG', 'NON_VEG', 'EGG'

  @override
  Widget build(BuildContext context) {
    final catalogState = ref.watch(catalogProvider);
    final allProducts = catalogState.allProducts;

    final filteredDishes = allProducts.filter((p) {
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final matchName = p.name.toLowerCase().contains(query);
        final matchSku = p.sku.toLowerCase().contains(query);
        if (!matchName && !matchSku) return false;
      }

      if (_selectedDietaryFilter != 'ALL') {
        if (_selectedDietaryFilter == 'VEG' && !p.isVeg) return false;
        if (_selectedDietaryFilter == 'NON_VEG' && !p.isNonVeg) return false;
        if (_selectedDietaryFilter == 'EGG' && !p.isEgg) return false;
      }

      return true;
    }).toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: ShadcnColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 8, bottom: 4),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: ShadcnColors.mutedForeground.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: ShadcnColors.warning.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.restaurant_menu, color: ShadcnColors.warning, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text('Menu & Dishes', style: ShadcnTypography.h3),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: ShadcnColors.card,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: ShadcnColors.border),
                            ),
                            child: Text(
                              '${allProducts.length} items',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      Text('1-tap 86\'d sold out toggles & kitchen routing', style: ShadcnTypography.caption),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ShadcnColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Add Dish', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => const AddEditRestaurantDishDialog(),
                    );
                  },
                ),
              ],
            ),
          ),

          // Search & Filter Strip
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search dishes by name...',
                prefixIcon: const Icon(Icons.search, size: 18),
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                fillColor: ShadcnColors.card,
                filled: true,
              ),
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
            ),
          ),

          // Dietary Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                _buildFilterChip('ALL', 'All Items'),
                const SizedBox(width: 6),
                _buildFilterChip('VEG', '🟢 Pure Veg'),
                const SizedBox(width: 6),
                _buildFilterChip('NON_VEG', '🔴 Non-Veg'),
                const SizedBox(width: 6),
                _buildFilterChip('EGG', '🟡 Egg'),
              ],
            ),
          ),
          const Divider(height: 12, color: ShadcnColors.border),

          // Dishes List
          Expanded(
            child: filteredDishes.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.lunch_dining, size: 40, color: ShadcnColors.mutedForeground),
                        const SizedBox(height: 8),
                        Text('No dishes found', style: ShadcnTypography.caption),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: filteredDishes.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final dish = filteredDishes[index];
                      return _buildDishCard(dish);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _selectedDietaryFilter == value;
    return InkWell(
      onTap: () => setState(() => _selectedDietaryFilter = value),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? ShadcnColors.primary : ShadcnColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? ShadcnColors.primary : ShadcnColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : ShadcnColors.foreground,
          ),
        ),
      ),
    );
  }

  Widget _buildDishCard(Product dish) {
    final isAvail = dish.isAvailable;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isAvail ? ShadcnColors.card : ShadcnColors.destructive.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isAvail ? ShadcnColors.border : ShadcnColors.destructive.withOpacity(0.25),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Dietary Icon Indicator
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              border: Border.all(
                color: dish.isNonVeg
                    ? const Color(0xFFDC2626)
                    : dish.isEgg
                        ? const Color(0xFFD97706)
                        : const Color(0xFF16A34A),
                width: 1.5,
              ),
              borderRadius: BorderRadius.circular(3),
            ),
            child: Center(
              child: dish.isNonVeg
                  ? const Icon(Icons.change_history, size: 10, color: Color(0xFFDC2626))
                  : Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: dish.isEgg ? const Color(0xFFD97706) : const Color(0xFF16A34A),
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),

          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        dish.name,
                        style: ShadcnTypography.body.copyWith(
                          fontWeight: FontWeight.bold,
                          decoration: isAvail ? null : TextDecoration.lineThrough,
                        ),
                      ),
                    ),
                    if (!isAvail)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: ShadcnColors.destructive.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'SOLD OUT',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: ShadcnColors.destructive,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Text(
                      '₹${dish.sellingPriceRupees.toStringAsFixed(2)}',
                      style: ShadcnTypography.caption.copyWith(
                        fontWeight: FontWeight.bold,
                        color: ShadcnColors.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      dish.category,
                      style: ShadcnTypography.caption.copyWith(color: ShadcnColors.mutedForeground),
                    ),
                    if (dish.kitchenStation != null && dish.kitchenStation != 'main_kitchen') ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: ShadcnColors.warning.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          dish.kitchenStation == 'tandoor'
                              ? 'Tandoor'
                              : dish.kitchenStation == 'beverage_bar'
                                  ? 'Bar'
                                  : 'Bakery',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: ShadcnColors.warning,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          // 1-Click Available / Sold-Out Toggle
          IconButton(
            tooltip: isAvail ? 'Mark Sold Out (86\'d)' : 'Mark In Stock',
            icon: Icon(
              isAvail ? Icons.check_circle : Icons.cancel,
              color: isAvail ? ShadcnColors.primary : ShadcnColors.destructive,
              size: 24,
            ),
            onPressed: () async {
              final updated = Product(
                id: dish.id,
                name: dish.name,
                sku: dish.sku,
                barcode: dish.barcode,
                category: dish.category,
                unit: dish.unit,
                sellingPricePaisa: dish.sellingPricePaisa,
                purchaseCostPaisa: dish.purchaseCostPaisa,
                gstRate: dish.gstRate,
                currentStock: dish.currentStock,
                hsnCode: dish.hsnCode,
                imageUrl: dish.imageUrl,
                foodType: dish.foodType,
                kitchenStation: dish.kitchenStation,
                prepTimeMinutes: dish.prepTimeMinutes,
                isAvailable: !isAvail,
                isMadeToOrder: dish.isMadeToOrder,
              );
              await ref.read(catalogProvider.notifier).updateProduct(updated);
            },
          ),

          // Edit dish
          IconButton(
            icon: const Icon(Icons.edit_outlined, size: 20, color: ShadcnColors.mutedForeground),
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => AddEditRestaurantDishDialog(dish: dish),
              );
            },
          ),
        ],
      ),
    );
  }
}

extension ProductIterableExtension on Iterable<Product> {
  Iterable<Product> filter(bool Function(Product element) test) => where(test);
}
