import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/product.dart';
import '../../../core/providers/catalog_provider.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/sync_provider.dart';
import '../../../core/widgets/camera_barcode_scanner_modal.dart';
import '../../../core/widgets/product_photo_picker.dart';

class AddEditProductDialog extends ConsumerStatefulWidget {
  final Product? product;

  const AddEditProductDialog({super.key, this.product});

  @override
  ConsumerState<AddEditProductDialog> createState() => _AddEditProductDialogState();
}

class _AddEditProductDialogState extends ConsumerState<AddEditProductDialog> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _skuController;
  late TextEditingController _barcodeController;
  late TextEditingController _sellingPriceController;
  late TextEditingController _purchaseCostController;
  late TextEditingController _hsnController;
  late TextEditingController _initialStockController;

  late String _selectedCategory;
  late String _selectedUnit;
  late double _selectedGstRate;
  String? _selectedImageUrl;
  bool _isSaving = false;

  final List<String> _categories = [
    'Groceries',
    'Dairy',
    'Snacks',
    'Beverages',
    'Bakery',
    'Household',
    'Personal Care',
    'Restaurant / Food',
    'Other',
  ];

  final List<String> _units = ['PCS', 'PKT', 'KG', 'LTR', 'GM', 'ML', 'BOX'];
  final List<double> _gstRates = [0.0, 5.0, 12.0, 18.0, 28.0];

  @override
  void initState() {
    super.initState();
    final p = widget.product;
    _nameController = TextEditingController(text: p?.name ?? '');
    _skuController = TextEditingController(text: p?.sku ?? '');
    _barcodeController = TextEditingController(text: p?.barcode ?? '');
    _sellingPriceController = TextEditingController(
      text: p != null ? (p.sellingPricePaisa / 100.0).toStringAsFixed(2) : '',
    );
    _purchaseCostController = TextEditingController(
      text: p != null ? (p.purchaseCostPaisa / 100.0).toStringAsFixed(2) : '',
    );
    _hsnController = TextEditingController(text: p?.hsnCode ?? '');
    _initialStockController = TextEditingController(
      text: p != null ? p.currentStock.toStringAsFixed(0) : '10',
    );

    _selectedCategory = p?.category ?? 'Groceries';
    if (!_categories.contains(_selectedCategory)) {
      _categories.insert(0, _selectedCategory);
    }
    _selectedUnit = p?.unit ?? 'PCS';
    _selectedGstRate = p != null ? p.gstRate.toDouble() : 5.0;
    _selectedImageUrl = p?.imageUrl;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _skuController.dispose();
    _barcodeController.dispose();
    _sellingPriceController.dispose();
    _purchaseCostController.dispose();
    _hsnController.dispose();
    _initialStockController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    final authState = ref.read(authProvider);
    final tenantId = authState.activeMembership?.tenantId ?? 'tenant-1';

    final sellingPricePaisa = ((double.tryParse(_sellingPriceController.text.trim()) ?? 0.0) * 100).round();
    final purchaseCostPaisa = ((double.tryParse(_purchaseCostController.text.trim()) ?? 0.0) * 100).round();
    final initialStock = double.tryParse(_initialStockController.text.trim()) ?? 0.0;

    try {
      if (widget.product == null) {
        // Create new item
        var sku = _skuController.text.trim();
        if (sku.isEmpty) {
          sku = 'ITEM-${DateTime.now().millisecondsSinceEpoch % 100000}';
        }

        await ref.read(catalogProvider.notifier).addProduct(
              name: _nameController.text.trim(),
              sku: sku,
              barcode: _barcodeController.text.trim().isEmpty ? null : _barcodeController.text.trim(),
              category: _selectedCategory,
              sellingPricePaisa: sellingPricePaisa,
              purchaseCostPaisa: purchaseCostPaisa,
              gstRate: _selectedGstRate,
              hsnCode: _hsnController.text.trim().isEmpty ? null : _hsnController.text.trim(),
              unit: _selectedUnit,
              initialStock: initialStock,
              imageUrl: _selectedImageUrl,
              tenantId: tenantId,
            );
      } else {
        // Update existing item
        final updated = Product(
          id: widget.product!.id,
          name: _nameController.text.trim(),
          sku: _skuController.text.trim(),
          barcode: _barcodeController.text.trim().isEmpty ? null : _barcodeController.text.trim(),
          category: _selectedCategory,
          unit: _selectedUnit,
          sellingPricePaisa: sellingPricePaisa,
          purchaseCostPaisa: purchaseCostPaisa,
          gstRate: _selectedGstRate.round(),
          currentStock: widget.product!.currentStock,
          hsnCode: _hsnController.text.trim().isEmpty ? null : _hsnController.text.trim(),
          imageUrl: _selectedImageUrl,
        );
        await ref.read(catalogProvider.notifier).updateProduct(updated);
      }

      // Automatically sync to backend in background
      ref.read(syncStateProvider.notifier).syncNow();

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.product == null
                  ? 'Item "${_nameController.text.trim()}" added to inventory!'
                  : 'Item updated successfully!',
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving item: $e'),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.product != null;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480, maxHeight: 680),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            isEdit ? Icons.edit : Icons.add_box,
                            color: const Color(0xFF10B981),
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          isEdit ? 'Edit Product' : 'Add New Item',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                      tooltip: 'Close',
                    ),
                  ],
                ),
                const Divider(height: 20),
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Product Photo Attachment
                        ProductPhotoPicker(
                          initialImageUrl: _selectedImageUrl,
                          onPhotoChanged: (url) {
                            setState(() => _selectedImageUrl = url);
                          },
                        ),
                        const SizedBox(height: 14),

                        // Product Name
                        TextFormField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            labelText: 'Product / Item Name *',
                            hintText: 'e.g. Aashirvaad Atta 5kg',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.shopping_bag_outlined),
                          ),
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'Product name is required' : null,
                        ),
                        const SizedBox(height: 12),

                        // SKU & Barcode Row
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: _skuController,
                                decoration: const InputDecoration(
                                  labelText: 'SKU / Code',
                                  hintText: 'e.g. GROC-001',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextFormField(
                                controller: _barcodeController,
                                decoration: InputDecoration(
                                  labelText: 'Barcode',
                                  hintText: '8901...',
                                  border: const OutlineInputBorder(),
                                  prefixIcon: const Icon(Icons.qr_code_scanner),
                                  suffixIcon: IconButton(
                                    key: const Key('scan_item_barcode_btn'),
                                    icon: const Icon(Icons.camera_alt_outlined, color: Color(0xFF10B981), size: 20),
                                    tooltip: 'Scan Barcode with Camera',
                                    onPressed: () async {
                                      final scanned = await CameraBarcodeScannerModal.show(context);
                                      if (scanned != null && scanned.isNotEmpty) {
                                        setState(() {
                                          _barcodeController.text = scanned;
                                          if (_skuController.text.trim().isEmpty) {
                                            _skuController.text = scanned;
                                          }
                                        });
                                      }
                                    },
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Category & Unit Row
                        Row(
                          children: [
                            Expanded(
                              flex: 2,
                              child: DropdownButtonFormField<String>(
                                value: _selectedCategory,
                                decoration: const InputDecoration(
                                  labelText: 'Category *',
                                  border: OutlineInputBorder(),
                                ),
                                items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 13)))).toList(),
                                onChanged: (v) {
                                  if (v != null) setState(() => _selectedCategory = v);
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 1,
                              child: DropdownButtonFormField<String>(
                                value: _selectedUnit,
                                decoration: const InputDecoration(
                                  labelText: 'Unit',
                                  border: OutlineInputBorder(),
                                ),
                                items: _units.map((u) => DropdownMenuItem(value: u, child: Text(u, style: const TextStyle(fontSize: 13)))).toList(),
                                onChanged: (v) {
                                  if (v != null) setState(() => _selectedUnit = v);
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Pricing Row: Selling Price & Cost Price
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: _sellingPriceController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                decoration: const InputDecoration(
                                  labelText: 'Selling Price (₹) *',
                                  hintText: '0.00',
                                  prefixText: '₹ ',
                                  border: OutlineInputBorder(),
                                ),
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) return 'Required';
                                  final n = double.tryParse(v.trim());
                                  if (n == null || n < 0) return 'Invalid';
                                  return null;
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextFormField(
                                controller: _purchaseCostController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                decoration: const InputDecoration(
                                  labelText: 'Cost Price (₹)',
                                  hintText: '0.00',
                                  prefixText: '₹ ',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // GST Rate & HSN Code Row
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<double>(
                                value: _selectedGstRate,
                                decoration: const InputDecoration(
                                  labelText: 'GST Tax Rate',
                                  border: OutlineInputBorder(),
                                ),
                                items: _gstRates.map((r) => DropdownMenuItem(value: r, child: Text('$r% GST', style: const TextStyle(fontSize: 13)))).toList(),
                                onChanged: (v) {
                                  if (v != null) setState(() => _selectedGstRate = v);
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextFormField(
                                controller: _hsnController,
                                decoration: const InputDecoration(
                                  labelText: 'HSN Code',
                                  hintText: 'e.g. 11010000',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Initial Stock (only for new item)
                        if (!isEdit)
                          TextFormField(
                            controller: _initialStockController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(
                              labelText: 'Initial Opening Stock Quantity',
                              hintText: 'e.g. 50',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.inventory_2_outlined),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      key: const Key('save_product_btn'),
                      onPressed: _isSaving ? null : _handleSave,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(isEdit ? 'Save Changes' : 'Add Item to Catalog'),
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
}

