import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/database/app_database.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/printer_provider.dart';
import '../../core/providers/sync_provider.dart';
import '../../core/services/offline_billing_service.dart';
import '../../core/theme/shadcn_colors.dart';
import '../../core/theme/shadcn_typography.dart';
import '../../core/widgets/shadcn_card.dart';
import '../../core/widgets/shadcn_badge.dart';
import '../../core/widgets/shadcn_button.dart';
import '../../core/widgets/shadcn_input.dart';
import '../../core/widgets/shadcn_sheet.dart';
import '../../core/widgets/shadcn_empty_state.dart';

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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _loadInvoices(triggerSync: true);
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInvoices({bool triggerSync = false}) async {
    setState(() => _isLoading = true);
    final authState = ref.read(authProvider);
    final tenantId = authState.activeMembership?.tenantId;

    if (triggerSync) {
      try {
        await ref.read(syncStateProvider.notifier).syncNow();
      } catch (_) {}
    }

    final invs = await OfflineBillingService.getAllInvoices(tenantId);
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

      // Query
      if (query.isNotEmpty) {
        final matchesNumber = inv.invoiceNumber.toLowerCase().contains(query);
        final matchesCustomer = inv.customerName?.toLowerCase().contains(query) ?? false;
        return matchesNumber || matchesCustomer;
      }

      return true;
    }).toList();
  }

  void _showInvoiceDetailsSheet(LocalInvoice inv) async {
    final lines = await OfflineBillingService.getInvoiceLines(inv.id);
    if (!mounted) return;

    final dateStr = DateFormat('dd MMM yyyy, hh:mm a').format(inv.createdAt);

    ShadcnSheet.show(
      context: context,
      title: inv.invoiceNumber,
      description: '$dateStr • ${inv.customerName ?? "Walk-in Customer"}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Payment Tender', style: ShadcnTypography.caption),
              ShadcnBadge(
                text: inv.paymentMethod.toUpperCase(),
                variant: ShadcnBadgeVariant.success,
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: ShadcnColors.border),
          const SizedBox(height: 12),

          const Text('Billed Items', style: ShadcnTypography.bodySemibold),
          const SizedBox(height: 8),

          ...lines.map((l) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(l.productName, style: ShadcnTypography.bodyMedium),
                        Text(
                          '${l.quantity.toInt()} x ₹${(l.unitPricePaisa / 100).toStringAsFixed(2)}',
                          style: ShadcnTypography.caption,
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '₹${(l.totalPaisa / 100).toStringAsFixed(2)}',
                    style: ShadcnTypography.bodySemibold,
                  ),
                ],
              ),
            );
          }),

          const SizedBox(height: 12),
          const Divider(height: 1, color: ShadcnColors.border),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Subtotal:', style: ShadcnTypography.caption),
              Text('₹${(inv.subtotalPaisa / 100).toStringAsFixed(2)}', style: ShadcnTypography.bodyMedium),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total GST:', style: ShadcnTypography.caption),
              Text('₹${(inv.taxPaisa / 100).toStringAsFixed(2)}', style: ShadcnTypography.bodyMedium),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Grand Total:', style: ShadcnTypography.bodySemibold),
              Text(
                '₹${(inv.grandTotalPaisa / 100).toStringAsFixed(2)}',
                style: ShadcnTypography.currency.copyWith(color: ShadcnColors.primary),
              ),
            ],
          ),

          const SizedBox(height: 24),

          ShadcnButton(
            key: Key('reprint_receipt_modal_${inv.invoiceNumber}'),
            text: 'Reprint Thermal Receipt [DUPLICATE]',
            size: ShadcnButtonSize.lg,
            variant: ShadcnButtonVariant.primary,
            leadingIcon: const Icon(Icons.print_outlined, size: 18),
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
                    backgroundColor: ShadcnColors.success,
                  ),
                );
                Navigator.pop(context);
              } else {
                messenger.showSnackBar(
                  SnackBar(
                    content: Text('Reprint error: ${res.errorMessage ?? "Check printer"}'),
                    backgroundColor: ShadcnColors.destructive,
                  ),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final list = _filteredInvoices;

    return Scaffold(
      backgroundColor: ShadcnColors.background,
      appBar: AppBar(
        title: const Text('Orders & Bill History'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            tooltip: 'Reload Invoices',
            onPressed: () {
              HapticFeedback.selectionClick();
              _loadInvoices(triggerSync: true);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
            child: ShadcnInput(
              controller: _searchController,
              placeholder: 'Search by bill number or customer...',
              prefixIcon: const Icon(Icons.search, size: 18, color: ShadcnColors.mutedForeground),
              showClearButton: true,
              onChanged: (_) => setState(() {}),
            ),
          ),

          // Filter Pills
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: ['All', 'Today', 'Cash', 'UPI', 'Khata'].map((f) {
                final isSelected = _selectedFilter == f;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: InkWell(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _selectedFilter = f);
                    },
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: isSelected ? ShadcnColors.foreground : ShadcnColors.surface,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: isSelected ? ShadcnColors.foreground : ShadcnColors.border,
                          width: 1.0,
                        ),
                      ),
                      child: Text(
                        f,
                        style: ShadcnTypography.caption.copyWith(
                          color: isSelected ? Colors.white : ShadcnColors.foreground,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                        ),
                      ),
                    ),
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
                    ? const ShadcnEmptyState(
                        icon: Icons.receipt_long_outlined,
                        title: 'No Bills Found',
                        description: 'Sales completed at the POS terminal will be recorded here.',
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
                        itemCount: list.length,
                        itemBuilder: (ctx, idx) {
                          final inv = list[idx];
                          final dateStr = DateFormat('dd MMM, hh:mm a').format(inv.createdAt);

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: ShadcnCard(
                              padding: const EdgeInsets.all(12),
                              onTap: () => _showInvoiceDetailsSheet(inv),
                              child: Row(
                                children: [
                                  // Leading receipt icon box
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: ShadcnColors.secondary,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: ShadcnColors.border),
                                    ),
                                    alignment: Alignment.center,
                                    child: const Icon(
                                      Icons.receipt_outlined,
                                      size: 20,
                                      color: ShadcnColors.foreground,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(inv.invoiceNumber, style: ShadcnTypography.bodySemibold),
                                        const SizedBox(height: 2),
                                        Text(
                                          '$dateStr • ${inv.customerName ?? "Walk-in"}',
                                          style: ShadcnTypography.caption,
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '₹${(inv.grandTotalPaisa / 100).toStringAsFixed(2)}',
                                        style: ShadcnTypography.currency.copyWith(
                                          fontSize: 15,
                                          color: ShadcnColors.foreground,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      ShadcnBadge(
                                        text: inv.paymentMethod.toUpperCase(),
                                        variant: inv.paymentMethod.toLowerCase() == 'cash'
                                            ? ShadcnBadgeVariant.secondary
                                            : ShadcnBadgeVariant.success,
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
    );
  }
}
