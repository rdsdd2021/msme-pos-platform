import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/product.dart';
import '../../../core/providers/catalog_provider.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/sync_provider.dart';
import '../../../core/theme/shadcn_colors.dart';
import '../../../core/theme/shadcn_typography.dart';
import '../../../core/widgets/product_photo_picker.dart';

class AddEditRestaurantDishDialog extends ConsumerStatefulWidget {
  final Product? dish;

  const AddEditRestaurantDishDialog({super.key, this.dish});

  @override
  ConsumerState<AddEditRestaurantDishDialog> createState() => _AddEditRestaurantDishDialogState();
}

class _VariantRow {
  final TextEditingController nameController;
  final TextEditingController priceController;

  _VariantRow({required String name, required String price})
      : nameController = TextEditingController(text: name),
        priceController = TextEditingController(text: price);

  void dispose() {
    nameController.dispose();
    priceController.dispose();
  }
}

class _AddEditRestaurantDishDialogState extends ConsumerState<AddEditRestaurantDishDialog> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _priceController;
  late TextEditingController _prepTimeController;

  String? _selectedImageUrl;
  late String _selectedCourse;
  late String _selectedFoodType; // 'veg', 'non_veg', 'egg', 'vegan'
  late String _selectedKitchenStation; // 'main_kitchen', 'tandoor', 'beverage_bar', 'bakery_dessert'
  late bool _isAvailable;
  late bool _isMadeToOrder;
  bool _hasVariants = false;
  final List<_VariantRow> _variantRows = [];
  bool _isSaving = false;

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

    _selectedImageUrl = d?.imageUrl;
    final available = ref.read(catalogProvider).menuCategories;
    if (d != null && d.category.isNotEmpty) {
      _selectedCourse = d.category;
    } else if (available.contains('Main Course')) {
      _selectedCourse = 'Main Course';
    } else {
      _selectedCourse = available.isNotEmpty ? available.first : 'Main Course';
    }
    _selectedFoodType = d?.foodType ?? 'veg';
    _selectedKitchenStation = d?.kitchenStation ?? 'main_kitchen';
    _isAvailable = d?.isAvailable ?? true;
    _isMadeToOrder = d?.isMadeToOrder ?? true;

    if (d?.variants != null && d!.variants!.isNotEmpty) {
      _hasVariants = true;
      for (final v in d.variants!) {
        _variantRows.add(_VariantRow(
          name: v.name,
          price: v.price.toStringAsFixed(2),
        ));
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _priceController.dispose();
    _prepTimeController.dispose();
    for (final row in _variantRows) {
      row.dispose();
    }
    super.dispose();
  }

  void _addVariantPreset(List<Map<String, String>> presets) {
    setState(() {
      _hasVariants = true;
      for (final row in _variantRows) {
        row.dispose();
      }
      _variantRows.clear();
      for (final p in presets) {
        _variantRows.add(_VariantRow(name: p['name']!, price: p['price']!));
      }
    });
  }

  void _addNewBlankVariant() {
    setState(() {
      _variantRows.add(_VariantRow(name: '', price: ''));
    });
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final authState = ref.read(authProvider);
    final tenantId = authState.activeMembership?.tenantId ??
        authState.user?.primaryMembership?.tenantId ??
        '';

    if (tenantId.isEmpty || tenantId == 'tenant-1') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please wait for store session to connect before adding dishes.')),
      );
      setState(() => _isSaving = false);
      return;
    }
    setState(() => _isSaving = true);

    try {
      final name = _nameController.text.trim();
      final prepTime = int.tryParse(_prepTimeController.text.trim()) ?? 15;

      // Extract variants if configured
      List<ProductVariant>? variants;
      if (_hasVariants && _variantRows.isNotEmpty) {
        final parsed = <ProductVariant>[];
        for (final row in _variantRows) {
          final vName = row.nameController.text.trim();
          final vPrice = double.tryParse(row.priceController.text.trim());
          if (vName.isNotEmpty && vPrice != null && vPrice > 0) {
            parsed.add(ProductVariant(name: vName, price: vPrice));
          }
        }
        if (parsed.isNotEmpty) {
          variants = parsed;
        }
      }

      int pricePaisa;
      if (variants != null && variants.isNotEmpty) {
        // Base price is first variant or parsed from single price field if provided
        final singlePrice = double.tryParse(_priceController.text.trim());
        if (singlePrice != null && singlePrice > 0) {
          pricePaisa = (singlePrice * 100).round();
        } else {
          pricePaisa = variants.first.pricePaisa;
        }
      } else {
        final priceRupees = double.tryParse(_priceController.text.trim()) ?? 0.0;
        pricePaisa = (priceRupees * 100).round();
      }

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
          imageUrl: _selectedImageUrl,
          foodType: _selectedFoodType,
          kitchenStation: _selectedKitchenStation,
          prepTimeMinutes: prepTime,
          isAvailable: _isAvailable,
          isMadeToOrder: _isMadeToOrder,
          variants: variants,
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
          imageUrl: _selectedImageUrl,
          foodType: _selectedFoodType,
          kitchenStation: _selectedKitchenStation,
          prepTimeMinutes: prepTime,
          isAvailable: _isAvailable,
          isMadeToOrder: _isMadeToOrder,
          variants: variants,
          tenantId: tenantId,
        );
      }

      // Trigger background cloud sync
      ref.read(syncStateProvider.notifier).syncNow();

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
        width: 500,
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
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
                            'Culinary dish attributes, portions & kitchen routing',
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

                // Dish Photo Picker
                ProductPhotoPicker(
                  initialImageUrl: _selectedImageUrl,
                  initialSearchQuery: _nameController.text.trim(),
                  onPhotoChanged: (url) {
                    setState(() => _selectedImageUrl = url);
                  },
                ),
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
                Builder(builder: (context) {
                  final dynamicCourses = <String>{
                    ...ref.watch(catalogProvider).menuCategories,
                    if (_selectedCourse.isNotEmpty) _selectedCourse,
                  }.toList();
                  return Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: dynamicCourses.contains(_selectedCourse) ? _selectedCourse : dynamicCourses.first,
                          isExpanded: true,
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          items: dynamicCourses
                              .map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 13))))
                              .toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedCourse = val);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        tooltip: 'Add New Category',
                        icon: const Icon(Icons.add_circle_outline, color: ShadcnColors.primary),
                        onPressed: () async {
                          final ctrl = TextEditingController();
                          final newCat = await showDialog<String>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('New Category', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              content: TextField(
                                controller: ctrl,
                                autofocus: true,
                                decoration: const InputDecoration(
                                  hintText: 'e.g. Momos, Combos, South Indian',
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                ),
                              ),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(backgroundColor: ShadcnColors.primary, foregroundColor: Colors.white),
                                  onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
                                  child: const Text('Add'),
                                ),
                              ],
                            ),
                          );
                          ctrl.dispose();
                          if (newCat != null && newCat.isNotEmpty) {
                            await ref.read(catalogProvider.notifier).addCategory(newCat);
                            if (mounted) setState(() => _selectedCourse = newCat);
                          }
                        },
                      ),
                    ],
                  );
                }),
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

                // Base Price & Prep Time
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _hasVariants ? 'Base / Regular Price (₹)' : 'Selling Price (₹) *',
                            style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold),
                          ),
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
                              if (!_hasVariants && (v == null || v.trim().isEmpty)) return 'Price required';
                              if (v != null && v.trim().isNotEmpty && double.tryParse(v.trim()) == null) {
                                return 'Invalid price';
                              }
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

                // Portion Sizes / Variants Section
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: ShadcnColors.background,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: ShadcnColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                const Icon(Icons.pie_chart_outline, size: 16, color: ShadcnColors.primary),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    'Portion Sizes (Half / Full / Custom)',
                                    style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: _hasVariants,
                            activeColor: ShadcnColors.primary,
                            onChanged: (val) {
                              setState(() {
                                _hasVariants = val;
                                if (val && _variantRows.isEmpty) {
                                  _addVariantPreset([
                                    {'name': 'Half', 'price': '180.00'},
                                    {'name': 'Full', 'price': '320.00'},
                                  ]);
                                }
                              });
                            },
                          ),
                        ],
                      ),
                      if (_hasVariants) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Configure multiple portions with individual prices for table ordering & thermal tickets.',
                          style: ShadcnTypography.caption.copyWith(fontSize: 11),
                        ),
                        const SizedBox(height: 8),

                        // Quick Presets
                        Row(
                          children: [
                            Text('Presets: ', style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.w600)),
                            const SizedBox(width: 4),
                            InkWell(
                              onTap: () => _addVariantPreset([
                                {'name': 'Half', 'price': '180.00'},
                                {'name': 'Full', 'price': '320.00'},
                              ]),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                decoration: BoxDecoration(
                                  color: ShadcnColors.card,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: ShadcnColors.border),
                                ),
                                child: const Text('Half / Full', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ),
                            const SizedBox(width: 6),
                            InkWell(
                              onTap: () => _addVariantPreset([
                                {'name': 'Small', 'price': '150.00'},
                                {'name': 'Medium', 'price': '250.00'},
                                {'name': 'Large', 'price': '350.00'},
                              ]),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                decoration: BoxDecoration(
                                  color: ShadcnColors.card,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: ShadcnColors.border),
                                ),
                                child: const Text('S / M / L', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // Variant Rows
                        ..._variantRows.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final row = entry.value;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              children: [
                                Expanded(
                                  flex: 3,
                                  child: TextFormField(
                                    controller: row.nameController,
                                    decoration: InputDecoration(
                                      hintText: 'e.g. Half, Full',
                                      labelText: 'Portion ${idx + 1}',
                                      isDense: true,
                                      border: const OutlineInputBorder(),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  flex: 2,
                                  child: TextFormField(
                                    controller: row.priceController,
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    decoration: const InputDecoration(
                                      prefixText: '₹ ',
                                      hintText: '180',
                                      isDense: true,
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, size: 18, color: ShadcnColors.destructive),
                                  onPressed: () {
                                    setState(() {
                                      final removed = _variantRows.removeAt(idx);
                                      removed.dispose();
                                    });
                                  },
                                ),
                              ],
                            ),
                          );
                        }),

                        // Add Custom Row
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Add Another Portion', style: TextStyle(fontSize: 12)),
                            onPressed: _addNewBlankVariant,
                          ),
                        ),
                      ],
                    ],
                  ),
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
                  subtitle: const Text('Prepared freshly; bypasses raw grocery inventory checks', style: TextStyle(fontSize: 11)),
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
