import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/database/app_database.dart';
import '../../core/providers/printer_provider.dart';
import '../../core/services/offline_billing_service.dart';

class OrderHistoryScreen extends ConsumerStatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  ConsumerState<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends ConsumerState<OrderHistoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedFilter = 'All'; // 'All', 'Today', 'Cash', 'UPI', 'Khata'
  List<LocalInvoice> _invoices = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInvoices() async {
    setState(() => _isLoading = true);
    final invs = await OfflineBillingService.getAllInvoices();
    if (mounted) {
      setState(() {
        _invoices = invs;
        _isLoading = false;
      });
    }
  }

  List<LocalInvoice> get _filteredInvoices {
    final query = _searchController.text.toLowerCase().trim();
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);

    return _invoices.where((inv) {
      // Filter tab
      if (_selectedFilter == 'Today') {
        if (inv.createdAt.isBefore(todayStart)) return false;
      } else if (_selectedFilter == 'Cash') {
        if (inv.paymentMethod.toLowerCase() != 'cash') return false;
      } else if (_selectedFilter == 'UPI') {
        if (inv.paymentMethod.toLowerCase() != 'upi' && inv.paymentMethod.toLowerCase() != 'card') return false;
      } else if (_selectedFilter == 'Khata') {
        if (inv.paymentMethod.toLowerCase() != 'khata') return false;
      }

      // Search query
      if (query.isNotEmpty) {
        final matchNum = inv.invoiceNumber.toLowerCase().contains(query);
        final matchCust = (inv.customerName ?? '').toLowerCase().contains(query);
        if (!matchNum && !matchCust) return false;
      }

      return true;
    }).toList();
  }

  Color _getPaymentColor(String method) {
    switch (method.toLowerCase()) {
      case 'cash':
        return const Color(0xFF10B981); // Emerald
      case 'upi':
      case 'card':
        return const Color(0xFF0284C7); // Sky Blue
      case 'khata':
        return const Color(0xFF8B5CF6); // Purple
      default:
        return const Color(0xFF64748B); // Slate
    }
  }

  Future<void> _showInvoiceDetails(LocalInvoice inv) async {
    final lines = await OfflineBillingService.getInvoiceLines(inv.id);

    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        final dateStr = DateFormat('dd MMM yyyy, hh:mm a').format(inv.createdAt);
        final payColor = _getPaymentColor(inv.paymentMethod);

        return Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(inv.invoiceNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                        const SizedBox(height: 2),
                        Text(dateStr, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const Divider(height: 20),

                // Customer / Tender info chip
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: payColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        inv.paymentMethod.toUpperCase(),
                        style: TextStyle(color: payColor, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (inv.customerName != null && inv.customerName!.isNotEmpty)
                      Expanded(
                        child: Text(
                          'Customer: ${inv.customerName}',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 14),

                const Text('Items Breakdown', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey)),
                const SizedBox(height: 6),

                // Lines list
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: lines.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (c, i) {
                      final line = lines[i];
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 5,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(line.productName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  Text('Rate: ₹${(line.unitPricePaisa / 100).toStringAsFixed(1)} | GST: ${line.gstRatePercent.round()}%',
                                      style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                ],
                              ),
                            ),
                            Expanded(
                              flex: 2,
                              child: Text('x ${line.quantity.toStringAsFixed(0)}',
                                  textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            ),
                            Expanded(
                              flex: 3,
                              child: Text('₹${(line.totalPaisa / 100).toStringAsFixed(2)}',
                                  textAlign: TextAlign.right,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const Divider(height: 20),

                // Subtotal & Grand Total
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Subtotal:', style: TextStyle(fontSize: 13, color: Colors.grey)),
                    Text('₹${(inv.subtotalPaisa / 100).toStringAsFixed(2)}', style: const TextStyle(fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total GST:', style: TextStyle(fontSize: 13, color: Colors.grey)),
                    Text('₹${(inv.taxPaisa / 100).toStringAsFixed(2)}', style: const TextStyle(fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Grand Total:', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    Text('₹${(inv.grandTotalPaisa / 100).toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                  ],
                ),
                const SizedBox(height: 20),

                // Reprint Thermal Receipt Button
                ElevatedButton.icon(
                  key: Key('reprint_receipt_modal_${inv.invoiceNumber}'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    final doc = await OfflineBillingService.getReceiptDocument(inv.id);
                    if (doc == null) return;
                    final res = await ref.read(printerProvider.notifier).reprintReceipt(doc);
                    if (!mounted) return;
                    if (res.success) {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('Duplicate receipt printed for ${inv.invoiceNumber}!'),
                          backgroundColor: Colors.green,
                        ),
                      );
                      Navigator.pop(ctx);
                    } else {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('Reprint error: ${res.errorMessage ?? "Check printer"}'),
                          backgroundColor: Colors.red.shade700,
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.print, size: 18),
                  label: const Text('Reprint Thermal Receipt [DUPLICATE]', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final list = _filteredInvoices;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.receipt_long, color: Color(0xFF10B981), size: 22),
            SizedBox(width: 8),
            Text('Orders & Bill History', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Reload Invoices',
            onPressed: _loadInvoices,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: 'Search by bill number or customer...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
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
              ),
            ),
          ),

          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: ['All', 'Today', 'Cash', 'UPI', 'Khata'].map((f) {
                final isSelected = _selectedFilter == f;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(f, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : Colors.black87)),
                    selected: isSelected,
                    selectedColor: const Color(0xFF10B981),
                    backgroundColor: Colors.white,
                    side: BorderSide(color: isSelected ? const Color(0xFF10B981) : Colors.grey.shade300),
                    onSelected: (_) => setState(() => _selectedFilter = f),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 6),

          // List of Invoices
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : list.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_outlined, size: 54, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text(
                              'No invoices found',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
                            ),
                            const SizedBox(height: 4),
                            const Text('Sales generated from POS will appear here.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                        itemCount: list.length,
                        itemBuilder: (ctx, idx) {
                          final inv = list[idx];
                          final dateStr = DateFormat('dd MMM, hh:mm a').format(inv.createdAt);
                          final payColor = _getPaymentColor(inv.paymentMethod);

                          return Card(
                            elevation: 0.5,
                            margin: const EdgeInsets.only(bottom: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                              side: BorderSide(color: Colors.grey.shade200),
                            ),
                            child: InkWell(
                              onTap: () => _showInvoiceDetails(inv),
                              borderRadius: BorderRadius.circular(10),
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: payColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Icon(Icons.receipt_long, color: payColor, size: 22),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(inv.invoiceNumber,
                                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                              const SizedBox(width: 6),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                                decoration: BoxDecoration(
                                                  color: payColor.withOpacity(0.12),
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                                child: Text(
                                                  inv.paymentMethod.toUpperCase(),
                                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: payColor),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            inv.customerName != null && inv.customerName!.isNotEmpty
                                                ? '$dateStr • ${inv.customerName}'
                                                : dateStr,
                                            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          '₹${(inv.grandTotalPaisa / 100).toStringAsFixed(2)}',
                                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                        ),
                                        const SizedBox(height: 2),
                                        const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text('Details', style: TextStyle(fontSize: 11, color: Color(0xFF10B981))),
                                            Icon(Icons.chevron_right, size: 14, color: Color(0xFF10B981)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
