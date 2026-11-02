import { create } from 'zustand';
import { apiClient, UserProfile, TenantMembershipInfo, Branch } from '@/lib/api-client';
import { Role, Permission } from '@pos/shared-types';

interface AuthState {
  user: UserProfile | null;
  activeTenant: TenantMembershipInfo | null;
  branches: Branch[];
  activeBranch: Branch | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  selectTenant: (tenantId: string) => Promise<void>;
  selectBranch: (branchId: string) => void;
  clearError: () => void;

  // Role & Permission Checks
  isSuperAdmin: () => boolean;
  isOwner: () => boolean;
  isBranchManager: () => boolean;
  isCashier: () => boolean;
  isInventoryStaff: () => boolean;
  isAccountant: () => boolean;
  hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  activeTenant: null,
  branches: [],
  activeBranch: null,
  status: 'idle',
  error: null,

  login: async (email: string, password: string) => {
    set({ status: 'loading', error: null });
    try {
      await apiClient.login({ email, password });
      const profile = await apiClient.getProfile();

      if (!profile.memberships || profile.memberships.length === 0) {
        if (profile.isSuperAdmin) {
          apiClient.setActiveContext(null, null);
          set({
            user: profile,
            activeTenant: null,
            branches: [],
            activeBranch: null,
            status: 'authenticated',
            error: null,
          });
          return;
        }
        throw new Error('User has no active store memberships');
      }

      // Default active tenant is the first membership (prefer owner)
      const primaryMembership =
        profile.memberships.find((m) => m.isOwner) || profile.memberships[0];

      // Fetch branches for selected tenant
      let branches: Branch[] = [];
      try {
        branches = await apiClient.getBranches(primaryMembership.tenantId);
      } catch {
        branches = [];
      }

      // If user is branch-scoped, lock to assigned branch; otherwise pick first active branch
      let activeBranch: Branch | null = null;
      if (primaryMembership.branchId) {
        activeBranch = branches.find((b) => b.id === primaryMembership.branchId) || null;
      } else if (branches.length > 0) {
        activeBranch = branches[0];
      }

      apiClient.setActiveContext(
        primaryMembership.tenantId,
        activeBranch ? activeBranch.id : null,
      );

      set({
        user: profile,
        activeTenant: primaryMembership,
        branches,
        activeBranch,
        status: 'authenticated',
        error: null,
      });
    } catch (err: any) {
      set({
        status: 'unauthenticated',
        error: err.message || 'Login failed. Please check your credentials.',
      });
      throw err;
    }
  },

  logout: async () => {
    set({ status: 'loading' });
    try {
      await apiClient.logout();
    } finally {
      apiClient.setActiveContext(null, null);
      set({
        user: null,
        activeTenant: null,
        branches: [],
        activeBranch: null,
        status: 'unauthenticated',
        error: null,
      });
    }
  },

  checkAuth: async () => {
    // If already authenticated or in progress, skip
    if (get().status === 'authenticated') return;

    set({ status: 'loading', error: null });
    try {
      const profile = await apiClient.getProfile();
      if (!profile.memberships || profile.memberships.length === 0) {
        if (profile.isSuperAdmin) {
          apiClient.setActiveContext(null, null);
          set({
            user: profile,
            activeTenant: null,
            branches: [],
            activeBranch: null,
            status: 'authenticated',
            error: null,
          });
          return;
        }
        set({ status: 'unauthenticated', user: null });
        return;
      }

      const primaryMembership =
        profile.memberships.find((m) => m.isOwner) || profile.memberships[0];

      let branches: Branch[] = [];
      try {
        branches = await apiClient.getBranches(primaryMembership.tenantId);
      } catch {
        branches = [];
      }

      let activeBranch: Branch | null = null;
      if (primaryMembership.branchId) {
        activeBranch = branches.find((b) => b.id === primaryMembership.branchId) || null;
      } else if (branches.length > 0) {
        activeBranch = branches[0];
      }

      apiClient.setActiveContext(
        primaryMembership.tenantId,
        activeBranch ? activeBranch.id : null,
      );

      set({
        user: profile,
        activeTenant: primaryMembership,
        branches,
        activeBranch,
        status: 'authenticated',
        error: null,
      });
    } catch {
      set({ status: 'unauthenticated', user: null, activeTenant: null });
    }
  },

  selectTenant: async (tenantId: string) => {
    const user = get().user;
    if (!user) return;

    const membership = user.memberships.find((m) => m.tenantId === tenantId);
    if (!membership) return;

    set({ status: 'loading' });
    try {
      const branches = await apiClient.getBranches(tenantId);
      let activeBranch: Branch | null = null;
      if (membership.branchId) {
        activeBranch = branches.find((b) => b.id === membership.branchId) || null;
      } else if (branches.length > 0) {
        activeBranch = branches[0];
      }

      apiClient.setActiveContext(tenantId, activeBranch ? activeBranch.id : null);

      set({
        activeTenant: membership,
        branches,
        activeBranch,
        status: 'authenticated',
      });
    } catch (err: any) {
      set({ status: 'authenticated', error: err.message });
    }
  },

  selectBranch: (branchId: string) => {
    const activeTenant = get().activeTenant;
    const branches = get().branches;

    // Disallow cross-branch selection if membership is branch-scoped to a different branch
    if (activeTenant?.branchId && activeTenant.branchId !== branchId) {
      set({ error: 'You do not have access to switch to this branch' });
      return;
    }

    const branch = branches.find((b) => b.id === branchId) || null;
    if (branch && activeTenant) {
      apiClient.setActiveContext(activeTenant.tenantId, branch.id);
      set({ activeBranch: branch, error: null });
    }
  },

  clearError: () => set({ error: null }),

  isSuperAdmin: () => {
    return !!get().user?.isSuperAdmin;
  },

  isOwner: () => {
    const active = get().activeTenant;
    if (!active) return false;
    return active.isOwner || active.roles.includes(Role.OWNER) || active.role === Role.OWNER;
  },

  isBranchManager: () => {
    const active = get().activeTenant;
    if (!active) return false;
    return active.roles.includes(Role.BRANCH_MANAGER) || active.role === Role.BRANCH_MANAGER;
  },

  isCashier: () => {
    const active = get().activeTenant;
    if (!active) return false;
    return active.roles.includes(Role.CASHIER) || active.role === Role.CASHIER;
  },

  isInventoryStaff: () => {
    const active = get().activeTenant;
    if (!active) return false;
    return active.roles.includes(Role.INVENTORY_STAFF) || active.role === Role.INVENTORY_STAFF;
  },

  isAccountant: () => {
    const active = get().activeTenant;
    if (!active) return false;
    return active.roles.includes(Role.ACCOUNTANT) || active.role === Role.ACCOUNTANT;
  },

  hasPermission: (permission: Permission) => {
    const active = get().activeTenant;
    if (!active) return false;
    if (active.isOwner || active.roles.includes(Role.OWNER)) return true;
    return active.permissions.includes(permission);
  },
}));

