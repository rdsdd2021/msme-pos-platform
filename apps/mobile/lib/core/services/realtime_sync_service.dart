import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../providers/auth_provider.dart';
import '../providers/sync_provider.dart';

class RealtimeSyncService {
  final Ref _ref;
  final Dio _dio;
  StreamSubscription? _subscription;
  Timer? _reconnectTimer;
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
    _reconnectTimer?.cancel();
    _subscription?.cancel();
    _subscription = null;
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
          try {
            await authRepo.refreshTokens();
          } catch (_) {}
          _scheduleReconnect(const Duration(seconds: 5));
        },
        onDone: () async {
          debugPrint('[RealtimeSync] Stream closed by server');
          _scheduleReconnect(const Duration(seconds: 5));
        },
        cancelOnError: true,
      );
    } catch (e) {
      _isConnecting = false;
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
    if (!line.startsWith('data:')) return;
    final jsonStr = line.replaceFirst('data:', '').trim();
    if (jsonStr.isEmpty) return;

    try {
      final map = jsonDecode(jsonStr) as Map<String, dynamic>;
      final type = map['type'] as String?;

      if (type == null || type == 'HEARTBEAT') return;

      debugPrint('[RealtimeSync] Received server event: $type');

      // Trigger automatic background delta sync to update Drift SQLite and UI
      if (type == 'CATALOG_CHANGED' ||
          type == 'STOCK_CHANGED' ||
          type == 'ORDER_CREATED' ||
          type == 'CUSTOMER_UPDATED' ||
          type == 'RESTAURANT_TABLE_CHANGED' ||
          type == 'KOT_CREATED' ||
          type == 'KOT_STATUS_CHANGED' ||
          type == 'RESTAURANT_SETTINGS_CHANGED') {
        _ref.read(syncStateProvider.notifier).syncNow();
      }
    } catch (e) {
      debugPrint('[RealtimeSync] JSON parse error: $e');
    }
  }

  void _scheduleReconnect(Duration delay) {
    if (_isDisposed) return;
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

