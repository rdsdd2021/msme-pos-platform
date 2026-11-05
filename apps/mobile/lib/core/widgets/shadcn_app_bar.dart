import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../providers/printer_provider.dart';
import '../providers/sync_provider.dart';
import '../theme/shadcn_colors.dart';
import '../theme/shadcn_typography.dart';

/// Unified commercial Shadcn Top App Bar.
class ShadcnAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final VoidCallback? onPrinterTap;
  final VoidCallback? onSyncTap;

  const ShadcnAppBar({
    super.key,
    this.onPrinterTap,
    this.onSyncTap,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60.0);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final printerState = ref.watch(printerProvider);
    final syncState = ref.watch(syncStateProvider);

    final storeName = authState.activeMembership?.tenantName ?? 'Kirana Supermart';
    final branchName = authState.activeBranchId ?? 'Main Store';
    final isPrinterConnected = printerState.isReady;
    final pendingCount = syncState.pendingCount;

    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        left: 16,
        right: 16,
        bottom: 8,
      ),
      decoration: const BoxDecoration(
        color: ShadcnColors.surface,
        border: Border(
          bottom: BorderSide(color: ShadcnColors.border, width: 1.0),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Store branding
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        storeName,
                        style: ShadcnTypography.h3.copyWith(fontSize: 16),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    // Online pulsating dot
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: ShadcnColors.success,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ),
                Text(
                  branchName,
                  style: ShadcnTypography.caption.copyWith(fontSize: 11),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          // Hardware Printer Pill
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onPrinterTap,
              borderRadius: BorderRadius.circular(6),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isPrinterConnected
                      ? ShadcnColors.successLight
                      : ShadcnColors.secondary,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: isPrinterConnected
                        ? ShadcnColors.success.withOpacity(0.3)
                        : ShadcnColors.border,
                    width: 1.0,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.print_outlined,
                      size: 14,
                      color: isPrinterConnected
                          ? ShadcnColors.successForeground
                          : ShadcnColors.mutedForeground,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isPrinterConnected ? '58mm Ready' : 'Printer',
                      style: ShadcnTypography.caption.copyWith(
                        color: isPrinterConnected
                            ? ShadcnColors.successForeground
                            : ShadcnColors.mutedForeground,
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // Sync Badge
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onSyncTap ?? () => ref.read(syncStateProvider.notifier).syncNow(),
              borderRadius: BorderRadius.circular(6),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: pendingCount > 0
                      ? ShadcnColors.warningLight
                      : ShadcnColors.secondary,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: pendingCount > 0
                        ? ShadcnColors.warning.withOpacity(0.4)
                        : ShadcnColors.border,
                    width: 1.0,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      pendingCount > 0
                          ? Icons.sync
                          : Icons.cloud_done_outlined,
                      size: 14,
                      color: pendingCount > 0
                          ? ShadcnColors.warningForeground
                          : ShadcnColors.mutedForeground,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      pendingCount > 0 ? '$pendingCount Sync' : 'Synced',
                      style: ShadcnTypography.caption.copyWith(
                        color: pendingCount > 0
                            ? ShadcnColors.warningForeground
                            : ShadcnColors.mutedForeground,
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // Logout Action
          IconButton(
            icon: const Icon(
              Icons.logout_rounded,
              size: 18,
              color: ShadcnColors.mutedForeground,
            ),
            tooltip: 'Logout',
            onPressed: () => _confirmLogout(context, ref),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ShadcnColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: ShadcnColors.border, width: 1),
        ),
        title: const Text('Sign Out', style: ShadcnTypography.h3),
        content: const Text(
          'Are you sure you want to sign out from this POS register?',
          style: ShadcnTypography.body,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: ShadcnColors.mutedForeground)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: ShadcnColors.destructive,
              foregroundColor: ShadcnColors.destructiveForeground,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}

