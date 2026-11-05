import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models/customer.dart';
import '../../core/models/product.dart';
import '../../core/providers/analytics_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/catalog_provider.dart';
import '../../core/providers/customer_provider.dart';
import '../../core/providers/printer_provider.dart';
import '../../core/providers/store_mode_provider.dart';
import '../../core/providers/sync_provider.dart';

class MobileOwnerScreen extends ConsumerWidget {
  const MobileOwnerScreen({super.key});

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final metricsAsync = ref.watch(todayMetricsProvider);
    final catalogState = ref.watch(catalogProvider);
    final customerState = ref.watch(customerProvider);
    final syncState = ref.watch(syncStateProvider);

    final lowStockItems = catalogState.allProducts.where((p) => p.isLowStock).toList();
    final customers = customerState.allCustomers;
    final totalKhataDueRupees = customers.fold<int>(0, (sum, c) => sum + c.currentBalancePaisa) / 100.0;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        title: const Text('Store Owner Analytics', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: 'Refresh Metrics',
            onPressed: () {
              ref.invalidate(todayMetricsProvider);
            },
          ),
          IconButton(
            key: const Key('owner_logout_btn'),
            icon: const Icon(Icons.logout, size: 20),
            tooltip: 'Sign Out',
            onPressed: () => _confirmLogout(context, ref),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(todayMetricsProvider);
          await ref.read(syncStateProvider.notifier).syncNow();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Store Title & Sync Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Today\'s Performance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text(
                        '${authState.activeMembership?.tenantName ?? "Kirana Supermart"} - ${authState.activeBranchId ?? "Main"}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: syncState.isSyncing
                          ? Colors.blue.shade50
                          : (syncState.pendingCount > 0 ? Colors.amber.shade50 : Colors.green.shade50),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: syncState.isSyncing
                            ? Colors.blue.shade200
                            : (syncState.pendingCount > 0 ? Colors.amber.shade200 : Colors.green.shade200),
                      ),
                    ),
                    child: Text(
                      syncState.isSyncing
                          ? 'Syncing...'
                          : (syncState.pendingCount > 0
                              ? '${syncState.pendingCount} Pending Sync'
                              : 'Live Sync Active'),
                      style: TextStyle(
                        color: syncState.isSyncing
                            ? Colors.blue.shade800
                            : (syncState.pendingCount > 0 ? Colors.amber.shade900 : Colors.green.shade800),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Store Vertical Mode Selector
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.tune, size: 16, color: Color(0xFF10B981)),
                        SizedBox(width: 6),
                        Text(
                          'Store Business Mode (Industry Vertical)',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SegmentedButton<StoreVerticalMode>(
                      segments: const [
                        ButtonSegment(
                          value: StoreVerticalMode.retail,
                          icon: Icon(Icons.shopping_basket_outlined, size: 16),
                          label: Text('Kirana / Retail', style: TextStyle(fontSize: 12)),
                        ),
                        ButtonSegment(
                          value: StoreVerticalMode.restaurant,
                          icon: Icon(Icons.restaurant, size: 16),
                          label: Text('Restaurant / Food', style: TextStyle(fontSize: 12)),
                        ),
                      ],
                      selected: {ref.watch(storeModeProvider)},
                      onSelectionChanged: (set) {
                        ref.read(storeModeProvider.notifier).setMode(set.first);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Switched store to ${set.first.label}!'),
                            backgroundColor: const Color(0xFF10B981),
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Quick Hardware Actions Row
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        backgroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      icon: const Icon(Icons.point_of_sale, size: 16),
                      label: const Text('Kick Drawer', style: TextStyle(fontSize: 12)),
                      onPressed: () async {
                        final ok = await ref.read(printerProvider.notifier).kickCashDrawer();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(ok ? 'Cash drawer pulse triggered!' : 'Drawer pulse sent to printer'),
                              backgroundColor: ok ? Colors.green : Colors.grey.shade800,
                            ),
                          );
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        backgroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      icon: const Icon(Icons.print, size: 16),
                      label: const Text('Test Receipt', style: TextStyle(fontSize: 12)),
                      onPressed: () async {
                        final res = await ref.read(printerProvider.notifier).printTestPage();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res.success ? 'Test slip printed!' : 'Printer error: ${res.errorMessage}'),
                              backgroundColor: res.success ? Colors.green : Colors.red,
                            ),
                          );
                        }
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Live Metrics Cards
              Builder(
                builder: (context) {
                  final metrics = metricsAsync.valueOrNull ?? const TodayMetrics();
                  return Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _MetricCard(
                              title: 'Gross Sales',
                              value: '₹${metrics.grossSalesRupees.toStringAsFixed(2)}',
                              subtitle: '${metrics.billCount} Bills Generated',
                              color: Colors.indigo.shade700,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _MetricCard(
                              title: 'Cash In Register',
                              value: '₹${metrics.cashRupees.toStringAsFixed(2)}',
                              subtitle: 'Drawer Balance',
                              color: Colors.green.shade700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _MetricCard(
                              title: 'UPI / Digital',
                              value: '₹${metrics.upiRupees.toStringAsFixed(2)}',
                              subtitle: 'Settled to Bank',
                              color: Colors.blue.shade700,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _MetricCard(
                              title: 'Khata Credit',
                              value: '₹${metrics.khataRupees.toStringAsFixed(2)}',
                              subtitle: 'Extended Today',
                              color: Colors.amber.shade800,
                            ),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),

              const SizedBox(height: 24),

              // Low Stock Alert Section
              Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 20),
                  const SizedBox(width: 6),
                  const Text('Low Stock Alerts (< 5 units)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const Spacer(),
                  Text('${lowStockItems.length} items', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                ],
              ),
              const SizedBox(height: 8),
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                  side: BorderSide(color: Colors.grey.shade200),
                ),
                child: lowStockItems.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(
                          child: Text(
                            '✅ All inventory products have sufficient stock levels.',
                            style: TextStyle(fontSize: 12, color: Colors.green, fontWeight: FontWeight.w500),
                          ),
                        ),
                      )
                    : ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: lowStockItems.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (ctx, i) {
                          final item = lowStockItems[i];
                          return ListTile(
                            dense: true,
                            title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            subtitle: Text('SKU: ${item.sku} | Price: ₹${item.sellingPriceRupees.toStringAsFixed(1)}'),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '${item.currentStock.toInt()} left',
                                style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ),
                          );
                        },
                      ),
              ),

              const SizedBox(height: 24),

              // Khata Ledger Section
              Row(
                children: [
                  const Icon(Icons.book_outlined, color: Colors.indigo, size: 20),
                  const SizedBox(width: 6),
                  const Text('Customer Khata Balances', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const Spacer(),
                  Text(
                    'Total Due: ₹${totalKhataDueRupees.toStringAsFixed(2)}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.red),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                  side: BorderSide(color: Colors.grey.shade200),
                ),
                child: customers.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(
                          child: Text(
                            'No Khata credit accounts registered yet.',
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                        ),
                      )
                    : ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: customers.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (ctx, i) {
                          final c = customers[i];
                          return ListTile(
                            dense: true,
                            title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            subtitle: Text('Phone: ${c.phone} | Limit: ₹${c.creditLimitRupees.toStringAsFixed(0)}'),
                            trailing: Text(
                              '₹${c.currentBalanceRupees.toStringAsFixed(1)}',
                              style: TextStyle(
                                color: c.currentBalancePaisa > 0 ? Colors.red : Colors.green.shade700,
                                fontWeight: FontWeight.w900,
                                fontSize: 14,
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
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final Color color;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: color)),
          const SizedBox(height: 2),
          Text(subtitle, style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
        ],
      ),
    );
  }
}
