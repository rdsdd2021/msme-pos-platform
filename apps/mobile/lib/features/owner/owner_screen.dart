import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/analytics_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/catalog_provider.dart';
import '../../core/providers/customer_provider.dart';
import '../../core/providers/printer_provider.dart';
import '../../core/theme/shadcn_colors.dart';
import '../../core/theme/shadcn_typography.dart';
import '../../core/widgets/shadcn_card.dart';
import '../../core/widgets/shadcn_badge.dart';
import '../../core/widgets/shadcn_button.dart';

class MobileOwnerScreen extends ConsumerWidget {
  const MobileOwnerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final membership = authState.activeMembership;
    final metricsAsync = ref.watch(todayMetricsProvider);
    final catalogState = ref.watch(catalogProvider);
    final customerState = ref.watch(customerProvider);
    final printerState = ref.watch(printerProvider);

    final lowStockItems = catalogState.allProducts.where((p) => p.isLowStock).toList();
    final customers = customerState.allCustomers;
    final totalKhataDueRupees = customers.fold<int>(0, (sum, c) => sum + c.currentBalancePaisa) / 100.0;

    return Scaffold(
      backgroundColor: ShadcnColors.background,
      appBar: AppBar(
        title: const Text('Store Owner Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            tooltip: 'Refresh Metrics',
            onPressed: () {
              HapticFeedback.selectionClick();
              ref.invalidate(todayMetricsProvider);
              ref.read(catalogProvider.notifier).reload();
              ref.read(customerProvider.notifier).reload();
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, size: 18, color: ShadcnColors.mutedForeground),
            tooltip: 'Sign Out',
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Store Profile & Active Subscription Badge
            ShadcnCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              membership?.tenantName ?? 'Kirana Supermart',
                              style: ShadcnTypography.h3,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Branch: ${authState.activeBranchId != null && authState.activeBranchId!.length > 8 ? authState.activeBranchId!.substring(0, 8) : (authState.activeBranchId ?? "BR-001")} • Role: ${membership?.role.toUpperCase() ?? "OWNER"}',
                              style: ShadcnTypography.caption,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      ShadcnBadge(
                        text: (membership?.businessType ?? 'KIRANA').toUpperCase(),
                        variant: ShadcnBadgeVariant.success,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(height: 1, color: ShadcnColors.border),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Text('Active Modules: ', style: ShadcnTypography.caption),
                      Expanded(
                        child: Wrap(
                          spacing: 4,
                          children: (membership?.enabledModules ?? ['pos', 'inventory', 'khata']).map((m) {
                            return ShadcnBadge(
                              text: m.toUpperCase(),
                              variant: ShadcnBadgeVariant.secondary,
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Live Performance Metrics (2x2 Grid)
            Builder(
              builder: (context) {
                final metrics = metricsAsync.valueOrNull ?? const TodayMetrics();
                return Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _KpiMetricCard(
                            title: 'Gross Sales',
                            value: '₹${metrics.grossSalesRupees.toStringAsFixed(2)}',
                            subtitle: '${metrics.billCount} Bills Generated',
                            accentColor: ShadcnColors.primary,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _KpiMetricCard(
                            title: 'Cash In Register',
                            value: '₹${metrics.cashRupees.toStringAsFixed(2)}',
                            subtitle: 'Drawer Balance',
                            accentColor: ShadcnColors.success,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: _KpiMetricCard(
                            title: 'UPI / Digital',
                            value: '₹${metrics.upiRupees.toStringAsFixed(2)}',
                            subtitle: 'Settled to Bank',
                            accentColor: ShadcnColors.info,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _KpiMetricCard(
                            title: 'Khata Credit',
                            value: '₹${metrics.khataRupees.toStringAsFixed(2)}',
                            subtitle: 'Extended Today',
                            accentColor: ShadcnColors.warning,
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),

            const SizedBox(height: 16),

            // Hardware & Printer Control Hub
            ShadcnCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.print_outlined, size: 18, color: ShadcnColors.foreground),
                          SizedBox(width: 8),
                          Text('Thermal Printer & Drawer', style: ShadcnTypography.bodySemibold),
                        ],
                      ),
                      ShadcnBadge(
                        text: printerState.isReady ? 'Connected' : 'Offline',
                        variant: printerState.isReady
                            ? ShadcnBadgeVariant.success
                            : ShadcnBadgeVariant.destructive,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Active Transport: ${printerState.activeTransportName} (${printerState.paperWidth.name.toUpperCase()})',
                    style: ShadcnTypography.caption,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ShadcnButton(
                          text: 'Kick Drawer',
                          size: ShadcnButtonSize.sm,
                          variant: ShadcnButtonVariant.outline,
                          leadingIcon: const Icon(Icons.point_of_sale_outlined, size: 14),
                          onPressed: () async {
                            final ok = await ref.read(printerProvider.notifier).kickCashDrawer();
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(ok ? 'Cash drawer pulse triggered!' : 'Drawer pulse failed'),
                                  backgroundColor: ok ? ShadcnColors.success : ShadcnColors.destructive,
                                ),
                              );
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ShadcnButton(
                          text: 'Test Slip',
                          size: ShadcnButtonSize.sm,
                          variant: ShadcnButtonVariant.outline,
                          leadingIcon: const Icon(Icons.receipt_outlined, size: 14),
                          onPressed: () async {
                            final res = await ref.read(printerProvider.notifier).printTestPage();
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(res.success ? 'Test slip printed!' : 'Error: ${res.errorMessage}'),
                                  backgroundColor: res.success ? ShadcnColors.success : ShadcnColors.destructive,
                                ),
                              );
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Low Stock Alerts Section
            Row(
              children: [
                const Icon(Icons.warning_amber_rounded, size: 18, color: ShadcnColors.warning),
                const SizedBox(width: 6),
                const Text('Low Stock Alerts (< 5 units)', style: ShadcnTypography.bodySemibold),
                const Spacer(),
                Text('${lowStockItems.length} items', style: ShadcnTypography.caption),
              ],
            ),
            const SizedBox(height: 8),
            ShadcnCard(
              padding: EdgeInsets.zero,
              child: lowStockItems.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.all(20),
                      child: Center(
                        child: Text(
                          'All inventory items have healthy stock levels.',
                          style: TextStyle(fontSize: 13, color: ShadcnColors.success, fontWeight: FontWeight.w500),
                        ),
                      ),
                    )
                  : ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: lowStockItems.length,
                      separatorBuilder: (_, __) => const Divider(height: 1, color: ShadcnColors.border),
                      itemBuilder: (ctx, i) {
                        final item = lowStockItems[i];
                        return ListTile(
                          dense: true,
                          title: Text(item.name, style: ShadcnTypography.bodySemibold),
                          subtitle: Text('SKU: ${item.sku} • Price: ₹${item.sellingPriceRupees.toStringAsFixed(1)}', style: ShadcnTypography.caption),
                          trailing: ShadcnBadge(
                            text: '${item.currentStock.toInt()} left',
                            variant: ShadcnBadgeVariant.destructive,
                          ),
                        );
                      },
                    ),
            ),

            const SizedBox(height: 20),

            // Customer Khata Ledger Summary Section
            Row(
              children: [
                const Icon(Icons.menu_book_outlined, size: 18, color: ShadcnColors.foreground),
                const SizedBox(width: 6),
                const Text('Customer Khata Balances', style: ShadcnTypography.bodySemibold),
                const Spacer(),
                Text('Total Due: ₹${totalKhataDueRupees.toStringAsFixed(2)}', style: ShadcnTypography.caption.copyWith(color: ShadcnColors.destructive, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            ShadcnCard(
              padding: EdgeInsets.zero,
              child: customers.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.all(20),
                      child: Center(
                        child: Text(
                          'No customers with outstanding credit.',
                          style: TextStyle(fontSize: 13, color: ShadcnColors.mutedForeground),
                        ),
                      ),
                    )
                  : ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: customers.take(5).length,
                      separatorBuilder: (_, __) => const Divider(height: 1, color: ShadcnColors.border),
                      itemBuilder: (ctx, i) {
                        final c = customers[i];
                        return ListTile(
                          dense: true,
                          title: Text(c.name, style: ShadcnTypography.bodySemibold),
                          subtitle: Text('Phone: ${c.phone} • Limit: ₹${(c.creditLimitPaisa / 100).toStringAsFixed(0)}', style: ShadcnTypography.caption),
                          trailing: Text(
                            '₹${(c.currentBalancePaisa / 100.0).toStringAsFixed(1)}',
                            style: ShadcnTypography.bodySemibold.copyWith(
                              color: c.currentBalancePaisa > 0 ? ShadcnColors.destructive : ShadcnColors.success,
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _KpiMetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final Color accentColor;

  const _KpiMetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return ShadcnCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: ShadcnTypography.caption),
          const SizedBox(height: 6),
          Text(
            value,
            style: ShadcnTypography.currency.copyWith(
              fontSize: 18,
              color: accentColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(subtitle, style: ShadcnTypography.caption.copyWith(fontSize: 10)),
        ],
      ),
    );
  }
}
