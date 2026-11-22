import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models/product.dart';
import '../../core/providers/catalog_provider.dart';
import '../../core/providers/sync_provider.dart';
import '../../core/theme/shadcn_colors.dart';
import '../../core/theme/shadcn_typography.dart';
import 'widgets/add_edit_restaurant_dish_dialog.dart';
import 'widgets/ai_menu_upload_dialog.dart';

class RestaurantMenuScreen extends ConsumerStatefulWidget {
  const RestaurantMenuScreen({super.key});

  @override
  ConsumerState<RestaurantMenuScreen> createState() => _RestaurantMenuScreenState();
}

class _RestaurantMenuScreenState extends ConsumerState<RestaurantMenuScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedDietaryFilter = 'ALL'; // 'ALL', 'VEG', 'NON_VEG', 'EGG'
  String _selectedCourseFilter = 'ALL';

  final List<String> _courses = [
    'ALL',
    'Starters & Appetizers',
    'Main Course',
    'Breads & Rice',
    'Tandoori & Grills',
    'Beverages & Shakes',
    'Desserts & Sweets',
    'Snacks & Fast Food',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openAddDishDialog() {
    showDialog(
      context: context,
      builder: (ctx) => const AddEditRestaurantDishDialog(),
    );
  }

  void _openAiMenuScanDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const AiMenuUploadDialog(),
    );
  }

  void _openEditDishDialog(Product dish) {
    showDialog(
      context: context,
      builder: (ctx) => AddEditRestaurantDishDialog(dish: dish),
    );
  }

  Future<void> _toggleAvailability(Product dish) async {
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
      isAvailable: !dish.isAvailable,
      isMadeToOrder: dish.isMadeToOrder,
      variants: dish.variants,
    );

    await ref.read(catalogProvider.notifier).updateProduct(updated);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            updated.isAvailable
                ? '${dish.name} is now available on menu'
                : '${dish.name} marked as Sold Out (86\'d)',
          ),
          duration: const Duration(seconds: 2),
          backgroundColor: updated.isAvailable ? ShadcnColors.primary : ShadcnColors.destructive,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Automatically re-fetch catalog dishes when synchronization commits
    ref.listen<SyncState>(syncStateProvider, (prev, next) {
      if (prev?.syncSequence != next.syncSequence ||
          prev?.lastSyncTime != next.lastSyncTime ||
          (prev?.isSyncing == true && !next.isSyncing && next.status == SyncStatus.synced)) {
        ref.read(catalogProvider.notifier).reload();
      }
    });

    final catalogState = ref.watch(catalogProvider);
    final allProducts = catalogState.allProducts;

    final vegCount = allProducts.where((p) => p.isVeg).length;
    final nonVegCount = allProducts.where((p) => p.isNonVeg).length;
    final soldOutCount = allProducts.where((p) => !p.isAvailable).length;

    final filteredDishes = allProducts.where((p) {
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final matchName = p.name.toLowerCase().contains(query);
        final matchSku = p.sku.toLowerCase().contains(query);
        final matchCategory = p.category.toLowerCase().contains(query);
        if (!matchName && !matchSku && !matchCategory) return false;
      }

      if (_selectedDietaryFilter != 'ALL') {
        if (_selectedDietaryFilter == 'VEG' && !p.isVeg) return false;
        if (_selectedDietaryFilter == 'NON_VEG' && !p.isNonVeg) return false;
        if (_selectedDietaryFilter == 'EGG' && !p.isEgg) return false;
      }

      if (_selectedCourseFilter != 'ALL') {
        if (p.category != _selectedCourseFilter) return false;
      }

      return true;
    }).toList();

    return Scaffold(
      backgroundColor: ShadcnColors.background,
      appBar: AppBar(
        title: const Text('Restaurant Menu & Dishes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Menu',
            onPressed: () => ref.read(catalogProvider.notifier).loadCatalog(),
          ),
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: Color(0xFFF59E0B)),
            tooltip: 'AI Menu Scan',
            onPressed: _openAiMenuScanDialog,
          ),
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Add Dish',
            onPressed: _openAddDishDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // AI Menu Scanner Quick Prompt Banner
          Container(
            margin: const EdgeInsets.fromLTRB(16, 6, 16, 2),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [const Color(0xFFF59E0B).withOpacity(0.12), const Color(0xFFF59E0B).withOpacity(0.04)],
              ),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.35)),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, size: 18, color: Color(0xFFD97706)),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Upload Paper Menu with AI',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF92400E)),
                      ),
                      Text(
                        'Snap a photo of your paper menu to auto-import dishes & prices',
                        style: TextStyle(fontSize: 10.5, color: ShadcnColors.mutedForeground),
                      ),
                    ],
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD97706),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    minimumSize: const Size(50, 28),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  onPressed: _openAiMenuScanDialog,
                  child: const Text('Scan', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          // KPI Metric Header Strip
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Row(
              children: [
                Expanded(
                  child: _buildMetricTile(
                    label: 'Total Dishes',
                    value: '${allProducts.length}',
                    icon: Icons.restaurant,
                    color: ShadcnColors.primary,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildMetricTile(
                    label: 'Pure Veg',
                    value: '$vegCount',
                    icon: Icons.eco,
                    color: const Color(0xFF16A34A),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildMetricTile(
                    label: 'Non-Veg',
                    value: '$nonVegCount',
                    icon: Icons.kebab_dining,
                    color: const Color(0xFFDC2626),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildMetricTile(
                    label: 'Sold Out (86)',
                    value: '$soldOutCount',
                    icon: Icons.cancel_outlined,
                    color: soldOutCount > 0 ? ShadcnColors.destructive : ShadcnColors.mutedForeground,
                  ),
                ),
              ],
            ),
          ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search dishes by name or category...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                fillColor: ShadcnColors.card,
                filled: true,
              ),
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
            ),
          ),

          // Dietary Filter Strip
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            child: Row(
              children: [
                _buildDietaryFilterChip('ALL', 'All Items'),
                const SizedBox(width: 6),
                _buildDietaryFilterChip('VEG', '🟢 Pure Veg'),
                const SizedBox(width: 6),
                _buildDietaryFilterChip('NON_VEG', '🔴 Non-Veg'),
                const SizedBox(width: 6),
                _buildDietaryFilterChip('EGG', '🟡 Egg'),
              ],
            ),
          ),

          // Course Category Strip
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: _courses.map((course) {
                final isSelected = _selectedCourseFilter == course;
                final label = course == 'ALL' ? 'All Courses' : course;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text(
                      label,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? Colors.white : ShadcnColors.foreground,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: ShadcnColors.secondary,
                    backgroundColor: ShadcnColors.card,
                    onSelected: (selected) {
                      if (selected) setState(() => _selectedCourseFilter = course);
                    },
                  ),
                );
              }).toList(),
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
                        const Icon(Icons.dinner_dining, size: 56, color: ShadcnColors.mutedForeground),
                        const SizedBox(height: 12),
                        Text(
                          allProducts.isEmpty ? 'No dishes in restaurant menu yet' : 'No matching dishes found',
                          style: ShadcnTypography.h3.copyWith(color: ShadcnColors.mutedForeground),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          allProducts.isEmpty
                              ? 'Tap "+ Add Dish" below to build your culinary menu'
                              : 'Try adjusting your search query or dietary filters',
                          style: ShadcnTypography.caption,
                        ),
                        if (allProducts.isEmpty) ...[
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFD97706),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                ),
                                icon: const Icon(Icons.auto_awesome, size: 18),
                                label: const Text('Scan Menu with AI'),
                                onPressed: _openAiMenuScanDialog,
                              ),
                              const SizedBox(width: 10),
                              OutlinedButton.icon(
                                icon: const Icon(Icons.add, size: 18),
                                label: const Text('Add Dish'),
                                onPressed: _openAddDishDialog,
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 6, 16, 80),
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
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: ShadcnColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Add Dish', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: _openAddDishDialog,
      ),
    );
  }

  Widget _buildMetricTile({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      decoration: BoxDecoration(
        color: ShadcnColors.card,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: ShadcnColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(fontSize: 10, color: ShadcnColors.mutedForeground),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildDietaryFilterChip(String value, String label) {
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
    final hasVariants = dish.variants != null && dish.variants!.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isAvail ? ShadcnColors.card : ShadcnColors.destructive.withOpacity(0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isAvail ? ShadcnColors.border : ShadcnColors.destructive.withOpacity(0.25),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Dish Photo or Dietary Indicator
          Stack(
            children: [
              _buildDishThumbnail(dish.imageUrl),
              Positioned(
                bottom: 2,
                right: 2,
                child: _buildDietaryBadge(dish),
              ),
            ],
          ),
          const SizedBox(width: 12),

          // Dish Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        dish.name,
                        style: ShadcnTypography.body.copyWith(
                          fontWeight: FontWeight.bold,
                          decoration: isAvail ? null : TextDecoration.lineThrough,
                          color: isAvail ? ShadcnColors.foreground : ShadcnColors.mutedForeground,
                        ),
                      ),
                    ),
                    if (!isAvail)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: ShadcnColors.destructive.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: ShadcnColors.destructive.withOpacity(0.4)),
                        ),
                        child: const Text(
                          '86\'d SOLD OUT',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: ShadcnColors.destructive,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),

                // Pricing Row
                if (hasVariants) ...[
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: dish.variants!.map((v) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: ShadcnColors.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: ShadcnColors.primary.withOpacity(0.2)),
                        ),
                        child: Text(
                          '${v.name}: ₹${v.price.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: ShadcnColors.primary,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ] else ...[
                  Text(
                    '₹${dish.sellingPriceRupees.toStringAsFixed(2)}',
                    style: ShadcnTypography.body.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isAvail ? ShadcnColors.primary : ShadcnColors.mutedForeground,
                    ),
                  ),
                ],
                const SizedBox(height: 5),

                // Metadata Tags (Course, Station, Prep Time, Made to Order)
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: ShadcnColors.secondary.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        dish.category,
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                    if (dish.kitchenStation != null && dish.kitchenStation != 'main_kitchen')
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: ShadcnColors.warning.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          dish.kitchenStation == 'tandoor'
                              ? 'Tandoor'
                              : dish.kitchenStation == 'beverage_bar'
                                  ? 'Bar'
                                  : 'Bakery',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: ShadcnColors.warning,
                          ),
                        ),
                      ),
                    if (dish.prepTimeMinutes != null && dish.prepTimeMinutes! > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: ShadcnColors.muted.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '⏱️ ${dish.prepTimeMinutes}m',
                          style: const TextStyle(fontSize: 10, color: ShadcnColors.mutedForeground),
                        ),
                      ),
                    if (dish.isMadeToOrder)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF16A34A).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          '👨‍🍳 Prepared',
                          style: TextStyle(fontSize: 10, color: Color(0xFF16A34A), fontWeight: FontWeight.w600),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),

          // Actions: 1-Tap 86'd Toggle & Edit Button
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                tooltip: isAvail ? 'Mark Sold Out (86\'d)' : 'Mark In Stock',
                icon: Icon(
                  isAvail ? Icons.check_circle : Icons.cancel,
                  color: isAvail ? const Color(0xFF16A34A) : ShadcnColors.destructive,
                  size: 24,
                ),
                onPressed: () => _toggleAvailability(dish),
              ),
              IconButton(
                tooltip: 'Edit Dish',
                icon: const Icon(Icons.edit_outlined, size: 20, color: ShadcnColors.mutedForeground),
                onPressed: () => _openEditDishDialog(dish),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDishThumbnail(String? imageUrl, {double size = 52}) {
    if (imageUrl != null && imageUrl.isNotEmpty) {
      if (imageUrl.startsWith('data:image/')) {
        try {
          final commaIdx = imageUrl.indexOf(',');
          final base64Str = commaIdx != -1 ? imageUrl.substring(commaIdx + 1) : imageUrl;
          final bytes = base64Decode(base64Str);
          return ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.memory(bytes, width: size, height: size, fit: BoxFit.cover),
          );
        } catch (_) {}
      } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            imageUrl,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _buildFallbackThumbnail(size),
          ),
        );
      }
    }
    return _buildFallbackThumbnail(size);
  }

  Widget _buildFallbackThumbnail(double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: ShadcnColors.card,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ShadcnColors.border),
      ),
      child: const Center(
        child: Icon(Icons.lunch_dining, size: 26, color: ShadcnColors.mutedForeground),
      ),
    );
  }

  Widget _buildDietaryBadge(Product dish) {
    return Container(
      width: 16,
      height: 16,
      decoration: BoxDecoration(
        color: Colors.white,
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
            ? const Icon(Icons.change_history, size: 8, color: Color(0xFFDC2626))
            : Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: dish.isEgg ? const Color(0xFFD97706) : const Color(0xFF16A34A),
                ),
              ),
      ),
    );
  }
}
