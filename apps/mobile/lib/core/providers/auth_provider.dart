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
          initialState ??
              AuthState(
                user: AuthRepository.demoOwner,
                activeMembership: AuthRepository.demoOwner.primaryMembership,
                activeBranchId: AuthRepository.demoOwner.primaryMembership?.branchId ?? 'branch-1',
                isInitialized: true,
              ),
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
        state = const AuthState(isInitialized: true);
        return;
      }

      final cachedUser = await _repo.getCachedSession();
      if (cachedUser != null) {
        final membership = cachedUser.primaryMembership;
        state = AuthState(
          user: cachedUser,
          activeMembership: membership,
          activeBranchId: membership?.branchId ?? 'branch-1',
          isInitialized: true,
        );
        return;
      }
    } catch (_) {
      // Ignore cache load failure
    }

    // Default to initial state (e.g. demoOwner) if not explicitly logged out
    state = state.copyWith(isLoading: false, isInitialized: true);
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final user = await _repo.login(email, password);
      final membership = user.primaryMembership;

      state = AuthState(
        user: user,
        activeMembership: membership,
        activeBranchId: membership?.branchId ?? 'branch-1',
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
