import 'dart:convert';
import 'package:drift/drift.dart' as drift;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';
import '../../../core/database/app_database.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/catalog_provider.dart';
import '../../../core/providers/sync_provider.dart';
import '../../../core/theme/shadcn_colors.dart';
import '../../../core/theme/shadcn_typography.dart';
import '../../../core/widgets/shadcn_badge.dart';
import '../../../core/widgets/shadcn_button.dart';
import '../../../core/widgets/shadcn_card.dart';

class ParsedDishItem {
  String name;
  double price;
  String category;
  String foodType; // 'veg', 'non_veg', 'egg'
  String kitchenStation;
  String? hsnCode;
  bool isSelected;

  ParsedDishItem({
    required this.name,
    required this.price,
    required this.category,
    required this.foodType,
    this.kitchenStation = 'main_kitchen',
    this.hsnCode,
    this.isSelected = true,
  });

  Map<String, dynamic> toJson() => {
        'name': name.trim(),
        'price': price.toStringAsFixed(2),
        'category': category.trim(),
        'foodType': foodType,
        'kitchenStation': kitchenStation,
        'hsnCode': hsnCode,
      };
}

class AiMenuUploadDialog extends ConsumerStatefulWidget {
  final bool isTestMode;

  const AiMenuUploadDialog({
    super.key,
    this.isTestMode = false,
  });

  @override
  ConsumerState<AiMenuUploadDialog> createState() => _AiMenuUploadDialogState();
}

class _AiMenuUploadDialogState extends ConsumerState<AiMenuUploadDialog> {
  int _step = 0; // 0 = Pick Photo, 1 = Analyzing, 2 = Review & Edit, 3 = Completed
  String? _errorMessage;
  String _statusText = '';
  List<ParsedDishItem> _dishes = [];
  bool _isImporting = false;
  final ImagePicker _picker = ImagePicker();

  Future<void> _handlePickImage(ImageSource source) async {
    setState(() {
      _errorMessage = null;
      _step = 1;
      _statusText = 'Preparing menu photo...';
    });

    try {
      String base64Image;
      String mimeType = 'image/jpeg';

      if (widget.isTestMode) {
        // Fast-path test image
        base64Image =
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
      } else {
        final XFile? file = await _picker.pickImage(
          source: source,
          maxWidth: 1920,
          maxHeight: 1920,
          imageQuality: 85,
        );

        if (file == null) {
          setState(() => _step = 0);
          return;
        }

        final bytes = await file.readAsBytes();
        base64Image = base64Encode(bytes);
        if (file.name.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        } else if (file.name.toLowerCase().endsWith('.webp')) {
          mimeType = 'image/webp';
        }
      }

      setState(() {
        _statusText = 'Analyzing menu with Gemini Vision AI...\nExtracting dish names, courses & prices...';
      });

      final authState = ref.read(authProvider);
      final tenantId = authState.activeMembership?.tenantId ?? 'tenant-1';
      final syncRepo = ref.read(syncRepositoryProvider);

      final result = await syncRepo.parseAiMenu(
        tenantId: tenantId,
        imageBase64: base64Image,
        mimeType: mimeType,
        isTestMode: widget.isTestMode,
      );

      final rawDishes = (result['dishes'] as List<dynamic>?) ?? [];
      if (rawDishes.isEmpty) {
        setState(() {
          _step = 0;
          _errorMessage = 'No dishes could be detected. Please ensure the menu photo is clear, focused, and well-lit.';
        });
        return;
      }

      final parsed = rawDishes.map((d) {
        final m = d as Map<String, dynamic>;
        final priceNum = double.tryParse(m['price']?.toString() ?? '100') ?? 100.0;
        final foodType = (m['foodType']?.toString().toLowerCase() ?? 'veg');
        return ParsedDishItem(
          name: m['name']?.toString() ?? 'Dish Item',
          price: priceNum,
          category: m['category']?.toString() ?? 'Main Course',
          foodType: foodType == 'non_veg' ? 'non_veg' : (foodType == 'egg' ? 'egg' : 'veg'),
          kitchenStation: m['kitchenStation']?.toString() ?? 'main_kitchen',
          hsnCode: m['hsnCode']?.toString(),
          isSelected: true,
        );
      }).toList();

      setState(() {
        _dishes = parsed;
        _step = 2; // Move to review step
      });
    } catch (e) {
      setState(() {
        _step = 0;
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  void _toggleSelectAll(bool select) {
    setState(() {
      for (final d in _dishes) {
        d.isSelected = select;
      }
    });
  }

  void _openEditDishSheet(int index) {
    final dish = _dishes[index];
    final nameCtrl = TextEditingController(text: dish.name);
    final priceCtrl = TextEditingController(text: dish.price.toStringAsFixed(0));
    final catCtrl = TextEditingController(text: dish.category);
    String selectedFoodType = dish.foodType;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: ShadcnColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Edit Dish Details', style: ShadcnTypography.h3),
              const SizedBox(height: 12),
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Dish Name',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextField(
                      controller: priceCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Price (₹)',
                        border: OutlineInputBorder(),
                        prefixText: '₹ ',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 3,
                    child: TextField(
                      controller: catCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Course / Category',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Text('Dietary: ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ChoiceChip(
                    label: const Text('Veg', style: TextStyle(fontSize: 11)),
                    selected: selectedFoodType == 'veg',
                    selectedColor: const Color(0xFFDCFCE7),
                    onSelected: (val) => setSheetState(() => selectedFoodType = 'veg'),
                  ),
                  const SizedBox(width: 6),
                  ChoiceChip(
                    label: const Text('Non-Veg', style: TextStyle(fontSize: 11)),
                    selected: selectedFoodType == 'non_veg',
                    selectedColor: const Color(0xFFFEE2E2),
                    onSelected: (val) => setSheetState(() => selectedFoodType = 'non_veg'),
                  ),
                  const SizedBox(width: 6),
                  ChoiceChip(
                    label: const Text('Egg', style: TextStyle(fontSize: 11)),
                    selected: selectedFoodType == 'egg',
                    selectedColor: const Color(0xFFFEF3C7),
                    onSelected: (val) => setSheetState(() => selectedFoodType = 'egg'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ShadcnButton(
                text: 'Save Changes',
                onPressed: () {
                  final parsedPrice = double.tryParse(priceCtrl.text.trim()) ?? dish.price;
                  setState(() {
                    dish.name = nameCtrl.text.trim();
                    dish.price = parsedPrice;
                    dish.category = catCtrl.text.trim();
                    dish.foodType = selectedFoodType;
                  });
                  Navigator.pop(ctx);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleImportDishes() async {
    final selectedDishes = _dishes.where((d) => d.isSelected).toList();
    if (selectedDishes.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one dish to import'),
          backgroundColor: ShadcnColors.destructive,
        ),
      );
      return;
    }

    setState(() => _isImporting = true);
    final authState = ref.read(authProvider);
    final tenantId = authState.activeMembership?.tenantId ?? 'tenant-1';
    final branchId = authState.activeMembership?.branchId;
    final syncRepo = ref.read(syncRepositoryProvider);
    final catalogRepo = ref.read(localCatalogRepoProvider);

    try {
      // 1. Send bulk import request to backend
      final dishesPayload = selectedDishes.map((d) => d.toJson()).toList();
      await syncRepo.importAiMenu(
        tenantId: tenantId,
        branchId: branchId,
        dishes: dishesPayload,
        isTestMode: widget.isTestMode,
      );

      // 2. Insert into local SQLite immediately so dishes appear instantly
      final now = DateTime.now();
      final companions = selectedDishes.map((d) {
        final id = const Uuid().v4();
        final pricePaisa = (d.price * 100).round();
        final autoSku = 'DISH-${(now.millisecondsSinceEpoch % 1000000).toString().padLeft(6, '0')}-${id.substring(0, 4).toUpperCase()}';

        return LocalProductsCompanion.insert(
          id: id,
          tenantId: tenantId,
          sku: autoSku,
          name: d.name.trim(),
          sellingPricePaisa: pricePaisa,
          purchaseCostPaisa: drift.Value((pricePaisa * 0.4).round()),
          mrpPaisa: drift.Value(pricePaisa),
          gstRatePercent: const drift.Value(5.0),
          categoryName: drift.Value(d.category.trim()),
          unit: const drift.Value('PORTION'),
          stockQuantity: const drift.Value(0.0),
          foodType: drift.Value(d.foodType),
          kitchenStation: drift.Value(d.kitchenStation),
          prepTimeMinutes: const drift.Value(15),
          isAvailable: const drift.Value(true),
          isMadeToOrder: const drift.Value(true),
          updatedAt: drift.Value(now),
        );
      }).toList();

      await catalogRepo.batchInsertProducts(companions);

      // 3. Reload catalog state
      await ref.read(catalogProvider.notifier).loadCatalog();

      // 4. Trigger cloud sync in background
      ref.read(syncStateProvider.notifier).syncNow();

      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully imported ${selectedDishes.length} dishes to menu!'),
            backgroundColor: ShadcnColors.primary,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      setState(() => _isImporting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Import failed: ${e.toString().replaceAll("Exception: ", "")}'),
            backgroundColor: ShadcnColors.destructive,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;

    return Container(
      constraints: BoxConstraints(
        maxHeight: screenHeight * 0.88,
      ),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      decoration: const BoxDecoration(
        color: ShadcnColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.auto_awesome, color: Color(0xFFD97706), size: 22),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('AI Menu Scanner', style: ShadcnTypography.h3),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD97706),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('GEMINI AI', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    Text(
                      _step == 2
                          ? 'Review and adjust parsed dishes before importing'
                          : 'Extract dishes, prices & dietary flags from paper menus',
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
          const Divider(height: 20),

          // Error Banner if present
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(10),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: ShadcnColors.destructive.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: ShadcnColors.destructive.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: ShadcnColors.destructive, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(_errorMessage!, style: const TextStyle(fontSize: 12, color: ShadcnColors.destructive)),
                  ),
                ],
              ),
            ),
          ],

          // Step 0: Image Pick View
          if (_step == 0) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'Upload a photo of your restaurant menu card, takeout leaflet, or daily specials chalkboard. Our Vision AI will automatically parse all dishes and pricing.',
                style: ShadcnTypography.body.copyWith(color: ShadcnColors.mutedForeground, fontSize: 13),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => _handlePickImage(ImageSource.camera),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 12),
                      decoration: BoxDecoration(
                        color: ShadcnColors.card,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: ShadcnColors.border),
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: ShadcnColors.primary.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt_rounded, size: 28, color: ShadcnColors.primary),
                          ),
                          const SizedBox(height: 12),
                          const Text('Take Photo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          const SizedBox(height: 4),
                          Text('Snap paper menu', style: ShadcnTypography.caption),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: InkWell(
                    onTap: () => _handlePickImage(ImageSource.gallery),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 12),
                      decoration: BoxDecoration(
                        color: ShadcnColors.card,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: ShadcnColors.border),
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B).withOpacity(0.12),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.photo_library_rounded, size: 28, color: Color(0xFFD97706)),
                          ),
                          const SizedBox(height: 12),
                          const Text('Choose Image', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          const SizedBox(height: 4),
                          Text('From gallery or files', style: ShadcnTypography.caption),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: ShadcnColors.background,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: ShadcnColors.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.tips_and_updates_outlined, size: 18, color: Color(0xFFD97706)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Tip: Ensure adequate lighting and hold phone parallel to the menu card. Clear text yields higher recognition accuracy.',
                      style: TextStyle(fontSize: 11, color: ShadcnColors.mutedForeground),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Step 1: Analyzing View
          if (_step == 1) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(
                    width: 48,
                    height: 48,
                    child: CircularProgressIndicator(
                      strokeWidth: 3.5,
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFD97706)),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(_statusText, textAlign: TextAlign.center, style: ShadcnTypography.bodySemibold),
                  const SizedBox(height: 8),
                  Text('This usually takes 3 to 8 seconds...', style: ShadcnTypography.caption),
                ],
              ),
            ),
          ],

          // Step 2: Review & Edit Parsed Dishes List
          if (_step == 2) ...[
            // KPI Summary Row
            Row(
              children: [
                Text(
                  '${_dishes.where((d) => d.isSelected).length}/${_dishes.length} Selected',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () => _toggleSelectAll(true),
                  child: const Text('Select All', style: TextStyle(fontSize: 12)),
                ),
                TextButton(
                  onPressed: () => _toggleSelectAll(false),
                  child: const Text('Deselect All', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 6),

            // Scrollable Dish List
            Expanded(
              child: ListView.separated(
                itemCount: _dishes.length,
                separatorBuilder: (_, __) => const SizedBox(height: 6),
                itemBuilder: (ctx, idx) {
                  final dish = _dishes[idx];
                  final isVeg = dish.foodType == 'veg';
                  final isNonVeg = dish.foodType == 'non_veg';

                  return Container(
                    decoration: BoxDecoration(
                      color: dish.isSelected ? ShadcnColors.card : ShadcnColors.background.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: dish.isSelected ? ShadcnColors.border : ShadcnColors.border.withOpacity(0.5),
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    child: Row(
                      children: [
                        Checkbox(
                          value: dish.isSelected,
                          activeColor: ShadcnColors.primary,
                          onChanged: (val) {
                            setState(() => dish.isSelected = val ?? false);
                          },
                        ),
                        // Dietary Badge
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: isVeg
                                  ? const Color(0xFF16A34A)
                                  : (isNonVeg ? const Color(0xFFDC2626) : const Color(0xFFD97706)),
                              width: 1.5,
                            ),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Icon(
                            isVeg ? Icons.circle : (isNonVeg ? Icons.change_history : Icons.egg),
                            size: 10,
                            color: isVeg
                                ? const Color(0xFF16A34A)
                                : (isNonVeg ? const Color(0xFFDC2626) : const Color(0xFFD97706)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        // Dish Name & Category
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                dish.name,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: dish.isSelected ? Colors.black87 : Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: ShadcnColors.secondary,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  dish.category,
                                  style: TextStyle(fontSize: 10, color: ShadcnColors.mutedForeground),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Price
                        Text(
                          '₹${dish.price.toStringAsFixed(0)}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: dish.isSelected ? ShadcnColors.primary : Colors.grey,
                          ),
                        ),
                        const SizedBox(width: 6),
                        // Edit & Delete icons
                        IconButton(
                          icon: const Icon(Icons.edit_outlined, size: 18),
                          tooltip: 'Edit details',
                          onPressed: () => _openEditDishSheet(idx),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 18, color: ShadcnColors.destructive),
                          tooltip: 'Discard',
                          onPressed: () {
                            setState(() => _dishes.removeAt(idx));
                          },
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),

            // Bottom Actions
            Row(
              children: [
                Expanded(
                  child: ShadcnButton(
                    text: 'Rescan Photo',
                    variant: ShadcnButtonVariant.outline,
                    onPressed: () => setState(() => _step = 0),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: ShadcnButton(
                    text: _isImporting
                        ? 'Importing...'
                        : 'Import ${_dishes.where((d) => d.isSelected).length} Dishes',
                    leadingIcon: const Icon(Icons.auto_awesome, size: 16),
                    isLoading: _isImporting,
                    onPressed: _isImporting ? null : _handleImportDishes,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
