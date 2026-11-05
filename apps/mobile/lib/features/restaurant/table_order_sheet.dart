import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/app_config.dart';
import '../../../core/models/cart_item.dart';
import '../../../core/models/product.dart';
import '../../../core/models/receipt_document.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/catalog_provider.dart';
import '../../../core/providers/printer_provider.dart';
import '../../../core/providers/restaurant_provider.dart';
import '../../../core/providers/sync_provider.dart';
import '../../../core/services/offline_billing_service.dart';
import '../../../core/theme/shadcn_colors.dart';
import '../../../core/theme/shadcn_typography.dart';
import '../../../core/widgets/shadcn_badge.dart';
import '../../../core/widgets/shadcn_button.dart';
import '../../../core/widgets/shadcn_card.dart';
import '../../../core/widgets/shadcn_quantity_stepper.dart';

class TableOrderSheet extends ConsumerStatefulWidget {
  final RestaurantTable table;

  const TableOrderSheet({super.key, required this.table});

  @override
  ConsumerState<TableOrderSheet> createState() => _TableOrderSheetState();
}

class _TableOrderSheetState extends ConsumerState<TableOrderSheet> {
  final TextEditingController _menuSearchController = TextEditingController();
  String _selectedCategory = 'All';
  int _activeTab = 0; // 0 = Menu Catalog, 1 = Table Order

  @override
  void dispose() {
    _menuSearchController.dispose();
    super.dispose();
  }

  Future<void> _handlePrintKot(RestaurantTable currentTable) async {
    if (currentTable.activeOrderLines.isEmpty) return;

    HapticFeedback.mediumImpact();
    final notifier = ref.read(printerProvider.notifier);

    final kotDoc = ReceiptDocument(
      header: ReceiptHeader(
        storeName: '*** KITCHEN ORDER TICKET ***',
        address: 'Table: ${currentTable.name} (${currentTable.section})',
      ),
      meta: ReceiptInvoiceMeta(
        invoiceNumber: 'KOT-${DateTime.now().millisecondsSinceEpoch % 10000}',
        invoiceId: 'kot-${currentTable.id}',
        date: DateTime.now(),
        paymentMethod: 'KOT',
        customerName: '${currentTable.name} (${currentTable.currentGuestCount} guests)',
      ),
      lines: currentTable.activeOrderLines.map((i) {
        final lineDesc = i.notes != null && i.notes!.isNotEmpty
            ? '${i.product.name} [NOTE: ${i.notes}]'
            : i.product.name;
        return ReceiptLineItem(
          name: lineDesc,
          quantity: i.quantity,
          unit: i.product.unit,
          unitPricePaisa: i.product.sellingPricePaisa,
          taxRatePercent: 0,
          taxPaisa: 0,
          totalPaisa: i.totalPaisa,
        );
      }).toList(),
      taxSlabs: const [],
      totals: ReceiptTotals(
        subtotalPaisa: currentTable.runningTotalPaisa,
        cgstTotalPaisa: 0,
        sgstTotalPaisa: 0,
        grandTotalPaisa: currentTable.runningTotalPaisa,
      ),
    );

    final res = await notifier.printReceipt(kotDoc);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            res.success
                ? 'KOT printed successfully for ${currentTable.name}!'
                : 'KOT generated! Printer status: ${res.errorMessage ?? "Dispatched to Kitchen"}',
          ),
          backgroundColor: ShadcnColors.primary,
        ),
      );
    }
  }

  void _showInstructionDialog(RestaurantTable currentTable, CartItem line) {
    final noteController = TextEditingController(text: line.notes ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ShadcnColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Row(
          children: [
            const Icon(Icons.edit_note, color: ShadcnColors.primary, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Kitchen Note: ${line.product.name}',
                style: ShadcnTypography.bodySemibold,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Special cooking instructions for chefs:', style: ShadcnTypography.caption),
            const SizedBox(height: 8),
            TextField(
              controller: noteController,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'e.g. Less spicy, No garlic, Jain, Extra crisp...',
                filled: true,
                fillColor: ShadcnColors.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: ShadcnColors.border),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              children: ['Less Spicy', 'Extra Spicy', 'No Garlic/Onion', 'Jain', 'Parcel'].map((chip) {
                return ActionChip(
                  label: Text(chip, style: const TextStyle(fontSize: 11)),
                  onPressed: () {
                    final curr = noteController.text.trim();
                    noteController.text = curr.isEmpty ? chip : '$curr, $chip';
                  },
                );
              }).toList(),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: ShadcnColors.mutedForeground)),
          ),
          ShadcnButton(
            text: 'Save Instruction',
            size: ShadcnButtonSize.sm,
            onPressed: () {
              ref.read(restaurantProvider.notifier).updateLineNotes(
                    currentTable.id,
                    line.product.id,
                    noteController.text,
                  );
              Navigator.pop(ctx);
            },
          ),
        ],
      ),
    );
  }

  void _showTransferTableDialog(RestaurantTable currentTable) {
    final restState = ref.read(restaurantProvider);
    final availableTables = restState.tables
        .where((t) => t.id != currentTable.id && t.status == TableStatus.vacant)
        .toList();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ShadcnColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Row(
          children: [
            const Icon(Icons.swap_horiz, color: ShadcnColors.primary, size: 20),
            const SizedBox(width: 8),
            Text('Transfer ${currentTable.name}', style: ShadcnTypography.bodySemibold),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: availableTables.isEmpty
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Text('No other vacant tables available right now.'),
                )
              : ListView.separated(
                  shrinkWrap: true,
                  itemCount: availableTables.length,
                  separatorBuilder: (_, __) => const Divider(height: 1, color: ShadcnColors.border),
                  itemBuilder: (context, idx) {
                    final dest = availableTables[idx];
                    return ListTile(
                      dense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      title: Text(dest.name, style: ShadcnTypography.bodySemibold),
                      subtitle: Text('${dest.section} • ${dest.capacity} Seats', style: ShadcnTypography.caption),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                      onTap: () {
                        final success = ref.read(restaurantProvider.notifier).transferTable(
                              currentTable.id,
                              dest.id,
                            );
                        Navigator.pop(ctx);
                        if (success) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Transferred bill from ${currentTable.name} to ${dest.name}!'),
                              backgroundColor: ShadcnColors.primary,
                            ),
                          );
                        }
                      },
                    );
                  },
                ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: ShadcnColors.mutedForeground)),
          ),
        ],
      ),
    );
  }

  void _showSettlementModal(RestaurantTable currentTable) {
    String selectedMethod = 'cash';
    bool isSettling = false;
    bool isSplit = false;
    int splitCount = currentTable.currentGuestCount > 0 ? currentTable.currentGuestCount : 2;
    final tenderCashController = TextEditingController(
      text: (currentTable.runningTotalPaisa / 100).toStringAsFixed(0),
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final totalRupees = currentTable.runningTotalPaisa / 100;
            final totalFormatted = '₹${totalRupees.toStringAsFixed(2)}';
            final tenderedRupees = double.tryParse(tenderCashController.text) ?? totalRupees;
            final changeDue = (tenderedRupees - totalRupees).clamp(0.0, 99999.0);
            final perPersonFormatted = '₹${(totalRupees / splitCount).toStringAsFixed(2)}';

            return Container(
              padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 20),
              decoration: const BoxDecoration(
                color: ShadcnColors.surface,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.receipt_long, color: ShadcnColors.primary, size: 22),
                          const SizedBox(width: 8),
                          Text('Settle Bill: ${currentTable.name}', style: ShadcnTypography.h3),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const Divider(height: 16, color: ShadcnColors.border),

                  // Total Card
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: ShadcnColors.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: ShadcnColors.primary.withOpacity(0.2)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Grand Total Payable', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: ShadcnColors.foreground)),
                            Text('${currentTable.itemCount} items • GST Included', style: ShadcnTypography.caption),
                          ],
                        ),
                        Text(totalFormatted, style: ShadcnTypography.currencyLarge.copyWith(color: ShadcnColors.primary)),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Split Bill Toggle
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            backgroundColor: !isSplit ? ShadcnColors.secondary : Colors.transparent,
                            side: BorderSide(color: !isSplit ? ShadcnColors.primary : ShadcnColors.border),
                          ),
                          onPressed: () => setModalState(() => isSplit = false),
                          child: const Text('Single Payment', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            backgroundColor: isSplit ? ShadcnColors.secondary : Colors.transparent,
                            side: BorderSide(color: isSplit ? ShadcnColors.primary : ShadcnColors.border),
                          ),
                          onPressed: () => setModalState(() => isSplit = true),
                          child: const Text('Split Equal Bill', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        ),
                      ),
                    ],
                  ),

                  if (isSplit) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: ShadcnColors.background,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: ShadcnColors.border),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove_circle_outline, size: 20),
                                visualDensity: VisualDensity.compact,
                                onPressed: splitCount > 2 ? () => setModalState(() => splitCount--) : null,
                              ),
                              Text('$splitCount Diners', style: ShadcnTypography.bodySemibold),
                              IconButton(
                                icon: const Icon(Icons.add_circle_outline, size: 20, color: ShadcnColors.primary),
                                visualDensity: VisualDensity.compact,
                                onPressed: splitCount < 20 ? () => setModalState(() => splitCount++) : null,
                              ),
                            ],
                          ),
                          Text(
                            '$perPersonFormatted each',
                            style: ShadcnTypography.bodySemibold.copyWith(color: ShadcnColors.primary),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 12),
                  const Text('Payment Tender:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 8),

                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          avatar: const Icon(Icons.payments_outlined, size: 16),
                          label: const Text('Cash'),
                          selected: selectedMethod == 'cash',
                          selectedColor: ShadcnColors.primary.withOpacity(0.15),
                          onSelected: (_) => setModalState(() => selectedMethod = 'cash'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ChoiceChip(
                          avatar: const Icon(Icons.qr_code, size: 16),
                          label: const Text('UPI'),
                          selected: selectedMethod == 'upi',
                          selectedColor: ShadcnColors.primary.withOpacity(0.15),
                          onSelected: (_) => setModalState(() => selectedMethod = 'upi'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ChoiceChip(
                          avatar: const Icon(Icons.credit_card, size: 16),
                          label: const Text('Card'),
                          selected: selectedMethod == 'card',
                          selectedColor: ShadcnColors.primary.withOpacity(0.15),
                          onSelected: (_) => setModalState(() => selectedMethod = 'card'),
                        ),
                      ),
                    ],
                  ),

                  if (selectedMethod == 'cash' && !isSplit) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [100, 200, 500, 2000].map((amt) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ActionChip(
                            label: Text('₹$amt', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                            onPressed: () {
                              setModalState(() {
                                tenderCashController.text = amt.toString();
                              });
                            },
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: ShadcnColors.background,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: ShadcnColors.border),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Change Due to Guest:', style: TextStyle(fontSize: 12, color: ShadcnColors.mutedForeground)),
                          Text('₹${changeDue.toStringAsFixed(2)}', style: ShadcnTypography.bodySemibold.copyWith(color: ShadcnColors.primary)),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 16),

                  ShadcnButton(
                    key: const Key('confirm_table_settle_btn'),
                    text: isSettling ? 'Posting Bill...' : 'Confirm Settlement ($totalFormatted)',
                    isLoading: isSettling,
                    isFullWidth: true,
                    size: ShadcnButtonSize.lg,
                    onPressed: isSettling
                        ? null
                        : () async {
                            setModalState(() => isSettling = true);
                            final authState = ref.read(authProvider);
                            final tenantId = authState.activeMembership?.tenantId ?? 'tenant-1';
                            final branchId = authState.activeBranchId ?? 'branch-1';
                            final deviceId = await AppConfig.getDeviceId();

                            final result = await OfflineBillingService.processSale(
                              items: currentTable.activeOrderLines,
                              paymentMethod: selectedMethod,
                              customerName: '${currentTable.name} (Dine-In)',
                              tenantId: tenantId,
                              branchId: branchId,
                              deviceId: deviceId,
                            );

                            // Deduct stock for ingredients/items
                            for (final item in currentTable.activeOrderLines) {
                              await ref.read(catalogProvider.notifier).deductStock(item.product.id, item.quantity);
                            }

                            // Vacate table and mark dirty for clearing
                            ref.read(restaurantProvider.notifier).clearAndVacateTable(currentTable.id, markDirty: true);

                            // Refresh outbox
                            await ref.read(syncStateProvider.notifier).refreshStatus();

                            if (mounted) {
                              Navigator.pop(ctx);
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Bill settled successfully for ${currentTable.name} (${result.invoiceNumber})!'),
                                  backgroundColor: ShadcnColors.primary,
                                ),
                              );

                              // Auto-print receipt if available
                              if (result.receiptDocument != null) {
                                ref.read(printerProvider.notifier).printReceipt(
                                      result.receiptDocument!,
                                      openCashDrawer: selectedMethod == 'cash',
                                    );
                              }
                            }
                          },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildItemThumbnail(String? imageUrl) {
    if (imageUrl != null && imageUrl.startsWith('data:image/')) {
      try {
        final base64Str = imageUrl.split(',').last;
        final bytes = base64Decode(base64Str);
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.memory(
            bytes,
            width: 44,
            height: 44,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _buildFallbackThumbnail(),
          ),
        );
      } catch (_) {}
    }
    return _buildFallbackThumbnail();
  }

  Widget _buildFallbackThumbnail() {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: ShadcnColors.secondary,
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Icon(Icons.restaurant_menu, color: ShadcnColors.mutedForeground, size: 20),
    );
  }

  @override
  Widget build(BuildContext context) {
    final restState = ref.watch(restaurantProvider);
    final currentTable = restState.tables.firstWhere(
      (t) => t.id == widget.table.id,
      orElse: () => widget.table,
    );

    final catalogState = ref.watch(catalogProvider);
    final query = _menuSearchController.text.toLowerCase().trim();
    final filteredMenuItems = catalogState.allProducts.where((p) {
      final matchCat = _selectedCategory == 'All' || p.category == _selectedCategory;
      final matchQ = query.isEmpty || p.name.toLowerCase().contains(query);
      return matchCat && matchQ;
    }).toList();

    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth >= 600;

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: const BoxDecoration(
        color: ShadcnColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: ShadcnColors.primary.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.table_restaurant, color: ShadcnColors.primary, size: 22),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    currentTable.name,
                                    style: ShadcnTypography.h3,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                ShadcnBadge(
                                  text: '${currentTable.currentGuestCount} Diners',
                                  variant: ShadcnBadgeVariant.outline,
                                ),
                              ],
                            ),
                            Text(
                              '${currentTable.section} • Capacity: ${currentTable.capacity} seats',
                              style: ShadcnTypography.caption,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (currentTable.activeOrderLines.isNotEmpty)
                      IconButton(
                        tooltip: 'Transfer Table',
                        icon: const Icon(Icons.swap_horiz, color: ShadcnColors.primary),
                        onPressed: () => _showTransferTableDialog(currentTable),
                      ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Guest count and Segmented Navigation Bar (on Phone)
          if (!isTablet) ...[
            Container(
              color: ShadcnColors.background,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  // Diners Count Stepper
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: ShadcnColors.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: ShadcnColors.border),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.people_outline, size: 14, color: ShadcnColors.mutedForeground),
                        const SizedBox(width: 4),
                        Text('${currentTable.currentGuestCount}', style: ShadcnTypography.bodySemibold.copyWith(fontSize: 12)),
                        const SizedBox(width: 4),
                        InkWell(
                          onTap: currentTable.currentGuestCount > 1
                              ? () => ref.read(restaurantProvider.notifier).setGuestCount(currentTable.id, currentTable.currentGuestCount - 1)
                              : null,
                          child: const Icon(Icons.remove, size: 14),
                        ),
                        const SizedBox(width: 2),
                        InkWell(
                          onTap: currentTable.currentGuestCount < 20
                              ? () => ref.read(restaurantProvider.notifier).setGuestCount(currentTable.id, currentTable.currentGuestCount + 1)
                              : null,
                          child: const Icon(Icons.add, size: 14, color: ShadcnColors.primary),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(width: 8),

                  // Segmented Tabs
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: ShadcnColors.surface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: ShadcnColors.border),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _activeTab = 0),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                decoration: BoxDecoration(
                                  color: _activeTab == 0 ? ShadcnColors.primary : Colors.transparent,
                                  borderRadius: BorderRadius.circular(7),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  '📋 Menu',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: _activeTab == 0 ? Colors.white : ShadcnColors.mutedForeground,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _activeTab = 1),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                decoration: BoxDecoration(
                                  color: _activeTab == 1 ? ShadcnColors.primary : Colors.transparent,
                                  borderRadius: BorderRadius.circular(7),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  '🍽️ Order (${currentTable.itemCount})',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: _activeTab == 1 ? Colors.white : ShadcnColors.mutedForeground,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const Divider(height: 1, color: ShadcnColors.border),

          // Content Area (Responsive)
          Expanded(
            child: isTablet
                ? Row(
                    children: [
                      Expanded(flex: 5, child: _buildMenuPane(filteredMenuItems, catalogState, currentTable)),
                      const VerticalDivider(width: 1, color: ShadcnColors.border),
                      Expanded(flex: 6, child: _buildOrderPane(currentTable)),
                    ],
                  )
                : (_activeTab == 0
                    ? _buildMenuPane(filteredMenuItems, catalogState, currentTable)
                    : _buildOrderPane(currentTable)),
          ),

          // Bottom Quick Bar on Phone if viewing Menu and items added
          if (!isTablet && _activeTab == 0 && currentTable.activeOrderLines.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: const BoxDecoration(
                color: ShadcnColors.surface,
                border: Border(top: BorderSide(color: ShadcnColors.border)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('${currentTable.itemCount} items selected', style: ShadcnTypography.caption),
                        Text(
                          '₹${(currentTable.runningTotalPaisa / 100).toStringAsFixed(2)}',
                          style: ShadcnTypography.currency.copyWith(color: ShadcnColors.primary),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  ShadcnButton(
                    text: 'View Order (${currentTable.itemCount})',
                    leadingIcon: const Icon(Icons.arrow_forward, size: 16),
                    size: ShadcnButtonSize.sm,
                    onPressed: () => setState(() => _activeTab = 1),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMenuPane(List<Product> filteredMenuItems, CatalogState catalogState, RestaurantTable currentTable) {
    return Container(
      color: ShadcnColors.background,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Search box
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
            child: TextField(
              controller: _menuSearchController,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: 'Search food dishes...',
                prefixIcon: const Icon(Icons.search, size: 16, color: ShadcnColors.mutedForeground),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                filled: true,
                fillColor: ShadcnColors.surface,
                isDense: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: ShadcnColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: ShadcnColors.border),
                ),
              ),
            ),
          ),

          // Categories horizontal bar
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: catalogState.availableCategories.map((c) {
                final isSel = _selectedCategory == c;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedCategory = c),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: isSel ? ShadcnColors.primary : ShadcnColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSel ? ShadcnColors.primary : ShadcnColors.border,
                        ),
                      ),
                      child: Text(
                        c,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: isSel ? FontWeight.w600 : FontWeight.w500,
                          color: isSel ? Colors.white : ShadcnColors.mutedForeground,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 6),

          // Product Items List
          Expanded(
            child: filteredMenuItems.isEmpty
                ? Center(
                    child: Text('No food items found', style: ShadcnTypography.caption),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    itemCount: filteredMenuItems.length,
                    itemBuilder: (ctx, idx) {
                      final item = filteredMenuItems[idx];
                      final existingLine = currentTable.activeOrderLines.firstWhere(
                        (l) => l.product.id == item.id,
                        orElse: () => CartItem(product: item, quantity: 0),
                      );

                      return ShadcnCard(
                        padding: const EdgeInsets.all(10),
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            _buildItemThumbnail(item.imageUrl),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    style: ShadcnTypography.bodySemibold.copyWith(fontSize: 13),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '₹${(item.sellingPricePaisa / 100).toStringAsFixed(1)}',
                                    style: ShadcnTypography.currency.copyWith(
                                      fontSize: 13,
                                      color: ShadcnColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (existingLine.quantity > 0)
                              ShadcnQuantityStepper(
                                quantity: existingLine.quantity,
                                height: 30,
                                isDestructiveOnZero: true,
                                onIncrement: () {
                                  ref.read(restaurantProvider.notifier).addItemToTable(currentTable.id, item);
                                },
                                onDecrement: () {
                                  ref.read(restaurantProvider.notifier).removeItemFromTable(currentTable.id, item.id);
                                },
                              )
                            else
                              ShadcnButton(
                                text: 'Add',
                                leadingIcon: const Icon(Icons.add, size: 14),
                                size: ShadcnButtonSize.sm,
                                variant: ShadcnButtonVariant.outline,
                                onPressed: () {
                                  HapticFeedback.selectionClick();
                                  ref.read(restaurantProvider.notifier).addItemToTable(currentTable.id, item);
                                },
                              ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderPane(RestaurantTable currentTable) {
    return Column(
      children: [
        // Running Order Header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          color: ShadcnColors.surface,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text('Active Running Order', style: ShadcnTypography.bodySemibold),
              ),
              ShadcnBadge(
                text: '${currentTable.itemCount} items',
                variant: ShadcnBadgeVariant.secondary,
              ),
            ],
          ),
        ),

        const Divider(height: 1, color: ShadcnColors.border),

        // Order Lines List
        Expanded(
          child: currentTable.activeOrderLines.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.restaurant_menu, size: 40, color: ShadcnColors.border),
                      const SizedBox(height: 8),
                      Text('No dishes added yet', style: ShadcnTypography.bodySemibold),
                      const SizedBox(height: 4),
                      Text('Select dishes from the menu to take table order', style: ShadcnTypography.caption),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: currentTable.activeOrderLines.length,
                  itemBuilder: (ctx, idx) {
                    final line = currentTable.activeOrderLines[idx];
                    return ShadcnCard(
                      padding: const EdgeInsets.all(10),
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      line.product.name,
                                      style: ShadcnTypography.bodySemibold.copyWith(fontSize: 13),
                                    ),
                                    Text(
                                      '₹${(line.product.sellingPricePaisa / 100).toStringAsFixed(1)} each',
                                      style: ShadcnTypography.caption,
                                    ),
                                  ],
                                ),
                              ),
                              ShadcnQuantityStepper(
                                quantity: line.quantity,
                                height: 30,
                                isDestructiveOnZero: true,
                                onIncrement: () {
                                  ref.read(restaurantProvider.notifier).addItemToTable(currentTable.id, line.product);
                                },
                                onDecrement: () {
                                  ref.read(restaurantProvider.notifier).removeItemFromTable(currentTable.id, line.product.id);
                                },
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '₹${(line.totalPaisa / 100).toStringAsFixed(1)}',
                                style: ShadcnTypography.currency.copyWith(fontSize: 13),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          // Cooking instructions trigger
                          GestureDetector(
                            onTap: () => _showInstructionDialog(currentTable, line),
                            child: Row(
                              children: [
                                Icon(Icons.edit_note, size: 14, color: ShadcnColors.primary),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    line.notes != null && line.notes!.isNotEmpty
                                        ? 'Note: ${line.notes}'
                                        : 'Add cooking instruction / note...',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontStyle: line.notes != null ? FontStyle.normal : FontStyle.italic,
                                      color: line.notes != null ? ShadcnColors.primary : ShadcnColors.mutedForeground,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),

        // Action Buttons Bottom Bar
        Container(
          padding: const EdgeInsets.all(14),
          decoration: const BoxDecoration(
            color: ShadcnColors.surface,
            border: Border(top: BorderSide(color: ShadcnColors.border)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Order Subtotal:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  Flexible(
                    child: Text(
                      '₹${(currentTable.runningTotalPaisa / 100).toStringAsFixed(2)}',
                      style: ShadcnTypography.currencyLarge.copyWith(color: ShadcnColors.primary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: ShadcnButton(
                      key: const Key('print_kot_btn'),
                      text: 'Print KOT',
                      variant: ShadcnButtonVariant.outline,
                      leadingIcon: const Icon(Icons.print, size: 16),
                      onPressed: currentTable.activeOrderLines.isEmpty ? null : () => _handlePrintKot(currentTable),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ShadcnButton(
                      key: const Key('settle_table_btn'),
                      text: 'Settle & Bill',
                      variant: ShadcnButtonVariant.primary,
                      leadingIcon: const Icon(Icons.check_circle_outline, size: 16),
                      onPressed: currentTable.activeOrderLines.isEmpty ? null : () => _showSettlementModal(currentTable),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

