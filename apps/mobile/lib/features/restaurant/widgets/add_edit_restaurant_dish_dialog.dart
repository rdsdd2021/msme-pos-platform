import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/product.dart';
import '../../../core/providers/catalog_provider.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/shadcn_colors.dart';
import '../../../core/theme/shadcn_typography.dart';

class AddEditRestaurantDishDialog extends ConsumerStatefulWidget {
  final Product? dish;

  const AddEditRestaurantDishDialog({super.key, this.dish});

  @override
  ConsumerState<AddEditRestaurantDishDialog> createState() => _AddEditRestaurantDishDialogState();
}

class _AddEditRestaurantDishDialogState extends ConsumerState<AddEditRestaurantDishDialog> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _priceController;
  late TextEditingController _prepTimeController;

  late String _selectedCourse;
  late String _selectedFoodType; // 'veg', 'non_veg', 'egg', 'vegan'
  late String _selectedKitchenStation; // 'main_kitchen', 'tandoor', 'beverage_bar', 'bakery_dessert'
  late bool _isAvailable;
  late bool _isMadeToOrder;
  bool _isSaving = false;

  final List<String> _courses = [
    'Starters & Appetizers',
    'Main Course',
    'Breads & Rice',
    'Tandoori & Grills',
    'Beverages & Shakes',
    'Desserts & Sweets',
    'Snacks & Fast Food',
  ];

  @override
  void initState() {
    super.initState();
    final d = widget.dish;
    _nameController = TextEditingController(text: d?.name ?? '');
    _priceController = TextEditingController(
      text: d != null ? (d.sellingPricePaisa / 100.0).toStringAsFixed(2) : '',
    );
    _prepTimeController = TextEditingController(
      text: (d?.prepTimeMinutes ?? 15).toString(),
    );

    _selectedCourse = (d != null && _courses.contains(d.category))
        ? d.category
        : _courses[1]; // Default to Main Course
    _selectedFoodType = d?.foodType ?? 'veg';
    _selectedKitchenStation = d?.kitchenStation ?? 'main_kitchen';
    _isAvailable = d?.isAvailable ?? true;
    _isMadeToOrder = d?.isMadeToOrder ?? true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _priceController.dispose();
    _prepTimeController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    final tenantId = ref.read(authProvider).activeMembership?.tenantId ?? 'tenant-1';

    try {
      final name = _nameController.text.trim();
      final priceRupees = double.tryParse(_priceController.text.trim()) ?? 0.0;
      final pricePaisa = (priceRupees * 100).round();
      final prepTime = int.tryParse(_prepTimeController.text.trim()) ?? 15;

      if (widget.dish != null) {
        final updated = Product(
          id: widget.dish!.id,
          name: name,
          sku: widget.dish!.sku,
          barcode: widget.dish!.barcode,
          category: _selectedCourse,
          unit: 'PORTION',
          sellingPricePaisa: pricePaisa,
          purchaseCostPaisa: widget.dish!.purchaseCostPaisa,
          gstRate: 5, // 5% composite F&B GST
          currentStock: widget.dish!.currentStock,
          hsnCode: widget.dish!.hsnCode,
          imageUrl: widget.dish!.imageUrl,
          foodType: _selectedFoodType,
          kitchenStation: _selectedKitchenStation,
          prepTimeMinutes: prepTime,
          isAvailable: _isAvailable,
          isMadeToOrder: _isMadeToOrder,
        );
        await ref.read(catalogProvider.notifier).updateProduct(updated);
      } else {
        final autoSku = 'DISH-${(DateTime.now().millisecondsSinceEpoch % 1000000).toString().padLeft(6, '0')}';
        await ref.read(catalogProvider.notifier).addProduct(
          name: name,
          sku: autoSku,
          category: _selectedCourse,
          unit: 'PORTION',
          sellingPricePaisa: pricePaisa,
          purchaseCostPaisa: 0,
          mrpPaisa: pricePaisa,
          gstRate: 5.0,
          initialStock: 0.0,
          foodType: _selectedFoodType,
          kitchenStation: _selectedKitchenStation,
          prepTimeMinutes: prepTime,
          isAvailable: _isAvailable,
          isMadeToOrder: _isMadeToOrder,
          tenantId: tenantId,
        );
      }

      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.dish != null ? 'Dish updated successfully' : 'Dish added to menu',
            ),
            backgroundColor: ShadcnColors.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save dish: $e'),
            backgroundColor: ShadcnColors.destructive,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: ShadcnColors.card,
      child: Container(
        width: 480,
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: ShadcnColors.warning.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.restaurant_menu, color: ShadcnColors.warning, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.dish != null ? 'Edit Menu Dish' : 'Add Restaurant Dish',
                            style: ShadcnTypography.h3,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Culinary dish attributes & kitchen routing',
                            style: ShadcnTypography.caption,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(height: 1, color: ShadcnColors.border),
                const SizedBox(height: 16),

                // Dish Name
                Text('Dish Name *', style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    hintText: 'e.g. Paneer Butter Masala, Cold Coffee',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Dish name required' : null,
                ),
                const SizedBox(height: 14),

                // Course Category
                Text('Course / Menu Category', style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  value: _selectedCourse,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: _courses.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 13)))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedCourse = val);
                  },
                ),
                const SizedBox(height: 14),

                // Dietary Tag Selection
                Text('Dietary Classification *', style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    _buildDietaryChip('veg', 'Pure Veg', const Color(0xFF16A34A), Icons.circle),
                    const SizedBox(width: 8),
                    _buildDietaryChip('non_veg', 'Non-Veg', const Color(0xFFDC2626), Icons.change_history),
                    const SizedBox(width: 8),
                    _buildDietaryChip('egg', 'Egg', const Color(0xFFD97706), Icons.egg),
                  ],
                ),
                const SizedBox(height: 14),

                // Kitchen Routing Station
                Text('Kitchen Routing Station *', style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildStationChip('main_kitchen', 'Main Kitchen', Icons.soup_kitchen),
                    _buildStationChip('tandoor', 'Tandoor & Grill', Icons.local_fire_department),
                    _buildStationChip('beverage_bar', 'Beverage Bar', Icons.local_cafe),
                    _buildStationChip('bakery_dessert', 'Bakery & Dessert', Icons.cake),
                  ],
                ),
                const SizedBox(height: 16),

                // Price & Prep Time
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Selling Price (₹) *', style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _priceController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(
                              prefixText: '₹ ',
                              hintText: '250.00',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Price required';
                              if (double.tryParse(v.trim()) == null) return 'Invalid price';
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Prep Time (Mins)', style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _prepTimeController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              suffixText: 'm',
                              hintText: '15',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Availability & Made to Order Checkboxes
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  title: const Text('Available on Menu', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: const Text('Uncheck to mark dish Sold Out (86\'d)', style: TextStyle(fontSize: 11)),
                  value: _isAvailable,
                  activeColor: ShadcnColors.primary,
                  onChanged: (v) => setState(() => _isAvailable = v ?? true),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  title: const Text('Made to Order (Cooked Food)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: const Text('No inventory balance or stock deduction', style: TextStyle(fontSize: 11)),
                  value: _isMadeToOrder,
                  activeColor: ShadcnColors.primary,
                  onChanged: (v) => setState(() => _isMadeToOrder = v ?? true),
                ),
                const SizedBox(height: 16),

                // Actions
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: _isSaving ? null : () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ShadcnColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: _isSaving ? null : _handleSave,
                      child: _isSaving
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text(widget.dish != null ? 'Save Changes' : 'Add to Menu'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDietaryChip(String type, String label, Color color, IconData icon) {
    final isSelected = _selectedFoodType == type;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedFoodType = type),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
          decoration: BoxDecoration(
            color: isSelected ? color.withOpacity(0.12) : ShadcnColors.card,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? color : ShadcnColors.border,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 16),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected ? color : ShadcnColors.foreground,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStationChip(String station, String label, IconData icon) {
    final isSelected = _selectedKitchenStation == station;
    return InkWell(
      onTap: () => setState(() => _selectedKitchenStation = station),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? ShadcnColors.primary.withOpacity(0.12) : ShadcnColors.card,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? ShadcnColors.primary : ShadcnColors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: isSelected ? ShadcnColors.primary : ShadcnColors.mutedForeground),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? ShadcnColors.primary : ShadcnColors.foreground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
