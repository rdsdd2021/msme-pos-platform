import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models/customer.dart';
import '../../core/providers/customer_provider.dart';
import '../../core/theme/shadcn_colors.dart';
import '../../core/theme/shadcn_typography.dart';
import '../../core/widgets/shadcn_card.dart';
import '../../core/widgets/shadcn_badge.dart';
import '../../core/widgets/shadcn_button.dart';
import '../../core/widgets/shadcn_input.dart';
import '../../core/widgets/shadcn_sheet.dart';
import '../../core/widgets/shadcn_empty_state.dart';

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
          backgroundColor: ShadcnColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: ShadcnColors.border),
          ),
          title: const Text('Add Khata Customer', style: ShadcnTypography.h3),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ShadcnInput(
                  controller: nameCtrl,
                  label: 'Customer Full Name *',
                  placeholder: 'e.g. Anil Kumar',
                ),
                const SizedBox(height: 12),
                ShadcnInput(
                  controller: phoneCtrl,
                  label: 'Mobile Phone *',
                  placeholder: '+91 9876543210',
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 12),
                ShadcnInput(
                  controller: limitCtrl,
                  label: 'Credit Limit (₹)',
                  placeholder: '5000',
                  keyboardType: TextInputType.number,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: ShadcnColors.mutedForeground)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: ShadcnColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              onPressed: () async {
                final name = nameCtrl.text.trim();
                final phone = phoneCtrl.text.trim();
                if (name.isEmpty || phone.isEmpty) return;

                final limit = (int.tryParse(limitCtrl.text.trim()) ?? 5000) * 100;
                await ref.read(customerProvider.notifier).addCustomer(
                      name: name,
                      phone: phone,
                      creditLimitPaisa: limit,
                    );
                if (ctx.mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Customer "$name" added to Khata!'),
                      backgroundColor: ShadcnColors.success,
                    ),
                  );
                }
              },
              child: const Text('Save Customer'),
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

    ShadcnSheet.show(
      context: context,
      title: 'Collect Khata Payment',
      description: 'Record repayment and deduct debt for ${customer.name}',
      child: StatefulBuilder(
        builder: (ctx, setSheetState) {
          final dueFormatted = '₹${(customer.currentBalancePaisa / 100.0).toStringAsFixed(2)}';

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: ShadcnColors.warningLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: ShadcnColors.warning.withOpacity(0.4)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(customer.name, style: ShadcnTypography.bodySemibold),
                        Text(customer.phone, style: ShadcnTypography.caption),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('Outstanding Debt', style: ShadcnTypography.caption),
                        Text(
                          dueFormatted,
                          style: ShadcnTypography.currency.copyWith(color: ShadcnColors.warningForeground),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),
              const Text('Repayment Amount', style: ShadcnTypography.bodySemibold),
              const SizedBox(height: 6),
              ShadcnInput(
                controller: amountCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                prefixIcon: const Icon(Icons.currency_rupee, size: 16),
              ),
              const SizedBox(height: 8),

              // Quick amount shortcuts
              Row(
                children: [100, 200, 500, 1000].map((amt) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: ActionChip(
                      label: Text('₹$amt', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                      backgroundColor: ShadcnColors.secondary,
                      side: const BorderSide(color: ShadcnColors.border),
                      onPressed: () => setSheetState(() => amountCtrl.text = '$amt'),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),
              const Text('Payment Tender', style: ShadcnTypography.bodySemibold),
              const SizedBox(height: 8),

              Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('Cash')),
                      selected: selectedMethod == 'cash',
                      selectedColor: ShadcnColors.primary,
                      labelStyle: TextStyle(
                        color: selectedMethod == 'cash' ? Colors.white : ShadcnColors.foreground,
                        fontWeight: FontWeight.w600,
                      ),
                      onSelected: (val) {
                        if (val) setSheetState(() => selectedMethod = 'cash');
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('UPI / Digital')),
                      selected: selectedMethod == 'upi',
                      selectedColor: ShadcnColors.primary,
                      labelStyle: TextStyle(
                        color: selectedMethod == 'upi' ? Colors.white : ShadcnColors.foreground,
                        fontWeight: FontWeight.w600,
                      ),
                      onSelected: (val) {
                        if (val) setSheetState(() => selectedMethod = 'upi');
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              ShadcnButton(
                text: 'RECORD REPAYMENT',
                size: ShadcnButtonSize.lg,
                variant: ShadcnButtonVariant.primary,
                isLoading: isProcessing,
                leadingIcon: const Icon(Icons.check_circle_outline, size: 18),
                onPressed: () async {
                  final entered = double.tryParse(amountCtrl.text.trim()) ?? 0;
                  if (entered <= 0) return;

                  setSheetState(() => isProcessing = true);
                  final amountPaisa = (entered * 100).toInt();

                  final remainingPaisa = await ref.read(customerProvider.notifier).recordRepayment(
                        customerId: customer.id,
                        amountPaisa: amountPaisa,
                        paymentMethod: selectedMethod,
                      );

                  if (context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Payment of ₹${entered.toStringAsFixed(2)} recorded! Remaining due: ₹${(remainingPaisa / 100.0).toStringAsFixed(2)}',
                        ),
                        backgroundColor: ShadcnColors.success,
                      ),
                    );
                  }
                },
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final customerState = ref.watch(customerProvider);
    final customers = customerState.filteredCustomers;

    final totalDuePaisa = customerState.allCustomers.fold<int>(0, (sum, c) => sum + c.currentBalancePaisa);
    final debtorsCount = customerState.allCustomers.where((c) => c.currentBalancePaisa > 0).length;

    return Scaffold(
      backgroundColor: ShadcnColors.background,
      appBar: AppBar(
        title: const Text('Customer Khata Book'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            tooltip: 'Refresh Khata',
            onPressed: () {
              HapticFeedback.selectionClick();
              ref.read(customerProvider.notifier).reload();
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Total Credit Due Card
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: ShadcnCard(
              padding: const EdgeInsets.all(14),
              backgroundColor: ShadcnColors.surface,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Market Credit Given', style: ShadcnTypography.caption),
                      const SizedBox(height: 4),
                      Text(
                        '₹${(totalDuePaisa / 100.0).toStringAsFixed(2)}',
                        style: ShadcnTypography.currencyLarge.copyWith(color: ShadcnColors.destructive),
                      ),
                    ],
                  ),
                  ShadcnBadge(
                    text: '$debtorsCount Debtors',
                    variant: debtorsCount > 0 ? ShadcnBadgeVariant.warning : ShadcnBadgeVariant.secondary,
                  ),
                ],
              ),
            ),
          ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: ShadcnInput(
              controller: _searchController,
              placeholder: 'Search customer by name or phone...',
              prefixIcon: const Icon(Icons.search, size: 18, color: ShadcnColors.mutedForeground),
              showClearButton: true,
              onChanged: (val) => ref.read(customerProvider.notifier).updateSearch(val),
            ),
          ),

          const SizedBox(height: 4),

          // Customers List
          Expanded(
            child: customers.isEmpty
                ? ShadcnEmptyState(
                    icon: Icons.menu_book_outlined,
                    title: 'No Customers in Khata',
                    description: 'Tap "+ Add Customer" below to start tracking customer credit.',
                    actionText: 'Add Customer',
                    onActionPressed: _showAddCustomerDialog,
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 6, 16, 80),
                    itemCount: customers.length,
                    itemBuilder: (ctx, idx) {
                      final c = customers[idx];
                      final isDue = c.currentBalancePaisa > 0;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: ShadcnCard(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              // Avatar initial
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: isDue ? ShadcnColors.warningLight : ShadcnColors.secondary,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isDue ? ShadcnColors.warning.withOpacity(0.3) : ShadcnColors.border,
                                  ),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  c.name.isNotEmpty ? c.name.substring(0, 1).toUpperCase() : 'C',
                                  style: ShadcnTypography.bodySemibold.copyWith(
                                    color: isDue ? ShadcnColors.warningForeground : ShadcnColors.foreground,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(c.name, style: ShadcnTypography.bodySemibold),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${c.phone} • Limit: ₹${(c.creditLimitPaisa / 100).toStringAsFixed(0)}',
                                      style: ShadcnTypography.caption,
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '₹${(c.currentBalancePaisa / 100.0).toStringAsFixed(2)}',
                                    style: ShadcnTypography.currency.copyWith(
                                      fontSize: 15,
                                      color: isDue ? ShadcnColors.destructive : ShadcnColors.success,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  if (isDue)
                                    ShadcnButton(
                                      text: 'Collect',
                                      size: ShadcnButtonSize.sm,
                                      variant: ShadcnButtonVariant.outline,
                                      onPressed: () => _showCollectRepaymentSheet(c),
                                    )
                                  else
                                    const ShadcnBadge(
                                      text: 'Clear',
                                      variant: ShadcnBadgeVariant.success,
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
        backgroundColor: ShadcnColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add_outlined, size: 20),
        label: const Text('Add Customer', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        elevation: 2,
      ),
    );
  }
}
