import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/restaurant_provider.dart';
import '../../core/theme/shadcn_colors.dart';
import '../../core/theme/shadcn_typography.dart';
import '../../core/widgets/shadcn_app_bar.dart';
import '../../core/widgets/shadcn_badge.dart';
import '../../core/widgets/shadcn_button.dart';
import '../../core/widgets/shadcn_card.dart';
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

  ShadcnBadgeVariant _getBadgeVariant(TableStatus status) {
    switch (status) {
      case TableStatus.vacant:
        return ShadcnBadgeVariant.success;
      case TableStatus.occupied:
        return ShadcnBadgeVariant.warning;
      case TableStatus.billed:
        return ShadcnBadgeVariant.secondary;
      case TableStatus.dirty:
        return ShadcnBadgeVariant.destructive;
    }
  }

  Color _getStatusAccentColor(TableStatus status) {
    switch (status) {
      case TableStatus.vacant:
        return ShadcnColors.primary;
      case TableStatus.occupied:
        return ShadcnColors.warning;
      case TableStatus.billed:
        return ShadcnColors.info;
      case TableStatus.dirty:
        return ShadcnColors.destructive;
    }
  }

  String _formatElapsed(DateTime? seatedAt) {
    if (seatedAt == null) return '';
    final diff = DateTime.now().difference(seatedAt);
    if (diff.inMinutes < 1) return 'Just seated';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    return '${diff.inHours}h ${diff.inMinutes % 60}m';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final restState = ref.watch(restaurantProvider);
    final notifier = ref.read(restaurantProvider.notifier);

    return Scaffold(
      backgroundColor: ShadcnColors.background,
      appBar: const ShadcnAppBar(),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Metrics KPI Header Strip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: ShadcnColors.surface,
              border: Border(bottom: BorderSide(color: ShadcnColors.border, width: 1.0)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: ShadcnColors.card,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: ShadcnColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: ShadcnColors.primary,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text('Occupied Tables', style: ShadcnTypography.caption),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${restState.occupiedCount} / ${restState.tables.length}',
                          style: ShadcnTypography.h3.copyWith(
                            color: restState.occupiedCount > 0 ? ShadcnColors.primary : ShadcnColors.foreground,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: ShadcnColors.card,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: ShadcnColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: ShadcnColors.warning,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text('Active Dine-In', style: ShadcnTypography.caption),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '₹${(restState.totalDineInRunningPaisa / 100).toStringAsFixed(2)}',
                          style: ShadcnTypography.h3.copyWith(
                            color: restState.totalDineInRunningPaisa > 0 ? ShadcnColors.warning : ShadcnColors.foreground,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: ShadcnColors.card,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: ShadcnColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: ShadcnColors.info,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text('Active Diners', style: ShadcnTypography.caption),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${restState.activeDinersCount}',
                          style: ShadcnTypography.h3.copyWith(color: ShadcnColors.info),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Section Chips Filter
          Container(
            color: ShadcnColors.surface,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: restState.sections.map((sec) {
                  final isSelected = restState.selectedSection == sec;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => notifier.selectSection(sec),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: isSelected ? ShadcnColors.primary : ShadcnColors.card,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected ? ShadcnColors.primary : ShadcnColors.border,
                            width: 1.0,
                          ),
                        ),
                        child: Text(
                          sec,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            color: isSelected ? Colors.white : ShadcnColors.mutedForeground,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          const Divider(height: 1, color: ShadcnColors.border),

          // Table Cards Grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.95,
              ),
              itemCount: restState.filteredTables.length,
              itemBuilder: (ctx, idx) {
                final table = restState.filteredTables[idx];
                final isOccupied = table.status == TableStatus.occupied || table.status == TableStatus.billed;
                final isDirty = table.status == TableStatus.dirty;
                final accentColor = _getStatusAccentColor(table.status);

                return ShadcnCard(
                  key: Key('table_card_${table.id}'),
                  padding: const EdgeInsets.all(12),
                  borderColor: isOccupied
                      ? accentColor.withOpacity(0.4)
                      : isDirty
                          ? ShadcnColors.destructive.withOpacity(0.3)
                          : ShadcnColors.border,
                  backgroundColor: isOccupied
                      ? accentColor.withOpacity(0.02)
                      : isDirty
                          ? ShadcnColors.destructive.withOpacity(0.02)
                          : ShadcnColors.surface,
                  onTap: () {
                    if (isDirty) {
                      _showCleanDialog(context, notifier, table);
                    } else {
                      _openTableOrder(context, table);
                    }
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Top Row: Table Name & Status Badge
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              table.name,
                              style: ShadcnTypography.bodySemibold.copyWith(fontSize: 15),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          ShadcnBadge(
                            text: table.status.label,
                            variant: _getBadgeVariant(table.status),
                          ),
                        ],
                      ),

                      // Section & Capacity Metadata
                      Row(
                        children: [
                          Icon(Icons.people_outline, size: 13, color: ShadcnColors.mutedForeground),
                          const SizedBox(width: 4),
                          Text(
                            '${table.capacity} seats • ${table.section}',
                            style: ShadcnTypography.caption,
                          ),
                        ],
                      ),

                      // Seated Elapsed Time if occupied
                      if (table.seatedAt != null)
                        Row(
                          children: [
                            Icon(Icons.access_time, size: 12, color: accentColor),
                            const SizedBox(width: 4),
                            Text(
                              _formatElapsed(table.seatedAt),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: accentColor,
                              ),
                            ),
                            if (table.currentGuestCount > 0) ...[
                              Text(' • ', style: TextStyle(color: ShadcnColors.mutedForeground)),
                              Text(
                                '${table.currentGuestCount} diners',
                                style: ShadcnTypography.caption,
                              ),
                            ],
                          ],
                        )
                      else if (isDirty)
                        Text(
                          'Awaiting busser clearing',
                          style: TextStyle(
                            fontSize: 11,
                            fontStyle: FontStyle.italic,
                            color: ShadcnColors.destructive,
                          ),
                        )
                      else
                        Text(
                          'Ready to seat',
                          style: TextStyle(
                            fontSize: 11,
                            color: ShadcnColors.mutedForeground,
                          ),
                        ),

                      const Divider(height: 8, color: ShadcnColors.border),

                      // Bottom Row: Total / Actions
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isOccupied
                                    ? '${table.itemCount} Items'
                                    : isDirty
                                        ? 'Needs Clean'
                                        : 'Vacant',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: isOccupied ? ShadcnColors.foreground : ShadcnColors.mutedForeground,
                                ),
                              ),
                              if (isOccupied)
                                Text(
                                  '₹${(table.runningTotalPaisa / 100).toStringAsFixed(1)}',
                                  style: ShadcnTypography.currency.copyWith(
                                    color: accentColor,
                                    fontSize: 15,
                                  ),
                                ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: isOccupied
                                  ? accentColor.withOpacity(0.1)
                                  : isDirty
                                      ? ShadcnColors.destructive.withOpacity(0.1)
                                      : ShadcnColors.secondary,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              isDirty
                                  ? Icons.cleaning_services_outlined
                                  : isOccupied
                                      ? Icons.receipt_long
                                      : Icons.add,
                              size: 16,
                              color: isOccupied
                                  ? accentColor
                                  : isDirty
                                      ? ShadcnColors.destructive
                                      : ShadcnColors.foreground,
                            ),
                          ),
                        ],
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

  void _showCleanDialog(BuildContext context, RestaurantNotifier notifier, RestaurantTable table) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ShadcnColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Row(
          children: [
            const Icon(Icons.cleaning_services_outlined, color: ShadcnColors.destructive, size: 20),
            const SizedBox(width: 8),
            Text('Clean ${table.name}?', style: ShadcnTypography.bodySemibold),
          ],
        ),
        content: Text(
          'Mark this table as cleaned and vacant for incoming diners.',
          style: ShadcnTypography.body,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: ShadcnColors.mutedForeground)),
          ),
          ShadcnButton(
            text: 'Mark Clean & Vacant',
            size: ShadcnButtonSize.sm,
            onPressed: () {
              notifier.markTableClean(table.id);
              Navigator.pop(ctx);
            },
          ),
        ],
      ),
    );
  }
}
