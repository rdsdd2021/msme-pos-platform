import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models/cart_item.dart';
import '../../core/models/product.dart';
import '../../core/models/customer.dart';
import '../../core/models/receipt_document.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/cart_provider.dart';
import '../../core/providers/catalog_provider.dart';
import '../../core/providers/customer_provider.dart';
import '../../core/providers/printer_provider.dart';
import '../../core/services/printer_service.dart';
import '../../core/providers/sync_provider.dart';
import '../../core/services/barcode_scanner_listener.dart';
import '../../core/services/escpos_builder.dart';
import '../../core/services/offline_billing_service.dart';
import '../../core/config/app_config.dart';

class MobilePosScreen extends ConsumerStatefulWidget {
  const MobilePosScreen({super.key});

  @override
  ConsumerState<MobilePosScreen> createState() => _MobilePosScreenState();
}

class _MobilePosScreenState extends ConsumerState<MobilePosScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showCheckoutSheet(BuildContext context, CartState cart) {
    if (cart.isEmpty) return;

    final customerList = ref.read(customerProvider).allCustomers;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return _CheckoutBottomSheet(
          cart: cart,
          customers: customerList,
          onAddCustomer: (name, phone) async {
            final newC = await ref.read(customerProvider.notifier).addCustomer(
              name: name,
              phone: phone,
            );
            return newC;
          },
          onComplete: (paymentMethod, customerId, customerName) async {
            Navigator.pop(ctx);
            final authState = ref.read(authProvider);
            final tenantId = authState.activeMembership?.tenantId ?? 'tenant-1';
            final branchId = authState.activeBranchId ?? 'branch-1';
            final deviceId = await AppConfig.getDeviceId();

            final result = await OfflineBillingService.processSale(
              items: cart.items,
              paymentMethod: paymentMethod,
              customerId: customerId,
              customerName: customerName,
              tenantId: tenantId,
              branchId: branchId,
              deviceId: deviceId,
            );

            // Deduct stock in catalog
            for (final item in cart.items) {
              await ref.read(catalogProvider.notifier).deductStock(item.product.id, item.quantity);
            }

            // Clear Cart
            ref.read(cartProvider.notifier).clearCart();

            // Refresh pending outbox sync count & trigger non-blocking real-time push
            await ref.read(syncStateProvider.notifier).refreshStatus();
            unawaited(ref.read(syncStateProvider.notifier).syncNow());

            if (!mounted) return;
            _showReceiptDialog(result);
          },
        );
      },
    );
  }

  void _onBarcodeScanned(String barcode) {
    final catalogState = ref.read(catalogProvider);
    final cleanBarcode = barcode.trim().toLowerCase();

    Product? matchedProduct;
    for (final p in catalogState.allProducts) {
      if (p.barcode?.toLowerCase() == cleanBarcode ||
          p.sku.toLowerCase() == cleanBarcode) {
        matchedProduct = p;
        break;
      }
    }

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    if (matchedProduct != null) {
      final success = ref.read(cartProvider.notifier).addProduct(matchedProduct);
      if (!success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Cannot add more: Only ${matchedProduct.currentStock.toInt()} units in stock for ${matchedProduct.name}'),
            backgroundColor: Colors.orange.shade800,
            duration: const Duration(seconds: 2),
          ),
        );
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Scanned: ${matchedProduct.name} (₹${matchedProduct.sellingPriceRupees.toStringAsFixed(2)}) added to cart!'),
          backgroundColor: Colors.green.shade700,
          duration: const Duration(seconds: 1),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Barcode "$barcode" not recognized in catalog.'),
          backgroundColor: Colors.red.shade700,
          duration: const Duration(seconds: 2),
          action: SnackBarAction(
            label: 'Search',
            textColor: Colors.white,
            onPressed: () {
              _searchController.text = barcode;
              ref.read(catalogProvider.notifier).updateSearch(barcode);
            },
          ),
        ),
      );
    }
  }

  void _showReceiptDialog(OfflineSaleResult result) {
    final printerState = ref.read(printerProvider);
    final receiptDoc = result.receiptDocument ??
        ReceiptDocument.fromOfflineSale(
          sale: result,
          items: const [],
        );

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final isPrinting = ref.watch(printerProvider).isPrinting;

            return AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green, size: 28),
                  SizedBox(width: 8),
                  Text('Sale Complete!'),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Bill No: ${result.invoiceNumber}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text('Tender: ${result.paymentMethod.toUpperCase()}'),
                      Text(
                        'Amount Paid: ₹${result.totalRupees.toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.blue.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.print, size: 14, color: Colors.blue.shade700),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Printer: ${printerState.activeTransportName} (${printerState.paperWidth.name.toUpperCase()})',
                                style: TextStyle(fontSize: 11, color: Colors.blue.shade900),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Divider(height: 20),
                      const Text('Thermal Receipt Preview:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Text(
                          result.receiptText,
                          style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('New Sale (Done)'),
                ),
                ElevatedButton.icon(
                  key: const Key('print_receipt_btn'),
                  onPressed: isPrinting
                      ? null
                      : () async {
                          final messenger = ScaffoldMessenger.of(context);
                          final navigator = Navigator.of(ctx);
                          final printRes = await ref.read(printerProvider.notifier).printReceipt(
                                receiptDoc,
                                openCashDrawer: result.paymentMethod.toLowerCase() == 'cash',
                              );
                          if (!mounted) return;
                          messenger.hideCurrentSnackBar();
                          if (printRes.success) {
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text('Receipt printed successfully (${printRes.bytesSent} bytes)!'),
                                backgroundColor: Colors.green,
                                duration: const Duration(seconds: 2),
                              ),
                            );
                            navigator.pop();
                          } else {
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Print Error: ${printRes.errorMessage ?? "Printer offline"}\nSale recorded safely in database (Rule 14).',
                                ),
                                backgroundColor: Colors.red.shade700,
                                duration: const Duration(seconds: 3),
                              ),
                            );
                          }
                        },
                  icon: isPrinting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.print),
                  label: Text(isPrinting ? 'Printing...' : 'Print Receipt'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showRecentBillsDialog() async {
    final invoices = await OfflineBillingService.getAllInvoices();

    if (!mounted) return;
    await showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.receipt_long, color: Color(0xFF0F172A)),
              SizedBox(width: 8),
              Text('Recent Invoices'),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            height: 350,
            child: invoices.isEmpty
                ? const Center(child: Text('No invoices recorded locally yet.'))
                : ListView.separated(
                    itemCount: invoices.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final inv = invoices[index];
                      final dateStr = '${inv.createdAt.day}/${inv.createdAt.month}/${inv.createdAt.year} '
                          '${inv.createdAt.hour}:${inv.createdAt.minute.toString().padLeft(2, '0')}';
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        title: Text(
                          inv.invoiceNumber,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        subtitle: Text('$dateStr | ${inv.paymentMethod.toUpperCase()} | ₹${(inv.grandTotalPaisa / 100).toStringAsFixed(2)}'),
                        trailing: ElevatedButton.icon(
                          key: Key('reprint_btn_${inv.invoiceNumber}'),
                          icon: const Icon(Icons.print, size: 14),
                          label: const Text('Reprint', style: TextStyle(fontSize: 11)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0F172A),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          ),
                          onPressed: () async {
                            final messenger = ScaffoldMessenger.of(context);
                            final navigator = Navigator.of(ctx);
                            final doc = await OfflineBillingService.getReceiptDocument(inv.id);
                            if (doc == null) return;
                            final printRes = await ref.read(printerProvider.notifier).reprintReceipt(doc);
                            if (!mounted) return;
                            messenger.hideCurrentSnackBar();
                            if (printRes.success) {
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text('Duplicate receipt printed for ${inv.invoiceNumber}!'),
                                  backgroundColor: Colors.green,
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                              navigator.pop();
                            } else {
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text('Reprint failed: ${printRes.errorMessage}'),
                                  backgroundColor: Colors.red.shade700,
                                ),
                              );
                            }
                          },
                        ),
                      );
                    },
                  ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  void _showPrinterSettingsDialog(BuildContext context) {
    List<BluetoothDeviceItem> pairedDevices = [];
    bool isLoadingDevices = false;
    bool hasAutoScanned = false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDlgState) {
            final printer = ref.watch(printerProvider);
            final notifier = ref.read(printerProvider.notifier);

            void loadDevices() async {
              setDlgState(() => isLoadingDevices = true);
              final devs = await BluetoothPrinterTransport.getPairedDevices();
              if (ctx.mounted) {
                setDlgState(() {
                  pairedDevices = devs;
                  isLoadingDevices = false;
                });
              }
            }

            if (!hasAutoScanned) {
              hasAutoScanned = true;
              WidgetsBinding.instance.addPostFrameCallback((_) => loadDevices());
            }

            return AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.print, color: Color(0xFF0F172A)),
                  SizedBox(width: 8),
                  Text('Thermal Printer Setup'),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.circle,
                            size: 12,
                            color: printer.isReady
                                ? Colors.green
                                : (printer.hasError ? Colors.red : Colors.grey),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Status: ${printer.status.label}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Device: ${printer.activeTransportName}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      const Divider(height: 20),

                      // Bluetooth Pairing Section
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.bluetooth, size: 16, color: Colors.blue),
                              SizedBox(width: 4),
                              Text('Bluetooth Thermal Printers', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            ],
                          ),
                          TextButton.icon(
                            onPressed: isLoadingDevices ? null : loadDevices,
                            icon: isLoadingDevices
                                ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Icon(Icons.refresh, size: 14),
                            label: const Text('Scan', style: TextStyle(fontSize: 11)),
                          ),
                        ],
                      ),
                      if (pairedDevices.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: pairedDevices.length,
                          itemBuilder: (ctx, i) {
                            final dev = pairedDevices[i];
                            final isCurrent = printer.activeTransportName.contains(dev.address);
                            return ListTile(
                              dense: true,
                              contentPadding: EdgeInsets.zero,
                              leading: Icon(
                                Icons.print,
                                color: isCurrent ? Colors.green : Colors.grey,
                                size: 18,
                              ),
                              title: Text(dev.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              subtitle: Text(dev.address, style: const TextStyle(fontSize: 10)),
                              trailing: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: isCurrent ? Colors.green : const Color(0xFF0F172A),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                ),
                                onPressed: () async {
                                  final transport = BluetoothPrinterTransport(address: dev.address, name: dev.name);
                                  notifier.setTransport(transport);
                                  final ok = await notifier.reconnect();
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(ok ? 'Connected to ${dev.name}!' : 'Failed to connect to ${dev.name}'),
                                        backgroundColor: ok ? Colors.green : Colors.red,
                                      ),
                                    );
                                  }
                                },
                                child: Text(isCurrent ? 'Connected' : 'Connect', style: const TextStyle(fontSize: 11)),
                              ),
                            );
                          },
                        ),
                      ] else ...[
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.blue.shade100),
                          ),
                          child: const Text(
                            'Pair your 58mm/80mm Bluetooth printer in Android Phone Settings (PIN: 0000 or 1234), then tap "Scan" above to connect.',
                            style: TextStyle(fontSize: 11, color: Colors.blueGrey),
                          ),
                        ),
                      ],

                      const Divider(height: 20),
                      const Text('Paper Width Profile:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          ChoiceChip(
                            label: const Text('58mm (32 cols)'),
                            selected: printer.paperWidth == PaperWidth.mm58,
                            onSelected: (val) {
                              if (val) notifier.setPaperWidth(PaperWidth.mm58);
                            },
                          ),
                          const SizedBox(width: 8),
                          ChoiceChip(
                            label: const Text('80mm (48 cols)'),
                            selected: printer.paperWidth == PaperWidth.mm80,
                            onSelected: (val) {
                              if (val) notifier.setPaperWidth(PaperWidth.mm80);
                            },
                          ),
                        ],
                      ),
                      const Divider(height: 20),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.blueGrey,
                          side: BorderSide(color: Colors.blueGrey.shade200),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                        icon: const Icon(Icons.developer_mode, size: 16),
                        label: const Text('Use Demo Simulated Printer (Testing Mode)', style: TextStyle(fontSize: 11)),
                        onPressed: () {
                          notifier.enableDemoPrinter();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Switched to Demo Simulated Printer for testing!'),
                                backgroundColor: Color(0xFF10B981),
                              ),
                            );
                          }
                        },
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                final res = await notifier.printTestPage();
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      res.success ? 'Test page printed!' : 'Test print error: ${res.errorMessage}',
                                    ),
                                    backgroundColor: res.success ? Colors.green : Colors.red,
                                  ),
                                );
                              },
                              icon: const Icon(Icons.receipt, size: 16),
                              label: const Text('Test Print', style: TextStyle(fontSize: 12)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                final ok = await notifier.kickCashDrawer();
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(ok ? 'Cash drawer pulse sent!' : 'Drawer kick failed'),
                                    backgroundColor: ok ? Colors.green : Colors.red,
                                  ),
                                );
                              },
                              icon: const Icon(Icons.point_of_sale, size: 16),
                              label: const Text('Kick Drawer', style: TextStyle(fontSize: 12)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Done'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showManualBarcodeDialog(BuildContext context) {
    final controller = TextEditingController();
    final catalogState = ref.read(catalogProvider);
    final popularWithBarcodes = catalogState.allProducts
        .where((p) => p.barcode != null && p.barcode!.isNotEmpty)
        .take(6)
        .toList();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.qr_code_scanner, color: Color(0xFF0F172A)),
            SizedBox(width: 8),
            Text('Scan Barcode'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'External USB & Bluetooth scanners scan automatically in the background.\nOr enter an item barcode / SKU below:',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              autofocus: true,
              keyboardType: TextInputType.text,
              decoration: InputDecoration(
                hintText: 'Enter Barcode or SKU (e.g. 890103000005)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                isDense: true,
              ),
              onSubmitted: (code) {
                if (code.trim().isNotEmpty) {
                  Navigator.pop(ctx);
                  _onBarcodeScanned(code.trim());
                }
              },
            ),
            if (popularWithBarcodes.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text('Active Catalog Items with Barcode:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: popularWithBarcodes.map((item) {
                  final label = item.name.contains('Parle-G') ? 'Parle-G 800g' : item.name;
                  return ActionChip(
                    label: Text(label, style: const TextStyle(fontSize: 11)),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _onBarcodeScanned(item.barcode!);
                    },
                  );
                }).toList(),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final code = controller.text.trim();
              if (code.isNotEmpty) {
                Navigator.pop(ctx);
                _onBarcodeScanned(code);
              }
            },
            child: const Text('Add to Cart'),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context) async {
    final authState = ref.read(authProvider);
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out'),
        content: Text(
          'Are you sure you want to sign out from ${authState.user?.fullName ?? "this terminal"}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final syncState = ref.watch(syncStateProvider);
    final catalogState = ref.watch(catalogProvider);
    final cartState = ref.watch(cartProvider);

    final categories = catalogState.availableCategories;

    return HardwareBarcodeScannerListener(
      onBarcodeScanned: _onBarcodeScanned,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: const Color(0xFF0F172A),
          foregroundColor: Colors.white,
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                authState.activeMembership?.tenantName ?? 'Kirana Supermart',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              Text(
                '${authState.activeBranchId ?? "BR-001"} | ${authState.user?.fullName ?? "Cashier"}',
                style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
              ),
            ],
          ),
          actions: [
            IconButton(
              key: const Key('pos_recent_bills_btn'),
              icon: const Icon(Icons.receipt_long, size: 20),
              tooltip: 'Recent Invoices & Reprint',
              onPressed: _showRecentBillsDialog,
            ),
            IconButton(
              key: const Key('pos_printer_btn'),
              icon: const Icon(Icons.print, size: 20),
              tooltip: 'Thermal Printer Setup',
              onPressed: () => _showPrinterSettingsDialog(context),
            ),
            InkWell(
              key: const Key('pos_sync_badge'),
            onTap: () async {
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
              final success = await ref.read(syncStateProvider.notifier).syncNow();
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    success
                        ? 'Synchronization complete!'
                        : 'Sync status: ${ref.read(syncStateProvider).lastError ?? "Offline (saved locally)"}',
                  ),
                  backgroundColor: success ? Colors.green : Colors.orange.shade800,
                  duration: const Duration(seconds: 2),
                ),
              );
            },
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: syncState.isSyncing
                    ? const Color(0xFF3B82F6).withValues(alpha: 0.2)
                    : (syncState.hasPending
                        ? const Color(0xFFF59E0B).withValues(alpha: 0.2)
                        : const Color(0xFF10B981).withValues(alpha: 0.2)),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: syncState.isSyncing
                      ? Colors.blue.shade600
                      : (syncState.hasPending
                          ? Colors.amber.shade600
                          : Colors.green.shade600),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (syncState.isSyncing) ...[
                    const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.lightBlueAccent,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'Syncing...',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.lightBlueAccent,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ] else ...[
                    Icon(
                      syncState.hasPending ? Icons.cloud_upload_outlined : Icons.cloud_done,
                      size: 14,
                      color: syncState.hasPending ? Colors.amberAccent : Colors.greenAccent,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      syncState.hasPending
                          ? 'Offline Ready (${syncState.pendingCount})'
                          : 'Offline Ready',
                      style: TextStyle(
                        fontSize: 11,
                        color: syncState.hasPending ? Colors.amberAccent : Colors.greenAccent,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          IconButton(
            key: const Key('pos_logout_btn'),
            icon: const Icon(Icons.logout, size: 20),
            tooltip: 'Sign Out',
            onPressed: () => _confirmLogout(context),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // Barcode & Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: (val) => ref.read(catalogProvider.notifier).updateSearch(val),
                    decoration: InputDecoration(
                      hintText: 'Scan Barcode / Search Product...',
                      prefixIcon: const Icon(Icons.search),
                      isDense: true,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  key: const Key('pos_manual_scan_btn'),
                  onPressed: () => _showManualBarcodeDialog(context),
                  icon: const Icon(Icons.qr_code_scanner),
                  tooltip: 'Scan Barcode',
                  style: IconButton.styleFrom(backgroundColor: const Color(0xFF0F172A)),
                ),
              ],
            ),
          ),

          // Category Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: Row(
              children: categories.map((cat) {
                final isSelected = catalogState.selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text(cat),
                    selected: isSelected,
                    onSelected: (_) => ref.read(catalogProvider.notifier).selectCategory(cat),
                    selectedColor: const Color(0xFF10B981),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.black87,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      fontSize: 12,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Product Grid
          Expanded(
            child: catalogState.filteredProducts.isEmpty
                ? const Center(child: Text('No products match search.'))
                : GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 1.35,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                    ),
                    itemCount: catalogState.filteredProducts.length,
                    itemBuilder: (context, index) {
                      final p = catalogState.filteredProducts[index];
                      return _ProductCard(
                        product: p,
                        onTap: () {
                          final success = ref.read(cartProvider.notifier).addProduct(p);
                          if (!success) {
                            ScaffoldMessenger.of(context).hideCurrentSnackBar();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Cannot add more: Only ${p.currentStock.toInt()} units in stock for ${p.name}'),
                                backgroundColor: Colors.orange.shade800,
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          }
                        },
                      );
                    },
                  ),
          ),

          // Bottom Cart Bar
          _BottomCartBar(
            cart: cartState,
            onCheckout: () => _showCheckoutSheet(context, cartState),
            onClear: () => ref.read(cartProvider.notifier).clearCart(),
          ),
        ],
      ),
    ),
  );
}
}

class _ProductCard extends ConsumerWidget {
  final Product product;
  final VoidCallback onTap;

  const _ProductCard({required this.product, required this.onTap});

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'groceries':
        return const Color(0xFF10B981);
      case 'dairy':
        return const Color(0xFF0284C7);
      case 'snacks':
        return const Color(0xFFF59E0B);
      case 'beverages':
        return const Color(0xFF8B5CF6);
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final inCart = cart.items.firstWhere(
      (i) => i.product.id == product.id,
      orElse: () => CartItem(product: product, quantity: 0),
    );
    final catColor = _getCategoryColor(product.category);

    return InkWell(
      onTap: inCart.quantity == 0 ? onTap : null,
      borderRadius: BorderRadius.circular(10),
      child: Ink(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: inCart.quantity > 0 ? const Color(0xFF10B981) : Colors.grey.shade200,
            width: inCart.quantity > 0 ? 1.5 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: inCart.quantity > 0
                  ? const Color(0xFF10B981).withOpacity(0.08)
                  : Colors.black.withOpacity(0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: catColor.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          product.category,
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: catColor),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: product.isLowStock ? Colors.red.shade50 : Colors.green.shade50,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${product.currentStock.toInt()} ${product.isLowStock ? "⚠️" : "left"}',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: product.isLowStock ? Colors.red.shade700 : Colors.green.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '₹${product.sellingPriceRupees.toStringAsFixed(1)}',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF0F172A)),
                  ),
                  if (inCart.quantity > 0)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: () {
                            ref.read(cartProvider.notifier).decrementProduct(product.id);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: const Icon(Icons.remove, size: 14),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 5),
                          child: Text(
                            '${inCart.quantity}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF10B981)),
                          ),
                        ),
                        InkWell(
                          onTap: onTap,
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Icon(Icons.add, size: 14, color: Colors.white),
                          ),
                        ),
                      ],
                    )
                  else
                    InkWell(
                      onTap: onTap,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.add, size: 12, color: Color(0xFF10B981)),
                            SizedBox(width: 2),
                            Text('ADD', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BottomCartBar extends StatelessWidget {
  final CartState cart;
  final VoidCallback onCheckout;
  final VoidCallback onClear;

  const _BottomCartBar({
    required this.cart,
    required this.onCheckout,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    if (cart.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        color: Colors.grey.shade100,
        child: const Center(
          child: Text('Cart is empty. Tap items to add.', style: TextStyle(color: Colors.grey, fontSize: 12)),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${cart.totalItemsCount} items | Tax: ₹${cart.taxRupees.toStringAsFixed(2)}',
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                ),
                Text(
                  '₹${cart.grandTotalRupees.toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Spacer(),
            IconButton(
              onPressed: onClear,
              icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
              tooltip: 'Clear Cart',
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: onCheckout,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('PAY / BILL', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ],
        ),
      ),
    );
  }
}

class _CheckoutBottomSheet extends StatefulWidget {
  final CartState cart;
  final List<Customer> customers;
  final Future<Customer?> Function(String name, String phone)? onAddCustomer;
  final Function(String paymentMethod, String? customerId, String? customerName) onComplete;

  const _CheckoutBottomSheet({
    required this.cart,
    required this.customers,
    this.onAddCustomer,
    required this.onComplete,
  });

  @override
  State<_CheckoutBottomSheet> createState() => _CheckoutBottomSheetState();
}

class _CheckoutBottomSheetState extends State<_CheckoutBottomSheet> {
  String _selectedMethod = 'cash';
  Customer? _selectedCustomer;

  void _showNewCustomerDialog() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (dlgCtx) => AlertDialog(
        title: const Text('Add Khata Customer'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Customer Full Name *',
                isDense: true,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Mobile Phone *',
                isDense: true,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dlgCtx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final name = nameCtrl.text.trim();
              final phone = phoneCtrl.text.trim();
              if (name.isEmpty || phone.isEmpty) return;
              Navigator.pop(dlgCtx);
              if (widget.onAddCustomer != null) {
                final created = await widget.onAddCustomer!(name, phone);
                if (created != null && mounted) {
                  setState(() {
                    _selectedCustomer = created;
                  });
                }
              }
            },
            child: const Text('Save Customer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Collect Payment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Text(
                'Total: ₹${widget.cart.grandTotalRupees.toStringAsFixed(2)}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Select Tender:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(height: 8),
          Row(
            children: [
              _TenderButton(
                label: 'Cash',
                icon: Icons.payments,
                isSelected: _selectedMethod == 'cash',
                onTap: () => setState(() => _selectedMethod = 'cash'),
              ),
              const SizedBox(width: 8),
              _TenderButton(
                label: 'UPI QR',
                icon: Icons.qr_code,
                isSelected: _selectedMethod == 'upi',
                onTap: () => setState(() => _selectedMethod = 'upi'),
              ),
              const SizedBox(width: 8),
              _TenderButton(
                label: 'Card',
                icon: Icons.credit_card,
                isSelected: _selectedMethod == 'card',
                onTap: () => setState(() => _selectedMethod = 'card'),
              ),
              const SizedBox(width: 8),
              _TenderButton(
                label: 'Khata',
                icon: Icons.book,
                isSelected: _selectedMethod == 'credit',
                onTap: () => setState(() => _selectedMethod = 'credit'),
              ),
            ],
          ),

          if (_selectedMethod == 'credit') ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Select Khata Customer:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                TextButton.icon(
                  onPressed: _showNewCustomerDialog,
                  icon: const Icon(Icons.person_add, size: 14),
                  label: const Text('+ New Customer', style: TextStyle(fontSize: 11)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            DropdownButtonFormField<Customer>(
              initialValue: _selectedCustomer,
              hint: const Text('Choose customer account'),
              items: widget.customers.map((c) {
                return DropdownMenuItem(
                  value: c,
                  child: Text('${c.name} (${c.phone}) - Due: ₹${c.currentBalanceRupees.toStringAsFixed(1)}'),
                );
              }).toList(),
              onChanged: (val) => setState(() => _selectedCustomer = val),
              decoration: InputDecoration(
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],

          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () {
                if (_selectedMethod == 'credit' && _selectedCustomer == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please select a customer for Khata credit')),
                  );
                  return;
                }
                widget.onComplete(_selectedMethod, _selectedCustomer?.id, _selectedCustomer?.name);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('CONFIRM PAYMENT & SAVE INVOICE', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}

class _TenderButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _TenderButton({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF10B981) : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? const Color(0xFF10B981) : Colors.grey.shade300,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? Colors.white : Colors.black87, size: 20),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.black87,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
