import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../providers/auth_provider.dart';
import '../providers/catalog_provider.dart';
import '../providers/customer_provider.dart';
import '../providers/restaurant_provider.dart';
import '../providers/sync_provider.dart';

class RealtimeSyncService {
  final Ref _ref;
  final Dio _dio;
  StreamSubscription? _subscription;
  Timer? _reconnectTimer;
  Timer? _watchdogTimer;
  bool _isDisposed = false;
  bool _isConnecting = false;

  RealtimeSyncService(this._ref)
      : _dio = Dio(
          BaseOptions(
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(days: 1), // Long-lived stream
          ),
        );

  void start() {
    _isDisposed = false;
    _connect();
  }

  void stop() {
    _isDisposed = true;
    _watchdogTimer?.cancel();
    _reconnectTimer?.cancel();
    _subscription?.cancel();
    _subscription = null;
  }

  void reconnect() {
    if (_isDisposed) return;
    debugPrint('[RealtimeSync] Manual reconnect requested');
    _watchdogTimer?.cancel();
    _subscription?.cancel();
    _subscription = null;
    _isConnecting = false;
    _scheduleReconnect(const Duration(milliseconds: 300));
  }

  void _resetWatchdog() {
    _watchdogTimer?.cancel();
    if (_isDisposed) return;
    // Server emits HEARTBEAT every 15s. If no line received within 45s, connection is stale/dead.
    _watchdogTimer = Timer(const Duration(seconds: 45), () {
      debugPrint('[RealtimeSync] Watchdog timed out (no heartbeat for 45s). Reconnecting...');
      reconnect();
    });
  }

  Future<void> _connect() async {
    if (_isDisposed || _isConnecting) return;
    _isConnecting = true;

    try {
      final authRepo = _ref.read(authRepositoryProvider);
      var token = await authRepo.getAccessToken();
      final authState = _ref.read(authProvider);
      final tenantId = authState.activeMembership?.tenantId;

      if (token == null || tenantId == null) {
        // Try refreshing tokens once in case memory token cleared
        try {
          await authRepo.refreshTokens();
          token = await authRepo.getAccessToken();
        } catch (_) {}
      }

      if (token == null || tenantId == null) {
        _isConnecting = false;
        _scheduleReconnect(const Duration(seconds: 5));
        return;
      }

      final serverUrl = await AppConfig.getServerUrl();
      final url = '$serverUrl/api/v1/tenants/$tenantId/events?token=${Uri.encodeComponent(token)}';

      final response = await _dio.get<ResponseBody>(
        url,
        options: Options(
          responseType: ResponseType.stream,
          headers: {
            'Authorization': 'Bearer $token',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        ),
      );

      _isConnecting = false;
      _resetWatchdog();

      _subscription = response.data?.stream
          .cast<List<int>>()
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .listen(
        (line) {
          _handleLine(line);
        },
        onError: (err) async {
          debugPrint('[RealtimeSync] Stream error: $err');
          _watchdogTimer?.cancel();
          try {
            await authRepo.refreshTokens();
          } catch (_) {}
          _scheduleReconnect(const Duration(seconds: 5));
        },
        onDone: () async {
          debugPrint('[RealtimeSync] Stream closed by server');
          _watchdogTimer?.cancel();
          _scheduleReconnect(const Duration(seconds: 5));
        },
        cancelOnError: true,
      );
    } catch (e) {
      _isConnecting = false;
      _watchdogTimer?.cancel();
      debugPrint('[RealtimeSync] Connect error: $e');
      // If error is 401 Unauthorized, refresh tokens before retrying
      if (e is DioException && e.response?.statusCode == 401) {
        try {
          final authRepo = _ref.read(authRepositoryProvider);
          await authRepo.refreshTokens();
        } catch (_) {}
      }
      _scheduleReconnect(const Duration(seconds: 8));
    }
  }

  void _handleLine(String line) {
    _resetWatchdog();
    if (!line.startsWith('data:')) return;
    final jsonStr = line.replaceFirst('data:', '').trim();
    if (jsonStr.isEmpty) return;

    try {
      final map = jsonDecode(jsonStr) as Map<String, dynamic>;
      final type = map['type'] as String?;

      if (type == null || type == 'HEARTBEAT') return;

      debugPrint('[RealtimeSync] Received server event: $type');

      // Trigger instantaneous UI refresh and silent background delta sync
      if (type == 'CATALOG_CHANGED' || type == 'STOCK_CHANGED') {
        _ref.read(syncStateProvider.notifier).syncNow(silent: true);
      } else if (type == 'RESTAURANT_TABLE_CHANGED' ||
          type == 'KOT_CREATED' ||
          type == 'KOT_STATUS_CHANGED' ||
          type == 'ORDER_CREATED') {
        _ref.read(syncStateProvider.notifier).syncNow(silent: true);
      } else if (type == 'CUSTOMER_UPDATED') {
        _ref.read(syncStateProvider.notifier).syncNow(silent: true);
      } else if (type == 'RESTAURANT_SETTINGS_CHANGED') {
        _ref.read(syncStateProvider.notifier).syncNow(silent: true);
      } else {
        _ref.read(syncStateProvider.notifier).syncNow(silent: true);
      }
    } catch (e) {
      debugPrint('[RealtimeSync] JSON parse error: $e');
    }
  }

  void _scheduleReconnect(Duration delay) {
    if (_isDisposed) return;
    _watchdogTimer?.cancel();
    _subscription?.cancel();
    _subscription = null;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(delay, () {
      _connect();
    });
  }
}

final realtimeSyncServiceProvider = Provider<RealtimeSyncService>((ref) {
  final service = RealtimeSyncService(ref);
  service.start();
  ref.onDispose(() => service.stop());
  return service;
});

