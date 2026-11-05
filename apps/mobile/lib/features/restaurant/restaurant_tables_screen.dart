import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/restaurant_provider.dart';
import 'table_order_sheet.dart';

class RestaurantTablesScreen extends ConsumerWidget {
  const RestaurantTablesScreen({super.key});

  void _openTableOrder(BuildContext context, RestaurantTable table) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => TableOrderSheet(table: table),
    );
  }

  Color _getStatusColor(TableStatus status) {
    switch (status) {
      case TableStatus.vacant:
        return const Color(0xFF10B981); // Emerald
      case TableStatus.occupied:
        return const Color(0xFFF59E0B); // Amber
      case TableStatus.billed:
        return const Color(0xFF0284C7); // Sky Blue
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final restState = ref.watch(restaurantProvider);
    final notifier = ref.read(restaurantProvider.notifier);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.table_restaurant, color: Color(0xFF10B981), size: 22),
            SizedBox(width: 8),
            Text(
              'Restaurant Tables & KOT',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Metrics Header Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.green.shade100),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Occupied Tables', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        const SizedBox(height: 2),
                        Text(
                          '${restState.occupiedCount} / ${restState.tables.length}',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.amber.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Active Dine-In Bill', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        const SizedBox(height: 2),
                        Text(
                          '₹${(restState.totalDineInRunningPaisa / 100).toStringAsFixed(2)}',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.amber.shade900),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Section Chips Filter
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: restState.sections.map((sec) {
                final isSelected = restState.selectedSection == sec;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(sec, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : Colors.black87)),
                    selected: isSelected,
                    selectedColor: const Color(0xFF10B981),
                    backgroundColor: Colors.white,
                    side: BorderSide(color: isSelected ? const Color(0xFF10B981) : Colors.grey.shade300),
                    onSelected: (_) => notifier.selectSection(sec),
                  ),
                );
              }).toList(),
            ),
          ),

          // Table Cards Grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.15,
              ),
              itemCount: restState.filteredTables.length,
              itemBuilder: (ctx, idx) {
                final table = restState.filteredTables[idx];
                final statusColor = _getStatusColor(table.status);
                final isOccupied = table.status != TableStatus.vacant;

                return InkWell(
                  key: Key('table_card_${table.id}'),
                  onTap: () => _openTableOrder(context, table),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isOccupied ? statusColor : Colors.grey.shade200,
                        width: isOccupied ? 1.5 : 1.0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isOccupied ? statusColor.withOpacity(0.08) : Colors.black.withOpacity(0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              table.name,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                table.status.label,
                                style: TextStyle(
                                  color: statusColor,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '${table.section} • ${table.capacity} Seats',
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                        const Divider(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isOccupied ? '${table.itemCount} Items' : 'Available',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isOccupied ? Colors.black87 : Colors.grey,
                                  ),
                                ),
                                if (isOccupied)
                                  Text(
                                    '₹${(table.runningTotalPaisa / 100).toStringAsFixed(1)}',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: statusColor,
                                    ),
                                  ),
                              ],
                            ),
                            Icon(
                              Icons.arrow_forward_ios,
                              size: 13,
                              color: Colors.grey.shade400,
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
