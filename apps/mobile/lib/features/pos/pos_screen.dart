import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
import '../../core/services/permission_service.dart';
import '../../core/providers/sync_provider.dart';
import '../../core/services/barcode_scanner_listener.dart';
import '../../core/services/escpos_builder.dart';
import '../../core/services/offline_billing_service.dart';
import '../../core/config/app_config.dart';
import '../../core/theme/shadcn_colors.dart';
import '../../core/theme/shadcn_typography.dart';
import '../../core/widgets/shadcn_card.dart';
import '../../core/widgets/shadcn_button.dart';
import '../../core/widgets/shadcn_badge.dart';
import '../../core/widgets/shadcn_input.dart';
import '../../core/widgets/shadcn_sheet.dart';
import '../../core/widgets/shadcn_quantity_stepper.dart';
import '../../core/widgets/shadcn_empty_state.dart';
import '../../core/widgets/camera_barcode_scanner_modal.dart';

class MobilePosScreen extends ConsumerStatefulWidget {
  const MobilePosScreen({super.key});

  @override
  ConsumerState<MobilePosScreen> createState() => _MobilePosScreenState();
}

class _MobilePosScreenState extends ConsumerState<MobilePosScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isListView = false;

  void _addProductToCart(Product p) {
    HapticFeedback.selectionClick();
    final success = ref.read(cartProvider.notifier).addProduct(p);
    if (!success) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Cannot add more: Only ${p.currentStock.toInt()} units in stock for ${p.name}'),
          backgroundColor: ShadcnColors.warning,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showCheckoutSheet(BuildContext context, CartState cart) {
    if (cart.isEmpty) return;

    final customerList = ref.read(customerProvider).allCustomers;

    ShadcnSheet.show(
      context: context,
      title: 'Collect Payment',
      description: '${cart.totalItemsCount} items | Tax: ₹${cart.taxRupees.toStringAsFixed(2)}',
      child: _CheckoutSheetContent(
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
          Navigator.pop(context);
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
      ),
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
      HapticFeedback.mediumImpact();
      if (!success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Cannot add more: Only ${matchedProduct.currentStock.toInt()} units in stock for ${matchedProduct.name}'),
            backgroundColor: ShadcnColors.warning,
            duration: const Duration(seconds: 2),
          ),
        );
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Added to cart: ${matchedProduct.name} (₹${matchedProduct.sellingPriceRupees.toStringAsFixed(2)})'),
          backgroundColor: ShadcnColors.primary,
          duration: const Duration(seconds: 1),
        ),
      );
    } else {
      HapticFeedback.heavyImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Barcode "$barcode" not recognized in catalog.'),
          backgroundColor: ShadcnColors.destructive,
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
              backgroundColor: ShadcnColors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: ShadcnColors.border, width: 1),
              ),
              title: const Row(
                children: [
                  Icon(Icons.check_circle_rounded, color: ShadcnColors.success, size: 24),
                  SizedBox(width: 8),
                  Text('Sale Complete!', style: ShadcnTypography.h3),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Bill No: ${result.invoiceNumber}', style: ShadcnTypography.bodySemibold),
                          ShadcnBadge(
                            text: result.paymentMethod.toUpperCase(),
                            variant: ShadcnBadgeVariant.success,
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Amount Paid: ₹${result.totalRupees.toStringAsFixed(2)}',
                        style: ShadcnTypography.currency.copyWith(color: ShadcnColors.primary),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: ShadcnColors.secondary,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: ShadcnColors.border),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.print_outlined, size: 14, color: ShadcnColors.mutedForeground),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Printer: ${printerState.activeTransportName} (${printerState.paperWidth.name.toUpperCase()})',
                                style: ShadcnTypography.caption,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text('Thermal Receipt Preview:', style: ShadcnTypography.caption),
                      const SizedBox(height: 6),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: ShadcnColors.border),
                        ),
                        child: Text(
                          result.receiptText,
                          style: ShadcnTypography.code.copyWith(fontSize: 11, height: 1.3),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('New Sale', style: TextStyle(color: ShadcnColors.mutedForeground)),
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
                                backgroundColor: ShadcnColors.success,
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
                                backgroundColor: ShadcnColors.destructive,
                                duration: const Duration(seconds: 3),
                              ),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ShadcnColors.primary,
                    foregroundColor: ShadcnColors.primaryForeground,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  icon: isPrinting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.print, size: 16),
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
          backgroundColor: ShadcnColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: ShadcnColors.border, width: 1),
          ),
          title: const Row(
            children: [
              Icon(Icons.receipt_long, color: ShadcnColors.foreground, size: 20),
              SizedBox(width: 8),
              Text('Recent Invoices', style: ShadcnTypography.h3),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            height: 380,
            child: invoices.isEmpty
                ? const ShadcnEmptyState(
                    icon: Icons.receipt_long_outlined,
                    title: 'No Invoices Yet',
                    description: 'Completed customer sales will appear here.',
                  )
                : ListView.separated(
                    itemCount: invoices.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, color: ShadcnColors.border),
                    itemBuilder: (context, index) {
                      final inv = invoices[index];
                      final dateStr = '${inv.createdAt.day}/${inv.createdAt.month}/${inv.createdAt.year} '
                          '${inv.createdAt.hour}:${inv.createdAt.minute.toString().padLeft(2, '0')}';
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                        title: Text(inv.invoiceNumber, style: ShadcnTypography.bodySemibold),
                        subtitle: Text(
                          '$dateStr • ${inv.paymentMethod.toUpperCase()}',
                          style: ShadcnTypography.caption,
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '₹${(inv.grandTotalPaisa / 100).toStringAsFixed(2)}',
                              style: ShadcnTypography.bodySemibold.copyWith(color: ShadcnColors.primary),
                            ),
                            const SizedBox(width: 8),
                            ShadcnButton(
                              key: Key('reprint_btn_${inv.invoiceNumber}'),
                              text: 'Reprint',
                              size: ShadcnButtonSize.sm,
                              variant: ShadcnButtonVariant.outline,
                              leadingIcon: const Icon(Icons.print, size: 14),
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
                                      backgroundColor: ShadcnColors.success,
                                      duration: const Duration(seconds: 2),
                                    ),
                                  );
                                  navigator.pop();
                                } else {
                                  messenger.showSnackBar(
                                    SnackBar(
                                      content: Text('Reprint failed: ${printRes.errorMessage}'),
                                      backgroundColor: ShadcnColors.destructive,
                                    ),
                                  );
                                }
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close', style: TextStyle(color: ShadcnColors.mutedForeground)),
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

            String? scanErrorMessage;

            void loadDevices() async {
              setDlgState(() {
                isLoadingDevices = true;
                scanErrorMessage = null;
              });

              try {
                final hasPerm = await BluetoothPrinterTransport.requestPermissions();
                if (!hasPerm) {
                  if (ctx.mounted) {
                    setDlgState(() {
                      isLoadingDevices = false;
                      scanErrorMessage = 'Bluetooth / Nearby Devices permission is required. Please grant permission in Phone Settings.';
                    });
                  }
                  return;
                }

                final isBtOn = await BluetoothPrinterTransport.isBluetoothEnabled();
                if (!isBtOn) {
                  if (ctx.mounted) {
                    setDlgState(() {
                      isLoadingDevices = false;
                      scanErrorMessage = 'Bluetooth is turned OFF. Please enable Bluetooth in Android Settings.';
                    });
                  }
                  return;
                }

                final devs = await BluetoothPrinterTransport.getPairedDevices();
                if (ctx.mounted) {
                  setDlgState(() {
                    pairedDevices = devs;
                    isLoadingDevices = false;
                    if (devs.isEmpty) {
                      scanErrorMessage = 'No paired Bluetooth printers found.\nPair your thermal printer in Phone Settings > Bluetooth (PIN: 0000 or 1234), then tap Scan.';
                    }
                  });
                }
              } catch (e) {
                if (ctx.mounted) {
                  setDlgState(() {
                    isLoadingDevices = false;
                    scanErrorMessage = 'Bluetooth scan error: ${e.toString()}';
                  });
                }
              }
            }

            if (!hasAutoScanned) {
              hasAutoScanned = true;
              WidgetsBinding.instance.addPostFrameCallback((_) => loadDevices());
            }

            return AlertDialog(
              backgroundColor: ShadcnColors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: ShadcnColors.border, width: 1),
              ),
              title: const Row(
                children: [
                  Icon(Icons.print_outlined, color: ShadcnColors.foreground, size: 20),
                  SizedBox(width: 8),
                  Text('Thermal Printer Setup', style: ShadcnTypography.h3),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Status card
                      ShadcnCard(
                        padding: const EdgeInsets.all(12),
                        backgroundColor: printer.isReady
                            ? ShadcnColors.successLight
                            : ShadcnColors.secondary,
                        borderColor: printer.isReady
                            ? ShadcnColors.success.withValues(alpha: 0.3)
                            : ShadcnColors.border,
                        child: Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: printer.isReady
                                    ? ShadcnColors.success
                                    : ShadcnColors.destructive,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    printer.isReady ? 'Printer Connected' : 'Printer Disconnected',
                                    style: ShadcnTypography.bodySemibold.copyWith(
                                      color: printer.isReady
                                          ? ShadcnColors.successForeground
                                          : ShadcnColors.foreground,
                                    ),
                                  ),
                                  Text(
                                    printer.activeTransportName,
                                    style: ShadcnTypography.caption,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Paired Devices', style: ShadcnTypography.bodySemibold),
                          TextButton.icon(
                            onPressed: isLoadingDevices ? null : loadDevices,
                            icon: isLoadingDevices
                                ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Icon(Icons.refresh, size: 14),
                            label: const Text('Scan', style: TextStyle(fontSize: 12, color: ShadcnColors.primary)),
                          ),
                        ],
                      ),

                      if (scanErrorMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: ShadcnColors.warningLight,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: ShadcnColors.warning.withValues(alpha: 0.3)),
                          ),
                          child: Text(
                            scanErrorMessage!,
                            style: ShadcnTypography.caption.copyWith(color: ShadcnColors.warningForeground),
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],

                      if (pairedDevices.isNotEmpty) ...[
                        ...pairedDevices.map((d) {
                          final isSelected = printer.isReady &&
                              (printer.activeTransportName.contains(d.name) ||
                                  printer.activeTransportName.contains(d.address));
                          return Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            decoration: BoxDecoration(
                              color: isSelected ? ShadcnColors.successLight : ShadcnColors.surface,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isSelected ? ShadcnColors.success : ShadcnColors.border,
                              ),
                            ),
                            child: ListTile(
                              dense: true,
                              title: Text(d.name, style: ShadcnTypography.bodySemibold),
                              subtitle: Text(d.address, style: ShadcnTypography.caption),
                              trailing: isSelected
                                   ? const Icon(Icons.check_circle, color: ShadcnColors.success, size: 18)
                                  : OutlinedButton(
                                      onPressed: () => notifier.connectToBluetoothDevice(d),
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        side: const BorderSide(color: ShadcnColors.border),
                                      ),
                                      child: const Text('Connect', style: TextStyle(fontSize: 11)),
                                    ),
                            ),
                          );
                        }),
                      ],

                      const SizedBox(height: 12),
                      const Text('Paper Width Profile', style: ShadcnTypography.bodySemibold),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('58mm (32 cols)')),
                              selected: printer.paperWidth == PaperWidth.mm58,
                              selectedColor: ShadcnColors.primary,
                              labelStyle: TextStyle(
                                color: printer.paperWidth == PaperWidth.mm58 ? Colors.white : ShadcnColors.foreground,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                              onSelected: (val) {
                                if (val) notifier.setPaperWidth(PaperWidth.mm58);
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('80mm (48 cols)')),
                              selected: printer.paperWidth == PaperWidth.mm80,
                              selectedColor: ShadcnColors.primary,
                              labelStyle: TextStyle(
                                color: printer.paperWidth == PaperWidth.mm80 ? Colors.white : ShadcnColors.foreground,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                              onSelected: (val) {
                                if (val) notifier.setPaperWidth(PaperWidth.mm80);
                              },
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ShadcnButton(
                              text: 'Test Print',
                              variant: ShadcnButtonVariant.outline,
                              leadingIcon: const Icon(Icons.receipt_outlined, size: 14),
                              onPressed: () async {
                                final res = await notifier.printTestPage();
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(res.success ? 'Test page printed!' : 'Test print error: ${res.errorMessage}'),
                                    backgroundColor: res.success ? ShadcnColors.success : ShadcnColors.destructive,
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ShadcnButton(
                              text: 'Kick Drawer',
                              variant: ShadcnButtonVariant.outline,
                              leadingIcon: const Icon(Icons.point_of_sale_outlined, size: 14),
                              onPressed: () async {
                                final ok = await notifier.kickCashDrawer();
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(ok ? 'Cash drawer pulse sent!' : 'Drawer kick failed'),
                                    backgroundColor: ok ? ShadcnColors.success : ShadcnColors.destructive,
                                  ),
                                );
                              },
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
                  child: const Text('Done', style: TextStyle(color: ShadcnColors.foreground)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _openBarcodeScanner(BuildContext context) async {
    final scanned = await CameraBarcodeScannerModal.show(context);
    if (scanned != null && scanned.isNotEmpty) {
      _onBarcodeScanned(scanned);
    }
  }

  void _showLogoutDialog(BuildContext context, String storeName) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ShadcnColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: ShadcnColors.border, width: 1),
        ),
        title: const Text('Sign Out', style: ShadcnTypography.h3),
        content: Text('Are you sure you want to sign out of $storeName?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: ShadcnColors.mutedForeground)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: ShadcnColors.destructive,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final syncState = ref.watch(syncStateProvider);
    final catalogState = ref.watch(catalogProvider);
    final cartState = ref.watch(cartProvider);

    final categories = catalogState.availableCategories;
    final storeName = authState.activeMembership?.tenantName ?? 'Kirana Supermart';
    final branchName = authState.activeBranchId ?? 'BR-001';

    return HardwareBarcodeScannerListener(
      onBarcodeScanned: _onBarcodeScanned,
      child: Scaffold(
        backgroundColor: ShadcnColors.background,
        appBar: AppBar(
          backgroundColor: ShadcnColors.surface,
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(storeName, style: ShadcnTypography.h3),
              Text('$branchName • ${authState.user?.fullName ?? "Cashier"}', style: ShadcnTypography.caption),
            ],
          ),
          actions: [
            IconButton(
              key: const Key('pos_recent_bills_btn'),
              icon: const Icon(Icons.receipt_long_outlined, size: 20),
              tooltip: 'Recent Invoices & Reprint',
              onPressed: _showRecentBillsDialog,
            ),
            IconButton(
              key: const Key('pos_printer_btn'),
              icon: const Icon(Icons.print_outlined, size: 20),
              tooltip: 'Thermal Printer Setup',
              onPressed: () => _showPrinterSettingsDialog(context),
            ),
            InkWell(
              key: const Key('pos_sync_badge'),
              onTap: () async {
                ScaffoldMessenger.of(context).hideCurrentSnackBar();
                final success = await ref.read(syncStateProvider.notifier).syncNow();
                if (!context.mounted) return;
                final lastErr = ref.read(syncStateProvider).lastError;
                final syncMsg = success
                    ? 'Synchronization complete!'
                    : (lastErr != null && lastErr.isNotEmpty
                        ? lastErr
                        : 'Working offline — saved locally');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(syncMsg),
                    backgroundColor: success
                        ? ShadcnColors.success
                        : (syncMsg.contains('expired') ? ShadcnColors.destructive : ShadcnColors.warning),
                    duration: const Duration(seconds: 3),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(6),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: syncState.hasPending ? ShadcnColors.warningLight : ShadcnColors.secondary,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: syncState.hasPending ? ShadcnColors.warning.withValues(alpha: 0.4) : ShadcnColors.border,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      syncState.isSyncing
                          ? Icons.sync
                          : (syncState.hasPending ? Icons.cloud_upload_outlined : Icons.cloud_done_outlined),
                      size: 14,
                      color: syncState.hasPending ? ShadcnColors.warningForeground : ShadcnColors.mutedForeground,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      syncState.hasPending
                          ? 'Offline Ready (${syncState.pendingCount})'
                          : 'Offline Ready',
                      style: ShadcnTypography.caption.copyWith(
                        color: syncState.hasPending ? ShadcnColors.warningForeground : ShadcnColors.mutedForeground,
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            IconButton(
              key: const Key('pos_logout_btn'),
              icon: const Icon(Icons.logout, size: 18, color: ShadcnColors.mutedForeground),
              tooltip: 'Sign Out',
              onPressed: () => _showLogoutDialog(context, storeName),
            ),
            const SizedBox(width: 6),
          ],
        ),
        body: Column(
          children: [
            // Search & Barcode Action Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: ShadcnInput(
                      controller: _searchController,
                      placeholder: 'Scan Barcode / Search Product...',
                      prefixIcon: const Icon(Icons.search, size: 18, color: ShadcnColors.mutedForeground),
                      showClearButton: true,
                      onChanged: (val) => ref.read(catalogProvider.notifier).updateSearch(val),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    height: 44,
                    width: 44,
                    child: ElevatedButton(
                      key: const Key('pos_manual_scan_btn'),
                      onPressed: () => _openBarcodeScanner(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ShadcnColors.foreground,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                      ),
                      child: const Icon(Icons.qr_code_scanner, size: 20),
                    ),
                  ),
                ],
              ),
            ),

            // Category Filter Pills & View Mode Toggle
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: categories.map((cat) {
                          final isSelected = catalogState.selectedCategory == cat;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: InkWell(
                              onTap: () {
                                HapticFeedback.selectionClick();
                                ref.read(catalogProvider.notifier).selectCategory(cat);
                              },
                              borderRadius: BorderRadius.circular(6),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isSelected ? ShadcnColors.primary : ShadcnColors.surface,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: isSelected ? ShadcnColors.primary : ShadcnColors.border,
                                    width: 1.0,
                                  ),
                                ),
                                child: Text(
                                  cat,
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
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    key: const Key('pos_view_mode_toggle'),
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _isListView = !_isListView);
                    },
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: ShadcnColors.surface,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: ShadcnColors.border),
                      ),
                      child: Icon(
                        _isListView ? Icons.grid_view_rounded : Icons.view_list_rounded,
                        size: 18,
                        color: ShadcnColors.foreground,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 6),

            // Product Grid or Dense List
            Expanded(
              child: catalogState.filteredProducts.isEmpty
                  ? ShadcnEmptyState(
                      icon: Icons.inventory_2_outlined,
                      title: 'No Products Found',
                      description: 'No catalog items match "${_searchController.text}".',
                      actionText: 'Clear Search',
                      onActionPressed: () {
                        _searchController.clear();
                        ref.read(catalogProvider.notifier).updateSearch('');
                      },
                    )
                  : (_isListView
                      ? ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          itemCount: catalogState.filteredProducts.length,
                          separatorBuilder: (_, __) => const Divider(height: 1, color: ShadcnColors.border),
                          itemBuilder: (context, index) {
                            final p = catalogState.filteredProducts[index];
                            return _ProductListItem(
                              product: p,
                              onTap: () => _addProductToCart(p),
                            );
                          },
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 1.08,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                          ),
                          itemCount: catalogState.filteredProducts.length,
                          itemBuilder: (context, index) {
                            final p = catalogState.filteredProducts[index];
                            return _ProductCard(
                              product: p,
                              onTap: () => _addProductToCart(p),
                            );
                          },
                        )),
            ),

            // Sticky Bottom Checkout Dock
            if (!cartState.isEmpty)
              _BottomCartBar(
                cart: cartState,
                onCheckout: () => _showCheckoutSheet(context, cartState),
                onClear: () {
                  HapticFeedback.mediumImpact();
                  ref.read(cartProvider.notifier).clearCart();
                },
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final inCart = cart.items.firstWhere(
      (i) => i.product.id == product.id,
      orElse: () => CartItem(product: product, quantity: 0),
    );

    final isSelected = inCart.quantity > 0;

    return ShadcnCard(
      padding: EdgeInsets.zero,
      backgroundColor: isSelected ? ShadcnColors.successLight.withValues(alpha: 0.25) : ShadcnColors.card,
      borderColor: isSelected ? ShadcnColors.primary : ShadcnColors.border,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Top Hero Product Photo with Overlaid Category & Stock Badges
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                child: SizedBox(
                  width: double.infinity,
                  height: 78,
                  child: buildHeroImage(product),
                ),
              ),

              // Overlaid Badges
              Positioned(
                top: 5,
                left: 5,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.65),
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: Text(
                    product.category,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.2,
                    ),
                  ),
                ),
              ),

              Positioned(
                top: 5,
                right: 5,
                child: ShadcnBadge(
                  text: product.isLowStock
                      ? '${product.currentStock.toInt()} left'
                      : '${product.currentStock.toInt()} in stock',
                  variant: product.isLowStock ? ShadcnBadgeVariant.destructive : ShadcnBadgeVariant.secondary,
                ),
              ),
            ],
          ),

          // 2. Snug Product Name, SKU, Price & Add Action
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 4, 8, 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        product.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: ShadcnTypography.bodySemibold.copyWith(
                          fontSize: 12.5,
                          height: 1.15,
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        '${product.sku} • ${product.unit}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: ShadcnTypography.caption.copyWith(
                          fontSize: 10,
                          color: ShadcnColors.mutedForeground,
                        ),
                      ),
                    ],
                  ),

                  // Price & Quick Stepper / Add Action
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        '₹${product.sellingPriceRupees.toStringAsFixed(1)}',
                        style: ShadcnTypography.currency.copyWith(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: ShadcnColors.foreground,
                        ),
                      ),
                      if (inCart.quantity > 0)
                        ShadcnQuantityStepper(
                          quantity: inCart.quantity,
                          height: 24,
                          isDestructiveOnZero: true,
                          onIncrement: onTap,
                          onDecrement: () {
                            HapticFeedback.selectionClick();
                            ref.read(cartProvider.notifier).decrementProduct(product.id);
                          },
                        )
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: ShadcnColors.primaryLight,
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.add, size: 11, color: ShadcnColors.primary),
                              SizedBox(width: 2),
                              Text(
                                'ADD',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.bold,
                                  color: ShadcnColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Widget buildHeroImage(Product p) {
    final img = p.imageUrl;
    if (img != null && img.isNotEmpty) {
      if (img.startsWith('data:image/')) {
        try {
          final commaIdx = img.indexOf(',');
          final base64Str = commaIdx != -1 ? img.substring(commaIdx + 1) : img;
          final bytes = base64Decode(base64Str);
          return Image.memory(
            bytes,
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            errorBuilder: (_, __, ___) => buildFallbackCategoryGraphic(p),
          );
        } catch (_) {
          return buildFallbackCategoryGraphic(p);
        }
      } else if (img.startsWith('http://') || img.startsWith('https://')) {
        return Image.network(
          img,
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
          errorBuilder: (_, __, ___) => buildFallbackCategoryGraphic(p),
        );
      }
    }
    return buildFallbackCategoryGraphic(p);
  }

  static Widget buildFallbackCategoryGraphic(Product p) {
    IconData icon;
    final cat = p.category.toLowerCase();
    if (cat.contains('egg') || cat.contains('dairy') || cat.contains('milk')) {
      icon = Icons.egg_outlined;
    } else if (cat.contains('grain') || cat.contains('flour') || cat.contains('atta') || cat.contains('rice')) {
      icon = Icons.grain;
    } else if (cat.contains('snack') || cat.contains('biscuit')) {
      icon = Icons.fastfood_outlined;
    } else if (cat.contains('drink') || cat.contains('beverage') || cat.contains('tea') || cat.contains('coffee')) {
      icon = Icons.local_cafe_outlined;
    } else if (cat.contains('clean') || cat.contains('soap') || cat.contains('detergent') || cat.contains('house')) {
      icon = Icons.cleaning_services_outlined;
    } else if (cat.contains('bakery') || cat.contains('bread')) {
      icon = Icons.bakery_dining_outlined;
    } else {
      icon = Icons.inventory_2_outlined;
    }

    return Container(
      color: ShadcnColors.secondary.withValues(alpha: 0.65),
      child: Center(
        child: Icon(
          icon,
          size: 38,
          color: ShadcnColors.mutedForeground.withValues(alpha: 0.65),
        ),
      ),
    );
  }
}

/// Ultra-dense retail list row for fast counter cashier checkout
class _ProductListItem extends ConsumerWidget {
  final Product product;
  final VoidCallback onTap;

  const _ProductListItem({required this.product, required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final inCart = cart.items.firstWhere(
      (i) => i.product.id == product.id,
      orElse: () => CartItem(product: product, quantity: 0),
    );

    final isSelected = inCart.quantity > 0;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? ShadcnColors.successLight.withValues(alpha: 0.18) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: SizedBox(
                width: 44,
                height: 44,
                child: _ProductCard.buildHeroImage(product),
              ),
            ),
            const SizedBox(width: 10),

            // Title & SKU
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          product.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: ShadcnTypography.bodySemibold.copyWith(fontSize: 13),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${product.currentStock.toInt()} left',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: product.isLowStock ? ShadcnColors.destructive : ShadcnColors.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${product.sku} • ${product.category} • ${product.unit}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: ShadcnTypography.caption.copyWith(fontSize: 10.5, color: ShadcnColors.mutedForeground),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // Price & Stepper / ADD
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '₹${product.sellingPriceRupees.toStringAsFixed(1)}',
                  style: ShadcnTypography.currency.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: ShadcnColors.foreground,
                  ),
                ),
                const SizedBox(height: 4),
                if (inCart.quantity > 0)
                  ShadcnQuantityStepper(
                    quantity: inCart.quantity,
                    height: 24,
                    isDestructiveOnZero: true,
                    onIncrement: onTap,
                    onDecrement: () {
                      HapticFeedback.selectionClick();
                      ref.read(cartProvider.notifier).decrementProduct(product.id);
                    },
                  )
                else
                  InkWell(
                    onTap: onTap,
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: ShadcnColors.primaryLight,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add, size: 12, color: ShadcnColors.primary),
                          SizedBox(width: 2),
                          Text(
                            'ADD',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.bold,
                              color: ShadcnColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ],
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: ShadcnColors.surface,
        border: Border(top: BorderSide(color: ShadcnColors.border, width: 1.0)),
        boxShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, -2),
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
                  style: ShadcnTypography.caption,
                ),
                Text(
                  '₹${cart.grandTotalRupees.toStringAsFixed(2)}',
                  style: ShadcnTypography.currencyLarge.copyWith(color: ShadcnColors.primary),
                ),
              ],
            ),
            const Spacer(),
            IconButton(
              onPressed: onClear,
              icon: const Icon(Icons.delete_outline, size: 20, color: ShadcnColors.destructive),
              tooltip: 'Clear Cart',
            ),
            const SizedBox(width: 8),
            ShadcnButton(
              text: 'PAY / BILL',
              size: ShadcnButtonSize.lg,
              variant: ShadcnButtonVariant.primary,
              leadingIcon: const Icon(Icons.payments_outlined, size: 18),
              onPressed: onCheckout,
            ),
          ],
        ),
      ),
    );
  }
}

class _CheckoutSheetContent extends StatefulWidget {
  final CartState cart;
  final List<Customer> customers;
  final Future<Customer?> Function(String name, String phone)? onAddCustomer;
  final Function(String paymentMethod, String? customerId, String? customerName) onComplete;

  const _CheckoutSheetContent({
    required this.cart,
    required this.customers,
    this.onAddCustomer,
    required this.onComplete,
  });

  @override
  State<_CheckoutSheetContent> createState() => _CheckoutSheetContentState();
}

class _CheckoutSheetContentState extends State<_CheckoutSheetContent> {
  String _selectedMethod = 'cash';
  Customer? _selectedCustomer;
  final TextEditingController _cashTenderController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cashTenderController.text = widget.cart.grandTotalRupees.toStringAsFixed(0);
  }

  @override
  void dispose() {
    _cashTenderController.dispose();
    super.dispose();
  }

  void _showNewCustomerDialog() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (dlgCtx) => AlertDialog(
        backgroundColor: ShadcnColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: ShadcnColors.border),
        ),
        title: const Text('Add Khata Customer', style: ShadcnTypography.h3),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ShadcnInput(controller: nameCtrl, label: 'Customer Full Name', placeholder: 'e.g. Ramesh Kumar'),
            const SizedBox(height: 12),
            ShadcnInput(controller: phoneCtrl, label: 'Phone Number', placeholder: '+91 9876543210', keyboardType: TextInputType.phone),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dlgCtx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: ShadcnColors.primary, foregroundColor: Colors.white),
            onPressed: () async {
              final name = nameCtrl.text.trim();
              final phone = phoneCtrl.text.trim();
              if (name.isEmpty || phone.isEmpty) return;
              Navigator.pop(dlgCtx);
              if (widget.onAddCustomer != null) {
                final created = await widget.onAddCustomer!(name, phone);
                if (created != null && mounted) {
                  setState(() => _selectedCustomer = created);
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
    final grandTotal = widget.cart.grandTotalRupees;
    final tenderDouble = double.tryParse(_cashTenderController.text) ?? grandTotal;
    final changeDue = (tenderDouble - grandTotal).clamp(0.0, 999999.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Total summary banner
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: ShadcnColors.primaryLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: ShadcnColors.primary.withValues(alpha: 0.3)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total Amount Due', style: ShadcnTypography.bodySemibold),
              Text(
                '₹${grandTotal.toStringAsFixed(2)}',
                style: ShadcnTypography.currencyLarge.copyWith(color: ShadcnColors.primary),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),
        const Text('Select Payment Method', style: ShadcnTypography.bodySemibold),
        const SizedBox(height: 8),

        Row(
          children: [
            _TenderCard(
              label: 'Cash',
              icon: Icons.payments_outlined,
              isSelected: _selectedMethod == 'cash',
              onTap: () => setState(() => _selectedMethod = 'cash'),
            ),
            const SizedBox(width: 8),
            _TenderCard(
              label: 'UPI QR',
              icon: Icons.qr_code_2,
              isSelected: _selectedMethod == 'upi',
              onTap: () => setState(() => _selectedMethod = 'upi'),
            ),
            const SizedBox(width: 8),
            _TenderCard(
              label: 'Card',
              icon: Icons.credit_card,
              isSelected: _selectedMethod == 'card',
              onTap: () => setState(() => _selectedMethod = 'card'),
            ),
            const SizedBox(width: 8),
            _TenderCard(
              label: 'Khata',
              icon: Icons.book_outlined,
              isSelected: _selectedMethod == 'credit',
              onTap: () => setState(() => _selectedMethod = 'credit'),
            ),
          ],
        ),

        if (_selectedMethod == 'cash') ...[
          const SizedBox(height: 16),
          const Text('Cash Tendered & Change', style: ShadcnTypography.bodySemibold),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ShadcnInput(
                  controller: _cashTenderController,
                  prefixIcon: const Icon(Icons.currency_rupee, size: 16),
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: ShadcnColors.secondary,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: ShadcnColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Change Due', style: ShadcnTypography.caption),
                    Text(
                      '₹${changeDue.toStringAsFixed(2)}',
                      style: ShadcnTypography.bodySemibold.copyWith(
                        color: changeDue > 0 ? ShadcnColors.destructive : ShadcnColors.foreground,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Quick cash buttons
          Row(
            children: [100, 200, 500, 2000].map((amt) {
              return Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ActionChip(
                  label: Text('₹$amt', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                  backgroundColor: ShadcnColors.secondary,
                  side: const BorderSide(color: ShadcnColors.border),
                  onPressed: () {
                    setState(() {
                      _cashTenderController.text = '$amt';
                    });
                  },
                ),
              );
            }).toList(),
          ),
        ],

        if (_selectedMethod == 'credit') ...[
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Khata Customer Account', style: ShadcnTypography.bodySemibold),
              TextButton.icon(
                onPressed: _showNewCustomerDialog,
                icon: const Icon(Icons.person_add, size: 14, color: ShadcnColors.primary),
                label: const Text('+ New', style: TextStyle(fontSize: 12, color: ShadcnColors.primary)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          DropdownButtonFormField<Customer>(
            initialValue: _selectedCustomer,
            hint: const Text('Select customer...'),
            items: widget.customers.map((c) {
              return DropdownMenuItem(
                value: c,
                child: Text('${c.name} (${c.phone}) - Due: ₹${c.currentBalanceRupees.toStringAsFixed(1)}'),
              );
            }).toList(),
            onChanged: (val) => setState(() => _selectedCustomer = val),
            decoration: InputDecoration(
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: ShadcnColors.border)),
            ),
          ),
        ],

        const SizedBox(height: 24),
        ShadcnButton(
          text: 'CONFIRM PAYMENT & SAVE INVOICE',
          size: ShadcnButtonSize.lg,
          variant: ShadcnButtonVariant.primary,
          leadingIcon: const Icon(Icons.check_circle_outline, size: 18),
          onPressed: () {
            if (_selectedMethod == 'credit' && _selectedCustomer == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Please select a customer for Khata credit')),
              );
              return;
            }
            widget.onComplete(_selectedMethod, _selectedCustomer?.id, _selectedCustomer?.name);
          },
        ),
      ],
    );
  }
}

class _TenderCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _TenderCard({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: isSelected ? ShadcnColors.primaryLight : ShadcnColors.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected ? ShadcnColors.primary : ShadcnColors.border,
                width: isSelected ? 1.5 : 1.0,
              ),
            ),
            child: Column(
              children: [
                Icon(icon, color: isSelected ? ShadcnColors.primary : ShadcnColors.mutedForeground, size: 20),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: ShadcnTypography.caption.copyWith(
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? ShadcnColors.primary : ShadcnColors.foreground,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
