import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../database/app_database.dart';
import '../repositories/sync_repository.dart';
import '../services/offline_billing_service.dart';
import '../services/sync_worker.dart';
import 'auth_provider.dart';
import 'catalog_provider.dart';
import 'customer_provider.dart';

enum SyncStatus {
  idle,
  syncing,
  synced,
  offline,
  error,
}

class SyncState {
  final bool isSyncing;
  final int pendingCount;
  final DateTime? lastSyncTime;
  final String? lastError;
  final SyncStatus status;

  const SyncState({
    this.isSyncing = false,
    this.pendingCount = 0,
    this.lastSyncTime,
    this.lastError,
    this.status = SyncStatus.synced,
  });

  bool get hasPending => pendingCount > 0;

  SyncState copyWith({
    bool? isSyncing,
    int? pendingCount,
    DateTime? lastSyncTime,
    String? lastError,
    SyncStatus? status,
  }) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      pendingCount: pendingCount ?? this.pendingCount,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      lastError: lastError,
      status: status ?? this.status,
    );
  }
}

class SyncNotifier extends StateNotifier<SyncState> {
  final SyncWorker _worker;
  final Ref _ref;

  SyncNotifier(this._worker, this._ref) : super(const SyncState()) {
    refreshStatus();
  }

  Future<void> refreshStatus() async {
    final count = await _worker.getPendingCount();
    final lastTime = await _worker.getLastSyncTime();
    state = state.copyWith(
      pendingCount: count,
      lastSyncTime: lastTime,
      status: count > 0 ? SyncStatus.idle : SyncStatus.synced,
    );
  }

  Future<bool> syncNow({String? deviceId}) async {
    if (state.isSyncing) return false;

    state = state.copyWith(isSyncing: true, lastError: null, status: SyncStatus.syncing);

    final resolvedDeviceId = deviceId ?? await AppConfig.getDeviceId();
    final authState = _ref.read(authProvider);
    final tenantId = authState.activeMembership?.tenantId ?? 'tenant-1';

    try {
      final result = await _worker.synchronize(
        tenantId: tenantId,
        deviceId: resolvedDeviceId,
      );

      final count = await _worker.getPendingCount();
      final lastTime = await _worker.getLastSyncTime();

      if (result.isSuccess) {
        state = state.copyWith(
          isSyncing: false,
          pendingCount: count,
          lastSyncTime: lastTime,
          status: SyncStatus.synced,
          lastError: null,
        );

        // Instantly reload local catalog and customer lists if deltas were pulled
        if (result.pulledProductsCount > 0) {
          await _ref.read(catalogProvider.notifier).reload();
        }
        if (result.pulledCustomersCount > 0) {
          await _ref.read(customerProvider.notifier).reload();
        }

        return true;
      } else {
        state = state.copyWith(
          isSyncing: false,
          pendingCount: count,
          lastError: result.error,
          status: result.error?.contains('Network') == true || result.error?.contains('Socket') == true
              ? SyncStatus.offline
              : SyncStatus.error,
        );
        return false;
      }
    } catch (e) {
      final count = await _worker.getPendingCount();
      state = state.copyWith(
        isSyncing: false,
        pendingCount: count,
        lastError: e.toString(),
        status: SyncStatus.offline,
      );
      return false;
    }
  }
}

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  return OfflineBillingService.database;
});

final syncRepositoryProvider = Provider<SyncRepository>((ref) {
  final authRepo = ref.watch(authRepositoryProvider);
  return SyncRepository(authRepo: authRepo);
});

final syncWorkerProvider = Provider<SyncWorker>((ref) {
  final db = ref.watch(appDatabaseProvider);
  final repo = ref.watch(syncRepositoryProvider);
  return SyncWorker(db: db, syncRepo: repo);
});

final syncStateProvider = StateNotifierProvider<SyncNotifier, SyncState>((ref) {
  final worker = ref.watch(syncWorkerProvider);
  return SyncNotifier(worker, ref);
});
