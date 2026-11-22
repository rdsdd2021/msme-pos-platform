import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/auth_user.dart';
import '../repositories/auth_repository.dart';

class AuthState {
  final AuthUser? user;
  final MembershipSummary? activeMembership;
  final String? activeBranchId;
  final Map<String, dynamic>? branchDetails;
  final bool isLoading;
  final String? error;
  final bool isInitialized;

  const AuthState({
    this.user,
    this.activeMembership,
    this.activeBranchId,
    this.branchDetails,
    this.isLoading = false,
    this.error,
    this.isInitialized = false,
  });

  bool get isAuthenticated => user != null;
  bool get isOwner => activeMembership?.isOwner ?? false;
  bool get isCashier => activeMembership?.role == 'cashier';
  bool get canAccessAdmin => activeMembership?.canAccessAdmin ?? false;

  String get storeName =>
      branchDetails?['name'] as String? ?? activeMembership?.tenantName ?? 'Kirana Supermart';
  String? get storeGstin => branchDetails?['gstin'] as String?;
  String? get storeAddress => branchDetails?['addressLine1'] as String?;
  String? get storeCity => branchDetails?['city'] as String?;
  String? get storeStateCode => branchDetails?['stateCode'] as String?;
  String? get storePostalCode => branchDetails?['postalCode'] as String?;

  AuthState copyWith({
    AuthUser? user,
    MembershipSummary? activeMembership,
    String? activeBranchId,
    Map<String, dynamic>? branchDetails,
    bool? isLoading,
    String? error,
    bool? isInitialized,
  }) {
    return AuthState(
      user: user ?? this.user,
      activeMembership: activeMembership ?? this.activeMembership,
      activeBranchId: activeBranchId ?? this.activeBranchId,
      branchDetails: branchDetails ?? this.branchDetails,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isInitialized: isInitialized ?? this.isInitialized,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repo;

  AuthNotifier(this._repo, {AuthState? initialState})
      : super(
          initialState ?? const AuthState(isInitialized: false),
        ) {
    if (initialState == null) {
      checkSession();
    }
  }

  Future<void> checkSession() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final isLoggedOut = await _repo.isExplicitlyLoggedOut();
      if (isLoggedOut) {
        state = const AuthState(isInitialized: true, user: null);
        return;
      }

      final cachedUser = await _repo.getCachedSession();
      if (cachedUser != null) {
        final membership = cachedUser.primaryMembership;
        final rawBranch = membership?.branchId;
        final isUuid = rawBranch != null &&
            RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
                    caseSensitive: false)
                .hasMatch(rawBranch);

        state = AuthState(
          user: cachedUser,
          activeMembership: membership,
          activeBranchId: isUuid ? rawBranch : null,
          isInitialized: true,
        );
        fetchBranchDetails();

        if (!isUuid) {
          _repo.resolvePrimaryBranch(cachedUser).then((resolvedUser) {
            final resolvedMembership = resolvedUser.primaryMembership;
            if (resolvedMembership?.branchId != null) {
              state = state.copyWith(
                user: resolvedUser,
                activeMembership: resolvedMembership,
                activeBranchId: resolvedMembership!.branchId,
              );
            }
          }).catchError((_) {});
        }
        return;
      }
    } catch (_) {
      // Ignore cache load failure
    }

    // Default to clean unauthenticated state on first boot
    state = const AuthState(isInitialized: true, user: null);
  }

  void signInAsDemo({bool isOwner = true, bool isRestaurant = false}) {
    final demoUser = isRestaurant
        ? AuthRepository.demoRestaurant
        : (isOwner ? AuthRepository.demoOwner : AuthRepository.demoCashier);
    state = AuthState(
      user: demoUser,
      activeMembership: demoUser.primaryMembership,
      activeBranchId: demoUser.primaryMembership?.branchId ?? 'branch-1',
      isInitialized: true,
    );
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final user = await _repo.login(email, password);
      final membership = user.primaryMembership;

      state = AuthState(
        user: user,
        activeMembership: membership,
        activeBranchId: membership?.branchId,
        isInitialized: true,
      );
      fetchBranchDetails();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }

  Future<void> loginDemo({required bool isOwner, bool isRestaurant = false}) async {
    final email = isRestaurant
        ? 'cafe@kirana.dev'
        : (isOwner ? 'admin@kirana.dev' : 'cashier@kirana.dev');
    await login(email, 'Password@123');
  }

  Future<void> registerMerchant({
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
    state = state.copyWith(isLoading: true, error: null);

    try {
      final user = await _repo.registerMerchant(
        email: email,
        password: password,
        fullName: fullName,
        phone: phone,
        storeName: storeName,
        businessType: businessType,
        stateCode: stateCode,
        gstin: gstin,
        city: city,
      );
      final membership = user.primaryMembership;

      state = AuthState(
        user: user,
        activeMembership: membership,
        activeBranchId: membership?.branchId,
        isInitialized: true,
      );
      fetchBranchDetails();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }

  void switchBranch(String branchId) {
    if (state.activeMembership?.branchId != null) {
      // Scoped cashier cannot switch branch (Rule 11)
      return;
    }
    state = state.copyWith(activeBranchId: branchId);
  }

  /// Fetch authoritative branch and store details from server
  Future<Map<String, dynamic>?> fetchBranchDetails() async {
    final tenantId = state.activeMembership?.tenantId ?? state.user?.primaryMembership?.tenantId;
    final branchId = state.activeBranchId ?? state.activeMembership?.branchId ?? state.user?.primaryMembership?.branchId;
    if (tenantId == null || branchId == null) return null;
    final details = await _repo.getBranchDetails(tenantId, branchId);
    if (details != null) {
      state = state.copyWith(branchDetails: details);
    }
    return details;
  }

  /// Update store & branch profile (store name, address, GSTIN) on server
  Future<Map<String, dynamic>> updateStoreProfile({
    String? name,
    String? gstin,
    String? stateCode,
    String? addressLine1,
    String? addressLine2,
    String? city,
    String? postalCode,
  }) async {
    final tenantId = state.activeMembership?.tenantId ?? state.user?.primaryMembership?.tenantId;
    final branchId = state.activeBranchId ?? state.activeMembership?.branchId ?? state.user?.primaryMembership?.branchId;
    if (tenantId == null || branchId == null) {
      throw Exception('Active tenant or branch not found');
    }

    final updated = await _repo.updateBranchDetails(
      tenantId: tenantId,
      branchId: branchId,
      name: name,
      gstin: gstin,
      stateCode: stateCode,
      addressLine1: addressLine1,
      addressLine2: addressLine2,
      city: city,
      postalCode: postalCode,
    );

    // Update active membership tenantName if name changed
    MembershipSummary? updatedMembership = state.activeMembership;
    if (name != null && name.trim().isNotEmpty && updatedMembership != null) {
      updatedMembership = updatedMembership.copyWith(tenantName: name.trim());
    }

    state = state.copyWith(
      branchDetails: updated,
      activeMembership: updatedMembership,
    );

    return updated;
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    await _repo.logout();
    state = const AuthState(isInitialized: true);
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return AuthNotifier(repo);
});
