import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/auth_user.dart';
import '../repositories/auth_repository.dart';

class AuthState {
  final AuthUser? user;
  final MembershipSummary? activeMembership;
  final String? activeBranchId;
  final bool isLoading;
  final String? error;
  final bool isInitialized;

  const AuthState({
    this.user,
    this.activeMembership,
    this.activeBranchId,
    this.isLoading = false,
    this.error,
    this.isInitialized = false,
  });

  bool get isAuthenticated => user != null;
  bool get isOwner => activeMembership?.isOwner ?? false;
  bool get isCashier => activeMembership?.role == 'cashier';
  bool get canAccessAdmin => activeMembership?.canAccessAdmin ?? false;

  AuthState copyWith({
    AuthUser? user,
    MembershipSummary? activeMembership,
    String? activeBranchId,
    bool? isLoading,
    String? error,
    bool? isInitialized,
  }) {
    return AuthState(
      user: user ?? this.user,
      activeMembership: activeMembership ?? this.activeMembership,
      activeBranchId: activeBranchId ?? this.activeBranchId,
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

  void signInAsDemo({bool isOwner = true}) {
    final demoUser = isOwner ? AuthRepository.demoOwner : AuthRepository.demoCashier;
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
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }

  Future<void> loginDemo({required bool isOwner}) async {
    final email = isOwner ? 'admin@kirana.dev' : 'cashier@kirana.dev';
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
