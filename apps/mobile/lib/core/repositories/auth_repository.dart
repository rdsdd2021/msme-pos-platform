import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/auth_user.dart';

class AuthRepository {
  final Dio _dio;
  final SharedPreferences? _prefs;
  String _baseUrl;

  static const String _keyToken = 'kirana_auth_token';
  static const String _keyRefreshToken = 'kirana_refresh_token';
  static const String _keyUser = 'kirana_cached_user';
  static const String _keyActiveTenant = 'kirana_active_tenant_id';
  static const String _keyActiveBranch = 'kirana_active_branch_id';
  static const String _keyLoggedOut = 'kirana_logged_out';

  // Pre-seeded demo credentials for immediate offline testing
  static const demoOwner = AuthUser(
    id: 'user-owner-1',
    email: 'admin@kirana.dev',
    fullName: 'Rajesh Store Owner',
    phone: '+919876543201',
    memberships: [
      MembershipSummary(
        tenantId: 'tenant-1',
        tenantName: 'Kirana Supermart',
        branchId: 'branch-1',
        role: 'owner',
        roles: ['owner'],
        permissions: ['billing:pos:create', 'catalog:read', 'catalog:manage', 'tenant:read', 'shifts:manage'],
        isOwner: true,
      ),
    ],
  );

  static const demoCashier = AuthUser(
    id: 'user-cashier-2',
    email: 'cashier@kirana.dev',
    fullName: 'Suresh Cashier',
    phone: '+919876543202',
    memberships: [
      MembershipSummary(
        tenantId: 'tenant-1',
        tenantName: 'Kirana Supermart',
        branchId: 'branch-1',
        role: 'cashier',
        roles: ['cashier'],
        permissions: ['billing:pos:create', 'catalog:read', 'shifts:open', 'shifts:close'],
        isOwner: false,
      ),
    ],
  );

  AuthRepository({
    Dio? dio,
    SharedPreferences? prefs,
    String baseUrl = AppConfig.defaultServerUrl,
  })  : _dio = dio ?? Dio(),
        _prefs = prefs,
        _baseUrl = baseUrl;

  String get baseUrl => _baseUrl;

  void updateBaseUrl(String newUrl) {
    _baseUrl = newUrl;
  }

  /// Authenticate against backend server, or fallback gracefully to offline demo profile
  Future<AuthUser> login(String email, String password) async {
    final cleanEmail = email.trim().toLowerCase();

    // Fast-path demo login for offline/emulator/test runs
    if (cleanEmail == 'admin@kirana.dev' && password == 'Password@123') {
      await _saveSession('demo-jwt-token-owner', null, demoOwner);
      return demoOwner;
    }
    if (cleanEmail == 'cashier@kirana.dev' && password == 'Password@123') {
      await _saveSession('demo-jwt-token-cashier', null, demoCashier);
      return demoCashier;
    }

    try {
      final response = await _dio.post(
        '$_baseUrl/api/v1/auth/login',
        data: {'email': cleanEmail, 'password': password},
        options: Options(
          headers: {'Content-Type': 'application/json'},
          sendTimeout: const Duration(seconds: 4),
          receiveTimeout: const Duration(seconds: 4),
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data as Map<String, dynamic>;
        final token = data['accessToken'] as String;
        final refreshToken = data['refreshToken'] as String?;

        // Fetch full profile with memberships and branch RBAC
        final profileRes = await _dio.get(
          '$_baseUrl/api/v1/auth/me',
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );

        final user = AuthUser.fromJson(profileRes.data as Map<String, dynamic>);
        final userWithBranch = await _resolvePrimaryBranch(user, token);
        await _saveSession(token, refreshToken, userWithBranch);
        return userWithBranch;
      }
    } catch (_) {
      throw Exception('Invalid email or password');
    }

    throw Exception('Invalid email or password');
  }

  /// Register a new merchant with store and starter catalog
  Future<AuthUser> registerMerchant({
    required String email,
    required String password,
    required String fullName,
    String? phone,
    required String storeName,
    required String businessType,
    required String stateCode,
    String? gstin,
    String? city,
  }) async {
    try {
      final response = await _dio.post(
        '$_baseUrl/api/v1/auth/register-merchant',
        data: {
          'email': email.trim().toLowerCase(),
          'password': password,
          'fullName': fullName.trim(),
          if (phone != null && phone.isNotEmpty) 'phone': phone.trim(),
          'storeName': storeName.trim(),
          'businessType': businessType,
          'stateCode': stateCode,
          if (gstin != null && gstin.isNotEmpty) 'gstin': gstin.trim().toUpperCase(),
          if (city != null && city.isNotEmpty) 'city': city.trim(),
          'seedSampleCatalog': false,
        },
        options: Options(
          headers: {'Content-Type': 'application/json'},
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data as Map<String, dynamic>;
        final token = data['accessToken'] as String;
        final refreshToken = data['refreshToken'] as String?;

        final profileRes = await _dio.get(
          '$_baseUrl/api/v1/auth/me',
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );

        final user = AuthUser.fromJson(profileRes.data as Map<String, dynamic>);
        final userWithBranch = await _resolvePrimaryBranch(user, token);
        await _saveSession(token, refreshToken, userWithBranch);
        return userWithBranch;
      }
    } catch (e) {
      throw Exception('Registration failed: ${e.toString()}');
    }

    throw Exception('Registration failed');
  }

  /// Check whether the user explicitly signed out
  Future<bool> isExplicitlyLoggedOut() async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    return prefs.getBool(_keyLoggedOut) ?? false;
  }

  /// Retrieve cached offline session
  Future<AuthUser?> getCachedSession() async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_keyUser);
    if (jsonStr == null) return null;

    try {
      final map = jsonDecode(jsonStr) as Map<String, dynamic>;
      return AuthUser.fromJson(map);
    } catch (_) {
      return null;
    }
  }

  /// Get active token
  Future<String?> getAccessToken() async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }

  /// Clear session on logout
  Future<void> logout() async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
    await prefs.remove(_keyRefreshToken);
    await prefs.remove(_keyUser);
    await prefs.remove(_keyActiveTenant);
    await prefs.remove(_keyActiveBranch);
    await prefs.setBool(_keyLoggedOut, true);
  }

  /// Resolves the primary branch UUID from the backend for store owners who have tenant-wide scope.
  Future<AuthUser> _resolvePrimaryBranch(AuthUser user, String token) async {
    final primary = user.primaryMembership;
    if (primary == null) return user;

    final branchId = primary.branchId;
    final isUuid = branchId != null &&
        RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
                caseSensitive: false)
            .hasMatch(branchId);

    if (isUuid) return user;

    try {
      final res = await _dio.get(
        '$_baseUrl/api/v1/tenants/${primary.tenantId}/branches',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      if (res.data is List && (res.data as List).isNotEmpty) {
        final first = (res.data as List).first as Map<String, dynamic>;
        final resolvedBranchId = first['id'] as String?;
        if (resolvedBranchId != null && resolvedBranchId.isNotEmpty) {
          final updatedMemberships = user.memberships.map((m) {
            if (m.tenantId == primary.tenantId) {
              return MembershipSummary(
                tenantId: m.tenantId,
                tenantName: m.tenantName,
                branchId: resolvedBranchId,
                role: m.role,
                roles: m.roles,
                permissions: m.permissions,
                isOwner: m.isOwner,
              );
            }
            return m;
          }).toList();

          return AuthUser(
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            memberships: updatedMemberships,
          );
        }
      }
    } catch (_) {
      // Non-blocking fallback
    }

    return user;
  }

  Future<void> _saveSession(String token, String? refreshToken, AuthUser user) async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, token);
    if (refreshToken != null) {
      await prefs.setString(_keyRefreshToken, refreshToken);
    }
    await prefs.setString(_keyUser, jsonEncode(user.toJson()));
    await prefs.setBool(_keyLoggedOut, false);
  }
}
