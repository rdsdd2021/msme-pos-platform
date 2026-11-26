import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/restaurant_provider.dart';
import '../../core/providers/sync_provider.dart';
import '../../core/theme/shadcn_colors.dart';
import '../../core/theme/shadcn_typography.dart';
import '../../core/widgets/shadcn_app_bar.dart';
import '../../core/widgets/shadcn_badge.dart';
import '../../core/widgets/shadcn_button.dart';
import '../../core/widgets/shadcn_card.dart';
import 'table_order_sheet.dart';
import '../settings/store_settings_sheet.dart';
import 'widgets/restaurant_menu_sheet.dart';

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
      case TableStatus.seated:
        return ShadcnBadgeVariant.warning;
      case TableStatus.ordered:
        return ShadcnBadgeVariant.defaultVariant;
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
      case TableStatus.seated:
        return ShadcnColors.warning;
      case TableStatus.ordered:
        return const Color(0xFFF97316);
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

          // Always-visible Quick Action Bar (Add Table, New Takeaway, Bill & Store Settings)
          Container(
            color: ShadcnColors.surface,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    key: const Key('new_takeaway_order_btn'),
                    onTap: () async {
                      final tk = await notifier.createTakeawayToken();
                      if (context.mounted) {
                        _openTableOrder(context, tk);
                      }
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                      decoration: BoxDecoration(
                        color: ShadcnColors.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.takeout_dining, size: 15, color: Colors.white),
                          SizedBox(width: 6),
                          Text(
                            'New Takeaway',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  key: const Key('add_restaurant_table_top_btn'),
                  onTap: () => _showAddEditTableDialog(context, notifier),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                    decoration: BoxDecoration(
                      color: ShadcnColors.card,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: ShadcnColors.border),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.add, size: 15, color: ShadcnColors.primary),
                        SizedBox(width: 4),
                        Text(
                          'Add Table',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: ShadcnColors.foreground),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  key: const Key('open_bill_settings_btn'),
                  onTap: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (ctx) => const StoreSettingsSheet(),
                    );
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                    decoration: BoxDecoration(
                      color: ShadcnColors.card,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: ShadcnColors.border),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.receipt_long_outlined, size: 15, color: ShadcnColors.mutedForeground),
                        SizedBox(width: 4),
                        Text(
                          'Bill Setup',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: ShadcnColors.foreground),
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
                children: [
                  ...restState.sections.map((sec) {
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
                }),
                const SizedBox(width: 4),
                InkWell(
                  key: const Key('open_restaurant_menu_btn'),
                  onTap: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (ctx) => const RestaurantMenuSheet(),
                    );
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: ShadcnColors.warning.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: ShadcnColors.warning.withOpacity(0.5),
                        width: 1.0,
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.restaurant_menu, size: 14, color: ShadcnColors.warning),
                        SizedBox(width: 5),
                        Text(
                          'Menu & Dishes',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: ShadcnColors.warning,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  key: const Key('add_restaurant_table_btn'),
                  onTap: () => _showAddEditTableDialog(context, notifier),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: ShadcnColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: ShadcnColors.primary.withOpacity(0.45),
                        width: 1.0,
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.add, size: 14, color: ShadcnColors.primary),
                        SizedBox(width: 4),
                        Text(
                          'Add Table',
                          style: TextStyle(
                            fontSize: 12,
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
            ),
          ),

          const Divider(height: 1, color: ShadcnColors.border),

          // Table Cards Grid with Pull-to-Refresh
          Expanded(
            child: RefreshIndicator(
              color: ShadcnColors.primary,
              onRefresh: () async {
                await ref.read(syncStateProvider.notifier).syncNow();
                await notifier.refreshFromDb();
              },
              child: restState.filteredTables.isEmpty
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(24),
                      children: [
                        const SizedBox(height: 36),
                        Center(
                          child: Column(
                            children: [
                              const Icon(Icons.takeout_dining_outlined, size: 48, color: ShadcnColors.mutedForeground),
                              const SizedBox(height: 12),
                              Text(
                                restState.hasDiningTables ? 'No tables in this section' : 'Takeaway / Counter Mode',
                                style: ShadcnTypography.h3,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                restState.hasDiningTables
                                    ? 'Tap "+ Add Table" above or switch sections.'
                                    : 'Dining tables are turned OFF. Tap "New Takeaway" to create a token order.',
                                textAlign: TextAlign.center,
                                style: ShadcnTypography.caption,
                              ),
                              const SizedBox(height: 16),
                              ShadcnButton(
                                text: '+ New Takeaway Order',
                                onPressed: () async {
                                  final tk = await notifier.createTakeawayToken();
                                  if (context.mounted) {
                                    _openTableOrder(context, tk);
                                  }
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                  : GridView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
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
                final isOccupied = table.status.isOccupied || table.status == TableStatus.billed;
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
                      // Top Row: Table Name, Status Badge & Edit/Delete Menu
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
                          SizedBox(
                            width: 24,
                            height: 24,
                            child: PopupMenuButton<String>(
                              padding: EdgeInsets.zero,
                              icon: const Icon(Icons.more_vert, size: 16, color: ShadcnColors.mutedForeground),
                              onSelected: (val) {
                                if (val == 'edit') {
                                  _showAddEditTableDialog(context, notifier, existing: table);
                                } else if (val == 'delete') {
                                  _showDeleteTableDialog(context, notifier, table);
                                }
                              },
                              itemBuilder: (ctx) => [
                                const PopupMenuItem(
                                  value: 'edit',
                                  child: Row(
                                    children: [
                                      Icon(Icons.edit_outlined, size: 16),
                                      SizedBox(width: 8),
                                      Text('Edit Table'),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem(
                                  value: 'delete',
                                  child: Row(
                                    children: [
                                      Icon(Icons.delete_outline, size: 16, color: ShadcnColors.destructive),
                                      SizedBox(width: 8),
                                      Text('Delete Table', style: TextStyle(color: ShadcnColors.destructive)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
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
                                  '₹${((restState.isGstEnabled ? table.runningTotalPaisa : table.subtotalPaisa) / 100).toStringAsFixed(1)}',
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

  void _showAddEditTableDialog(
    BuildContext context,
    RestaurantNotifier notifier, {
    RestaurantTable? existing,
  }) {
    final isEdit = existing != null;
    final numCtrl = TextEditingController(text: existing?.tableNumber ?? existing?.id ?? '');
    final nameCtrl = TextEditingController(text: existing?.name ?? '');
    final sectionCtrl = TextEditingController(text: existing?.section ?? 'Main Dining');
    final capCtrl = TextEditingController(text: (existing?.capacity ?? 4).toString());
    bool isSaving = false;
    String? errorMsg;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: ShadcnColors.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: Text(isEdit ? 'Edit Table' : 'Add New Table', style: ShadcnTypography.h3),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (errorMsg != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Text(
                      errorMsg!,
                      style: const TextStyle(color: ShadcnColors.destructive, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                TextField(
                  controller: numCtrl,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                    labelText: 'Table Code / Number *',
                    hintText: 'e.g. T-09, AC-05, TR-03',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Display Name (Optional)',
                    hintText: 'e.g. Table 9 (Garden)',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: sectionCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Floor / Section *',
                    hintText: 'e.g. Main Dining, AC Hall, Terrace',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: capCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Seating Capacity *',
                    hintText: 'e.g. 4',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isSaving ? null : () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: ShadcnColors.primary,
                foregroundColor: Colors.white,
              ),
              onPressed: isSaving
                  ? null
                  : () async {
                      final code = numCtrl.text.trim().toUpperCase();
                      final sec = sectionCtrl.text.trim();
                      final cap = int.tryParse(capCtrl.text.trim()) ?? 4;
                      if (code.isEmpty) {
                        setDialogState(() => errorMsg = 'Table code is required.');
                        return;
                      }
                      setDialogState(() {
                        isSaving = true;
                        errorMsg = null;
                      });
                      try {
                        if (isEdit) {
                          await notifier.editTable(
                            tableId: existing.id,
                            tableNumber: code,
                            tableName: nameCtrl.text.trim(),
                            section: sec.isNotEmpty ? sec : 'Main Dining',
                            capacity: cap > 0 ? cap : 4,
                          );
                        } else {
                          await notifier.addTable(
                            tableNumber: code,
                            tableName: nameCtrl.text.trim(),
                            section: sec.isNotEmpty ? sec : 'Main Dining',
                            capacity: cap > 0 ? cap : 4,
                          );
                        }
                        if (ctx.mounted) Navigator.pop(ctx);
                      } catch (e) {
                        setDialogState(() {
                          isSaving = false;
                          errorMsg = e.toString().replaceFirst('Exception: ', '');
                        });
                      }
                    },
              child: Text(isSaving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Table')),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteTableDialog(BuildContext context, RestaurantNotifier notifier, RestaurantTable table) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ShadcnColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Row(
          children: [
            const Icon(Icons.delete_outline, color: ShadcnColors.destructive, size: 20),
            const SizedBox(width: 8),
            Expanded(child: Text('Delete ${table.name}?', style: ShadcnTypography.bodySemibold)),
          ],
        ),
        content: Text(
          table.status == TableStatus.vacant
              ? 'This will remove "${table.name}" from your dining floorplan.'
              : 'This table is currently ${table.status.label}. Clear or settle the active order before deleting.',
          style: ShadcnTypography.body,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: ShadcnColors.mutedForeground)),
          ),
          if (table.status == TableStatus.vacant)
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: ShadcnColors.destructive,
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                try {
                  await notifier.deleteTable(table.id);
                  if (ctx.mounted) Navigator.pop(ctx);
                } catch (e) {
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(e.toString().replaceFirst('Exception: ', '')),
                        backgroundColor: ShadcnColors.destructive,
                      ),
                    );
                  }
                }
              },
              child: const Text('Delete'),
            ),
        ],
      ),
    );
  }
}
