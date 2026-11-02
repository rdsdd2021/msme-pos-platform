import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models/customer.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/catalog_provider.dart';

class MobileOwnerScreen extends ConsumerWidget {
  const MobileOwnerScreen({super.key});

  final List<Customer> _sampleCustomers = const [
    Customer(
      id: 'c-1',
      name: 'Ramesh Sharma',
      phone: '+919876543210',
      creditLimitPaisa: 500000,
      currentBalancePaisa: 125000,
    ),
    Customer(
      id: 'c-2',
      name: 'Pooja Verma',
      phone: '+919876543211',
      creditLimitPaisa: 300000,
      currentBalancePaisa: 42000,
    ),
  ];

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
    final lowStockItems = initialProducts.where((p) => p.isLowStock).toList();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        title: const Text('Store Owner Analytics', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            key: const Key('owner_logout_btn'),
            icon: const Icon(Icons.logout, size: 20),
            tooltip: 'Sign Out',
            onPressed: () => _confirmLogout(context, ref),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Store Title & Date
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
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: const Text('Live Sync Active', style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Metrics Cards
            Row(
              children: [
                Expanded(
                  child: _MetricCard(
                    title: 'Gross Sales',
                    value: '₹4,850.00',
                    subtitle: '18 Bills Generated',
                    color: Colors.indigo.shade700,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _MetricCard(
                    title: 'Cash In Register',
                    value: '₹2,450.00',
                    subtitle: 'Drawer Match OK',
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
                    value: '₹2,150.00',
                    subtitle: 'Settled to Bank',
                    color: Colors.blue.shade700,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _MetricCard(
                    title: 'Khata Credit',
                    value: '₹250.00',
                    subtitle: 'Pending Collection',
                    color: Colors.amber.shade800,
                  ),
                ),
              ],
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
              child: ListView.separated(
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
            const Row(
              children: [
                Icon(Icons.book_outlined, color: Colors.indigo, size: 20),
                SizedBox(width: 6),
                Text('Customer Khata Balances', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                Spacer(),
                Text('Total Due: ₹1,670.00', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.red)),
              ],
            ),
            const SizedBox(height: 8),
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _sampleCustomers.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (ctx, i) {
                  final c = _sampleCustomers[i];
                  return ListTile(
                    dense: true,
                    title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    subtitle: Text('Phone: ${c.phone} | Limit: ₹${c.creditLimitRupees.toStringAsFixed(0)}'),
                    trailing: Text(
                      '₹${c.currentBalanceRupees.toStringAsFixed(1)}',
                      style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w900, fontSize: 14),
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
