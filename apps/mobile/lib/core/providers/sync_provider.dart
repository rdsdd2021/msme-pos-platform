import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../database/app_database.dart';
import '../repositories/sync_repository.dart';
import '../services/offline_billing_service.dart';
import '../services/sync_worker.dart';
import 'auth_provider.dart';
import 'catalog_provider.dart';
import 'customer_provider.dart';
import 'restaurant_provider.dart';

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
  final int syncSequence;

  const SyncState({
    this.isSyncing = false,
    this.pendingCount = 0,
    this.lastSyncTime,
    this.lastError,
    this.status = SyncStatus.synced,
    this.syncSequence = 0,
  });

  bool get hasPending => pendingCount > 0;

  SyncState copyWith({
    bool? isSyncing,
    int? pendingCount,
    DateTime? lastSyncTime,
    String? lastError,
    SyncStatus? status,
    int? syncSequence,
  }) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      pendingCount: pendingCount ?? this.pendingCount,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      lastError: lastError,
      status: status ?? this.status,
      syncSequence: syncSequence ?? this.syncSequence,
    );
  }
}

class SyncNotifier extends StateNotifier<SyncState> {
  final SyncWorker _worker;
  final Ref _ref;
  Timer? _autoSyncTimer;
  bool _pendingSyncRequested = false;
  bool _isSyncInFlight = false;
  DateTime? _lastSyncCompletedAt;

  SyncNotifier(this._worker, this._ref) : super(const SyncState()) {
    refreshStatus();
    _startAutoSync();
  }

  void _startAutoSync() {
    _autoSyncTimer?.cancel();
    _autoSyncTimer = Timer.periodic(const Duration(seconds: 20), (_) async {
      final hasPending = await _worker.getPendingCount() > 0;
      if (hasPending || !_isSyncInFlight) {
        await syncNow(silent: true);
      }
    });
  }

  @override
  void dispose() {
    _autoSyncTimer?.cancel();
    super.dispose();
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

  Future<bool> syncNow({String? deviceId, bool silent = false}) async {
    if (_isSyncInFlight || state.isSyncing) {
      if (!silent) {
        _pendingSyncRequested = true;
      }
      return false;
    }

    // Cooldown: ignore silent echo-triggered syncs within 3s of previous completion when nothing is pending
    if (silent &&
        _lastSyncCompletedAt != null &&
        DateTime.now().difference(_lastSyncCompletedAt!) < const Duration(seconds: 3)) {
      final pending = await _worker.getPendingCount();
      if (pending == 0) {
        return true;
      }
    }

    _isSyncInFlight = true;
    if (!silent) {
      state = state.copyWith(isSyncing: true, lastError: null, status: SyncStatus.syncing);
    }

    final resolvedDeviceId = deviceId ?? await AppConfig.getDeviceId();
    final authState = _ref.read(authProvider);
    final tenantId = authState.activeMembership?.tenantId;
    if (tenantId == null) {
      // User is not authenticated with an active store membership yet
      _isSyncInFlight = false;
      if (!silent || state.isSyncing) {
        state = state.copyWith(isSyncing: false, status: SyncStatus.idle);
      }
      return false;
    }
    final branchId = authState.activeMembership?.branchId;

    try {
      final result = await _worker
          .synchronize(
            tenantId: tenantId,
            deviceId: resolvedDeviceId,
            branchId: branchId,
          )
          .timeout(const Duration(seconds: 15));

      final count = await _worker.getPendingCount();
      final lastTime = await _worker.getLastSyncTime();

      if (result.isSuccess) {
        final hasCatalogChanges =
            result.pulledProductsCount > 0 || result.pulledCategoriesCount > 0 || result.pushedCount > 0;
        final hasTableChanges = result.pulledRestaurantTablesCount > 0 || result.pushedCount > 0;
        final hasAnyChanges = hasCatalogChanges || hasTableChanges || result.pulledCustomersCount > 0;

        if (!silent || hasAnyChanges || count != state.pendingCount || state.status != SyncStatus.synced) {
          state = state.copyWith(
            isSyncing: false,
            pendingCount: count,
            lastSyncTime: lastTime,
            status: SyncStatus.synced,
            lastError: null,
            syncSequence: hasAnyChanges ? state.syncSequence + 1 : state.syncSequence,
          );
        }

        // Only reload local providers when relevant delta data actually changed
        if (hasCatalogChanges) {
          await _ref.read(catalogProvider.notifier).reload(
                tenantId,
                result.pulledCategoriesCount > 0,
              );
        }
        if (result.pulledCustomersCount > 0) {
          await _ref.read(customerProvider.notifier).reload();
        }
        if (hasTableChanges) {
          await _ref.read(restaurantProvider.notifier).refreshFromDb();
        }

        _lastSyncCompletedAt = DateTime.now();
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
    } finally {
      _isSyncInFlight = false;
      if (state.isSyncing) {
        state = state.copyWith(isSyncing: false);
      }
      if (_pendingSyncRequested) {
        _pendingSyncRequested = false;
        Future.microtask(() => syncNow(deviceId: deviceId, silent: true));
      }
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
