import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/product.dart';
import '../../../core/providers/catalog_provider.dart';
import '../../../core/providers/sync_provider.dart';

class StockAdjustmentDialog extends ConsumerStatefulWidget {
  final Product product;

  const StockAdjustmentDialog({super.key, required this.product});

  @override
  ConsumerState<StockAdjustmentDialog> createState() => _StockAdjustmentDialogState();
}

class _StockAdjustmentDialogState extends ConsumerState<StockAdjustmentDialog> {
  final _formKey = GlobalKey<FormState>();
  final _quantityController = TextEditingController(text: '10');
  final _reasonController = TextEditingController(text: 'Supplier Restock');

  String _adjustmentType = 'add'; // 'add' or 'subtract'
  bool _isSaving = false;

  final List<String> _commonReasons = [
    'Supplier Restock',
    'Customer Return to Stock',
    'Damaged / Broken in Store',
    'Expired Product Write-off',
    'Inventory Count Audit Correction',
    'Theft / Missing Units',
  ];

  @override
  void dispose() {
    _quantityController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final qty = double.tryParse(_quantityController.text.trim()) ?? 0.0;
    if (qty <= 0) return;

    final delta = _adjustmentType == 'add' ? qty : -qty;

    setState(() => _isSaving = true);
    try {
      await ref.read(catalogProvider.notifier).adjustStock(
            productId: widget.product.id,
            delta: delta,
            reason: _reasonController.text.trim(),
          );

      // Auto push to server
      ref.read(syncStateProvider.notifier).syncNow();

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Stock adjusted by ${delta > 0 ? "+$delta" : "$delta"} ${widget.product.unit}!',
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to adjust stock: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final qtyEntered = double.tryParse(_quantityController.text.trim()) ?? 0.0;
    final delta = _adjustmentType == 'add' ? qtyEntered : -qtyEntered;
    final projectedStock = (p.currentStock + delta).clamp(0.0, double.infinity);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
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
                            color: Colors.blue.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.sync_alt, color: Colors.blue, size: 20),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'Stock Adjustment',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const Divider(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Current On-Hand: ${p.currentStock.toStringAsFixed(1)} ${p.unit}',
                              style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          Text('SKU: ${p.sku}',
                              style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Adjustment Type (Add or Subtract)
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(
                      value: 'add',
                      label: Text('Restock (+ Stock)'),
                      icon: Icon(Icons.add, color: Colors.green),
                    ),
                    ButtonSegment(
                      value: 'subtract',
                      label: Text('Deduct (- Stock)'),
                      icon: Icon(Icons.remove, color: Colors.red),
                    ),
                  ],
                  selected: {_adjustmentType},
                  onSelectionChanged: (set) {
                    setState(() {
                      _adjustmentType = set.first;
                    });
                  },
                ),
                const SizedBox(height: 16),

                // Quantity Input
                TextFormField(
                  controller: _quantityController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: 'Units to ${_adjustmentType == "add" ? "Add" : "Deduct"} (${p.unit}) *',
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.numbers),
                  ),
                  onChanged: (_) => setState(() {}),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Quantity is required';
                    final n = double.tryParse(v.trim());
                    if (n == null || n <= 0) return 'Must be greater than 0';
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                // Reason Selector
                DropdownButtonFormField<String>(
                  value: _commonReasons.contains(_reasonController.text) ? _reasonController.text : _commonReasons.first,
                  decoration: const InputDecoration(
                    labelText: 'Audit Reason *',
                    border: OutlineInputBorder(),
                  ),
                  items: _commonReasons.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 13)))).toList(),
                  onChanged: (v) {
                    if (v != null) {
                      setState(() => _reasonController.text = v);
                    }
                  },
                ),
                const SizedBox(height: 14),

                // Projected New Stock preview
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Projected Stock Balance:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                      Text(
                        '${projectedStock.toStringAsFixed(1)} ${p.unit}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      key: const Key('confirm_stock_adj_btn'),
                      onPressed: _isSaving ? null : _handleSave,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: _isSaving
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Save Stock Movement'),
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

