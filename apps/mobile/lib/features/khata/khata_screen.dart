import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models/customer.dart';
import '../../core/models/receipt_document.dart';
import '../../core/providers/customer_provider.dart';
import '../../core/providers/printer_provider.dart';
import '../../core/providers/sync_provider.dart';

class MobileKhataScreen extends ConsumerStatefulWidget {
  const MobileKhataScreen({super.key});

  @override
  ConsumerState<MobileKhataScreen> createState() => _MobileKhataScreenState();
}

class _MobileKhataScreenState extends ConsumerState<MobileKhataScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showAddCustomerDialog() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final limitCtrl = TextEditingController(text: '5000');
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.person_add, color: Color(0xFF10B981)),
              SizedBox(width: 8),
              Text('Add Khata Customer'),
            ],
          ),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Customer Name *', border: OutlineInputBorder()),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Phone Number *', border: OutlineInputBorder()),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Phone is required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: limitCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Credit Limit (₹)',
                    prefixText: '₹ ',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                if (!formKey.currentState!.validate()) return;
                final limit = (int.tryParse(limitCtrl.text.trim()) ?? 5000) * 100;
                await ref.read(customerProvider.notifier).addCustomer(
                      name: nameCtrl.text.trim(),
                      phone: phoneCtrl.text.trim(),
                      creditLimitPaisa: limit,
                    );
                if (ctx.mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Customer "${nameCtrl.text.trim()}" added to Khata!'),
                      backgroundColor: const Color(0xFF10B981),
                    ),
                  );
                }
              },
              child: const Text('Add Customer'),
            ),
          ],
        );
      },
    );
  }

  void _showCollectRepaymentSheet(Customer customer) {
    final amountCtrl = TextEditingController(
      text: (customer.currentBalancePaisa / 100.0).toStringAsFixed(0),
    );
    String selectedMethod = 'cash';
    bool isProcessing = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final dueFormatted = '₹${(customer.currentBalancePaisa / 100.0).toStringAsFixed(2)}';

            return Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.payments, color: Color(0xFF10B981)),
                          const SizedBox(width: 8),
                          Text('Collect Khata Payment', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                  const Divider(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.amber.shade200),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(customer.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                            Text(customer.phone, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('Outstanding Due', style: TextStyle(fontSize: 11, color: Colors.grey)),
                            Text(dueFormatted,
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.amber.shade900)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Amount Input
                  TextFormField(
                    controller: amountCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Repayment Amount (₹) *',
                      prefixText: '₹ ',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Quick shortcut chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        ActionChip(
                          label: const Text('₹100'),
                          onPressed: () => setSheetState(() => amountCtrl.text = '100'),
                        ),
                        const SizedBox(width: 6),
                        ActionChip(
                          label: const Text('₹200'),
                          onPressed: () => setSheetState(() => amountCtrl.text = '200'),
                        ),
                        const SizedBox(width: 6),
                        ActionChip(
                          label: const Text('₹500'),
                          onPressed: () => setSheetState(() => amountCtrl.text = '500'),
                        ),
                        const SizedBox(width: 6),
                        ActionChip(
                          label: const Text('Full Due'),
                          onPressed: () => setSheetState(
                            () => amountCtrl.text = (customer.currentBalancePaisa / 100.0).toStringAsFixed(0),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Tender selection
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          avatar: const Icon(Icons.money, size: 16),
                          label: const Text('Cash'),
                          selected: selectedMethod == 'cash',
                          onSelected: (_) => setSheetState(() => selectedMethod = 'cash'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ChoiceChip(
                          avatar: const Icon(Icons.qr_code, size: 16),
                          label: const Text('UPI'),
                          selected: selectedMethod == 'upi',
                          onSelected: (_) => setSheetState(() => selectedMethod = 'upi'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Confirm button
                  ElevatedButton(
                    key: const Key('confirm_khata_payment_btn'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: isProcessing
                        ? null
                        : () async {
                            final val = double.tryParse(amountCtrl.text.trim()) ?? 0.0;
                            if (val <= 0) return;
                            final amountPaisa = (val * 100).round();

                            setSheetState(() => isProcessing = true);
                            try {
                              final remainingPaisa = await ref.read(customerProvider.notifier).recordRepayment(
                                    customerId: customer.id,
                                    amountPaisa: amountPaisa,
                                    paymentMethod: selectedMethod,
                                  );

                              await ref.read(syncStateProvider.notifier).refreshStatus();
                              ref.read(syncStateProvider.notifier).syncNow();

                              if (mounted) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Collected ₹${val.toStringAsFixed(2)} from ${customer.name}! Remaining Due: ₹${(remainingPaisa / 100.0).toStringAsFixed(2)}',
                                    ),
                                    backgroundColor: const Color(0xFF10B981),
                                  ),
                                );

                                // Print payment receipt voucher
                                final receiptDoc = ReceiptDocument(
                                  header: const ReceiptHeader(
                                    storeName: 'KHATA PAYMENT RECEIPT',
                                    address: 'Customer Repayment Voucher',
                                  ),
                                  meta: ReceiptInvoiceMeta(
                                    invoiceNumber: 'RCP-${DateTime.now().millisecondsSinceEpoch % 10000}',
                                    invoiceId: 'rcp-${customer.id}',
                                    date: DateTime.now(),
                                    paymentMethod: selectedMethod.toUpperCase(),
                                    customerName: customer.name,
                                  ),
                                  lines: [
                                    ReceiptLineItem(
                                      name: 'Khata Credit Repayment',
                                      quantity: 1,
                                      unitPricePaisa: amountPaisa,
                                      taxRatePercent: 0,
                                      taxPaisa: 0,
                                      totalPaisa: amountPaisa,
                                    ),
                                  ],
                                  taxSlabs: const [],
                                  totals: ReceiptTotals(
                                    subtotalPaisa: amountPaisa,
                                    cgstTotalPaisa: 0,
                                    sgstTotalPaisa: 0,
                                    grandTotalPaisa: amountPaisa,
                                  ),
                                );
                                ref.read(printerProvider.notifier).printReceipt(
                                      receiptDoc,
                                      openCashDrawer: selectedMethod == 'cash',
                                    );
                              }
                            } catch (e) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Error recording repayment: $e'), backgroundColor: Colors.red),
                                );
                              }
                            } finally {
                              if (ctx.mounted) setSheetState(() => isProcessing = false);
                            }
                          },
                    child: isProcessing
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Record Payment & Update Khata', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final custState = ref.watch(customerProvider);
    final customers = custState.filteredCustomers;

    final totalDuePaisa = custState.allCustomers.fold<int>(0, (sum, c) => sum + c.currentBalancePaisa);
    final debtorsCount = custState.allCustomers.where((c) => c.currentBalancePaisa > 0).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.menu_book, color: Color(0xFF10B981), size: 22),
            SizedBox(width: 8),
            Text('Customer Khata Notebook', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(customerProvider.notifier).reload(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Total Due Banner
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.2)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Market Credit Given', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 3),
                      Text(
                        '₹${(totalDuePaisa / 100.0).toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF6D28D9)),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Text(
                      '$debtorsCount Customers Pending',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF6D28D9)),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => ref.read(customerProvider.notifier).updateSearch(val),
              decoration: InputDecoration(
                hintText: 'Search customer by name or phone...',
                prefixIcon: const Icon(Icons.search, size: 20),
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

          // List of Customers
          Expanded(
            child: customers.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.people_outline, size: 54, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        const Text('No customers found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        const Text('Tap "+ Add Customer" below to add a debtor.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
                    itemCount: customers.length,
                    itemBuilder: (ctx, idx) {
                      final c = customers[idx];
                      final isDue = c.currentBalancePaisa > 0;

                      return Card(
                        elevation: 0.5,
                        margin: const EdgeInsets.only(bottom: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: BorderSide(color: Colors.grey.shade200),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 20,
                                backgroundColor: isDue ? Colors.amber.shade100 : Colors.green.shade100,
                                child: Text(
                                  c.name.isNotEmpty ? c.name.substring(0, 1).toUpperCase() : 'C',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isDue ? Colors.amber.shade900 : Colors.green.shade800,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(c.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${c.phone} • Limit: ₹${(c.creditLimitPaisa / 100).toStringAsFixed(0)}',
                                      style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '₹${(c.currentBalancePaisa / 100.0).toStringAsFixed(2)}',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: isDue ? Colors.red.shade700 : Colors.green.shade700,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  ElevatedButton(
                                    key: Key('collect_btn_${c.id}'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: isDue ? const Color(0xFF10B981) : Colors.grey.shade200,
                                      foregroundColor: isDue ? Colors.white : Colors.black87,
                                      visualDensity: VisualDensity.compact,
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    ),
                                    onPressed: () => _showCollectRepaymentSheet(c),
                                    child: Text(isDue ? 'Collect' : 'Record', style: const TextStyle(fontSize: 11)),
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
        key: const Key('add_customer_fab'),
        onPressed: _showAddCustomerDialog,
        backgroundColor: const Color(0xFF10B981),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add),
        label: const Text('Add Customer', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }
}
