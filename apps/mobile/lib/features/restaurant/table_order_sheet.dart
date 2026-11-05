import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/app_config.dart';
import '../../../core/models/receipt_document.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/catalog_provider.dart';
import '../../../core/providers/printer_provider.dart';
import '../../../core/providers/restaurant_provider.dart';
import '../../../core/providers/sync_provider.dart';
import '../../../core/services/offline_billing_service.dart';

class TableOrderSheet extends ConsumerStatefulWidget {
  final RestaurantTable table;

  const TableOrderSheet({super.key, required this.table});

  @override
  ConsumerState<TableOrderSheet> createState() => _TableOrderSheetState();
}

class _TableOrderSheetState extends ConsumerState<TableOrderSheet> {
  final TextEditingController _menuSearchController = TextEditingController();
  String _selectedCategory = 'All';

  @override
  void dispose() {
    _menuSearchController.dispose();
    super.dispose();
  }

  Future<void> _handlePrintKot(RestaurantTable currentTable) async {
    if (currentTable.activeOrderLines.isEmpty) return;

    final notifier = ref.read(printerProvider.notifier);

    // Format plain text KOT and ESC/POS payload
    final buffer = StringBuffer();
    buffer.writeln('================================');
    buffer.writeln('   KITCHEN ORDER TICKET (KOT)   ');
    buffer.writeln('================================');
    buffer.writeln('Table:   ${currentTable.name} (${currentTable.section})');
    buffer.writeln('Time:    ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}');
    buffer.writeln('Server:  Mobile Terminal');
    buffer.writeln('--------------------------------');
    buffer.writeln('Item                      Qty   ');
    buffer.writeln('--------------------------------');
    for (final line in currentTable.activeOrderLines) {
      final name = line.product.name.length > 24
          ? line.product.name.substring(0, 24)
          : line.product.name.padRight(24);
      final qty = line.quantity.toString().padLeft(4);
      buffer.writeln('$name $qty');
    }
    buffer.writeln('================================');
    buffer.writeln('     PREPARE EXPEDITE ORDER     ');
    buffer.writeln('================================\n\n');

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
        customerName: currentTable.name,
      ),
      lines: currentTable.activeOrderLines.map((i) {
        return ReceiptLineItem(
          name: i.product.name,
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
                : 'KOT generated! Printer message: ${res.errorMessage ?? "Dispatched"}',
          ),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
    }
  }

  void _showSettlementModal(RestaurantTable currentTable) {
    String selectedMethod = 'cash';
    bool isSettling = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final totalFormatted = '₹${(currentTable.runningTotalPaisa / 100).toStringAsFixed(2)}';

            return Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.receipt_long, color: Color(0xFF10B981)),
                          const SizedBox(width: 8),
                          Text('Settle Bill: ${currentTable.name}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                  const Divider(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Payable:', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        Text(totalFormatted, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('Select Payment Tender:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          avatar: const Icon(Icons.payments, size: 16),
                          label: const Text('Cash'),
                          selected: selectedMethod == 'cash',
                          onSelected: (_) => setModalState(() => selectedMethod = 'cash'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ChoiceChip(
                          avatar: const Icon(Icons.qr_code, size: 16),
                          label: const Text('UPI'),
                          selected: selectedMethod == 'upi',
                          onSelected: (_) => setModalState(() => selectedMethod = 'upi'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ChoiceChip(
                          avatar: const Icon(Icons.credit_card, size: 16),
                          label: const Text('Card'),
                          selected: selectedMethod == 'card',
                          onSelected: (_) => setModalState(() => selectedMethod = 'card'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    key: const Key('confirm_table_settle_btn'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
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

                            // Vacate table
                            ref.read(restaurantProvider.notifier).clearAndVacateTable(currentTable.id);

                            // Refresh outbox
                            await ref.read(syncStateProvider.notifier).refreshStatus();

                            if (mounted) {
                              Navigator.pop(ctx); // Close settlement modal
                              Navigator.pop(context); // Close order sheet
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Bill settled successfully for ${currentTable.name} (${result.invoiceNumber})!'),
                                  backgroundColor: const Color(0xFF10B981),
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
                    child: isSettling
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text('Confirm Settlement ($totalFormatted)', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Sheet Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.table_restaurant, color: Color(0xFF10B981), size: 22),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(currentTable.name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                        Text('${currentTable.section} • Capacity: ${currentTable.capacity} guests',
                            style: const TextStyle(fontSize: 11, color: Colors.grey)),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          Expanded(
            child: Row(
              children: [
                // Left Pane: Menu Catalog to Add Items
                Expanded(
                  flex: 5,
                  child: Container(
                    color: const Color(0xFFF8FAFC),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(10, 8, 10, 6),
                          child: TextField(
                            controller: _menuSearchController,
                            onChanged: (_) => setState(() {}),
                            decoration: InputDecoration(
                              hintText: 'Search food...',
                              prefixIcon: const Icon(Icons.search, size: 16),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              filled: true,
                              fillColor: Colors.white,
                              isDense: true,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: Colors.grey.shade300),
                              ),
                            ),
                          ),
                        ),
                        // Quick category horizontal scroller
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Row(
                            children: catalogState.availableCategories.map((c) {
                              final isSel = _selectedCategory == c;
                              return Padding(
                                padding: const EdgeInsets.only(right: 4),
                                child: ChoiceChip(
                                  label: Text(c, style: TextStyle(fontSize: 11, color: isSel ? Colors.white : Colors.black87)),
                                  selected: isSel,
                                  selectedColor: const Color(0xFF10B981),
                                  visualDensity: VisualDensity.compact,
                                  onSelected: (_) => setState(() => _selectedCategory = c),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        const SizedBox(height: 4),
                        // Items list
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.all(8),
                            itemCount: filteredMenuItems.length,
                            itemBuilder: (ctx, idx) {
                              final item = filteredMenuItems[idx];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 6),
                                elevation: 0.5,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                child: ListTile(
                                  dense: true,
                                  title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  subtitle: Text('₹${(item.sellingPricePaisa / 100).toStringAsFixed(1)}', style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.add_circle, color: Color(0xFF10B981)),
                                    onPressed: () {
                                      ref.read(restaurantProvider.notifier).addItemToTable(currentTable.id, item);
                                    },
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const VerticalDivider(width: 1),

                // Right Pane: Active Table Order
                Expanded(
                  flex: 6,
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        color: Colors.grey.shade100,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Running Order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            Text('${currentTable.itemCount} items', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          ],
                        ),
                      ),
                      Expanded(
                        child: currentTable.activeOrderLines.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.restaurant_menu, size: 40, color: Colors.grey.shade300),
                                    const SizedBox(height: 8),
                                    const Text('No items added yet', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                    const Text('Select items from menu on the left', style: TextStyle(color: Colors.grey, fontSize: 10)),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.all(8),
                                itemCount: currentTable.activeOrderLines.length,
                                itemBuilder: (ctx, idx) {
                                  final line = currentTable.activeOrderLines[idx];
                                  return Card(
                                    elevation: 0.5,
                                    margin: const EdgeInsets.only(bottom: 6),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(line.product.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                                Text('₹${(line.product.sellingPricePaisa / 100).toStringAsFixed(1)} each', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                              ],
                                            ),
                                          ),
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              IconButton(
                                                icon: const Icon(Icons.remove_circle_outline, size: 18),
                                                visualDensity: VisualDensity.compact,
                                                onPressed: () {
                                                  ref.read(restaurantProvider.notifier).removeItemItemFromTable(currentTable.id, line.product.id);
                                                },
                                              ),
                                              Text('${line.quantity}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                              IconButton(
                                                icon: const Icon(Icons.add_circle_outline, size: 18, color: Color(0xFF10B981)),
                                                visualDensity: VisualDensity.compact,
                                                onPressed: () {
                                                  ref.read(restaurantProvider.notifier).addItemToTable(currentTable.id, line.product);
                                                },
                                              ),
                                            ],
                                          ),
                                          const SizedBox(width: 6),
                                          Text('₹${(line.totalPaisa / 100).toStringAsFixed(1)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ),

                      // Order Actions Bottom
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border(top: BorderSide(color: Colors.grey.shade200)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Order Total:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                                Text('₹${(currentTable.runningTotalPaisa / 100).toStringAsFixed(2)}',
                                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    key: const Key('print_kot_btn'),
                                    onPressed: currentTable.activeOrderLines.isEmpty
                                        ? null
                                        : () => _handlePrintKot(currentTable),
                                    icon: const Icon(Icons.print, size: 16),
                                    label: const Text('Print KOT', style: TextStyle(fontSize: 12)),
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    key: const Key('settle_table_btn'),
                                    onPressed: currentTable.activeOrderLines.isEmpty
                                        ? null
                                        : () => _showSettlementModal(currentTable),
                                    icon: const Icon(Icons.check_circle, size: 16),
                                    label: const Text('Settle & Bill', style: TextStyle(fontSize: 12)),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF10B981),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

extension on RestaurantNotifier {
  void removeItemItemFromTable(String tableId, String productId) {
    removeItemFromTable(tableId, productId);
  }
}
