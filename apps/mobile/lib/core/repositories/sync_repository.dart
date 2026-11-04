import 'dart:convert';
import 'package:dio/dio.dart';
import '../database/app_database.dart';
import '../models/sync_models.dart';
import 'auth_repository.dart';

class SyncRepository {
  final Dio _dio;
  final AuthRepository _authRepo;
  String _baseUrl;

  SyncRepository({
    Dio? dio,
    required AuthRepository authRepo,
    String? baseUrl,
  })  : _dio = dio ?? Dio(),
        _authRepo = authRepo,
        _baseUrl = baseUrl ?? authRepo.baseUrl;

  String get baseUrl => _baseUrl;

  void updateBaseUrl(String newUrl) {
    _baseUrl = newUrl;
  }

  /// Register mobile POS device with backend tenant commercial fleet
  Future<void> registerDevice({
    required String tenantId,
    required String branchId,
    required String deviceIdentifier,
    String deviceName = 'Android POS Terminal',
  }) async {
    final token = await _authRepo.getAccessToken();
    try {
      await _dio.post(
        '$_baseUrl/api/v1/tenants/$tenantId/commercial/devices',
        data: {
          'branchId': branchId,
          'deviceIdentifier': deviceIdentifier,
          'deviceName': deviceName,
          'platform': 'android',
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          },
        ),
      );
    } catch (_) {
      // Non-blocking: device will also auto-provision on sync push if required
    }
  }

  /// Ingest a batch of offline mutations via POST /api/v1/tenants/:tenantId/sync/push
  Future<SyncPushResult> pushBatch(
    String tenantId,
    String deviceId,
    List<SyncOutboxData> operations,
  ) async {
    final token = await _authRepo.getAccessToken();

    // Fast-path demo mode if offline or simulated JWT
    if (token?.startsWith('demo-jwt-') == true && _baseUrl.contains('10.0.2.2')) {
      try {
        return await _executePushHttp(tenantId, deviceId, operations, token, timeoutSeconds: 2);
      } catch (_) {
        // Return simulated demo acceptance
        return SyncPushResult(
          results: operations
              .map(
                (op) => SyncOperationAckResult(
                  operationId: op.operationId,
                  status: 'accepted',
                  serverEntityId: 'server-demo-${op.operationId.substring(0, 8)}',
                ),
              )
              .toList(),
          processedCount: operations.length,
        );
      }
    }

    return _executePushHttp(tenantId, deviceId, operations, token);
  }

  Future<SyncPushResult> _executePushHttp(
    String tenantId,
    String deviceId,
    List<SyncOutboxData> operations,
    String? token, {
    int timeoutSeconds = 8,
  }) async {
    final opsPayload = operations.map((op) {
      dynamic parsedPayload;
      try {
        parsedPayload = jsonDecode(op.payload);
      } catch (_) {
        parsedPayload = <String, dynamic>{};
      }

      return {
        'operationId': op.operationId,
        'deviceId': op.deviceId,
        'sequence': op.sequence,
        'operationType': op.operationType,
        'schemaVersion': op.schemaVersion,
        'occurredAt': op.createdAt.toIso8601String(),
        'payload': parsedPayload,
      };
    }).toList();

    final response = await _dio.post(
      '$_baseUrl/api/v1/tenants/$tenantId/sync/push',
      data: {
        'deviceId': deviceId,
        'operations': opsPayload,
      },
      options: Options(
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        sendTimeout: Duration(seconds: timeoutSeconds),
        receiveTimeout: Duration(seconds: timeoutSeconds),
      ),
    );

    return SyncPushResult.fromJson(response.data as Map<String, dynamic>);
  }

  /// Pull delta updates for catalog & reference data via GET /api/v1/tenants/:tenantId/sync/pull
  Future<SyncPullDeltaResult> pullDeltas(
    String tenantId, {
    String? cursor,
  }) async {
    final token = await _authRepo.getAccessToken();

    // Fast-path demo mode if offline or simulated JWT
    if (token?.startsWith('demo-jwt-') == true && _baseUrl.contains('10.0.2.2')) {
      try {
        return await _executePullHttp(tenantId, cursor, token, timeoutSeconds: 2);
      } catch (_) {
        // Return simulated empty deltas
        return SyncPullDeltaResult(
          cursor: DateTime.now().toIso8601String(),
          hasMore: false,
          categories: const [],
          products: const [],
          customers: const [],
        );
      }
    }

    return _executePullHttp(tenantId, cursor, token);
  }

  Future<SyncPullDeltaResult> _executePullHttp(
    String tenantId,
    String? cursor,
    String? token, {
    int timeoutSeconds = 8,
  }) async {
    final queryParams = <String, dynamic>{};
    if (cursor != null && cursor.isNotEmpty) {
      queryParams['cursor'] = cursor;
    }

    final response = await _dio.get(
      '$_baseUrl/api/v1/tenants/$tenantId/sync/pull',
      queryParameters: queryParams,
      options: Options(
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        },
        sendTimeout: Duration(seconds: timeoutSeconds),
        receiveTimeout: Duration(seconds: timeoutSeconds),
      ),
    );

    return SyncPullDeltaResult.fromJson(response.data as Map<String, dynamic>);
  }
}

