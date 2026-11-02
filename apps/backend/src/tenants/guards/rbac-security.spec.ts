import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { TenantGuard } from './tenant.guard';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY, TENANT_WIDE_KEY } from './require-permissions.decorator';
import { TenantMembershipEntity } from '../entities/tenant-membership.entity';
import { MembershipStatus, Permission, Role, getPermissionsForRoles } from '@pos/shared-types';

describe('RBAC & Branch Security Specification Tests', () => {
  let tenantGuard: TenantGuard;
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;
  let mockFind: jest.Mock;
  let mockDataSource: { getRepository: jest.Mock };

  beforeEach(() => {
    mockFind = jest.fn();
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue({
        find: mockFind,
      }),
    };

    reflector = new Reflector();
    tenantGuard = new TenantGuard(mockDataSource as unknown as DataSource);
    permissionsGuard = new PermissionsGuard(reflector);
  });

  const createMockContext = (
    user?: { userId: string; email?: string },
    params: { tenantId?: string; branchId?: string } = {},
    headers: Record<string, string> = {},
    query: Record<string, string> = {},
  ): { context: ExecutionContext; request: Record<string, any> } => {
    const request: Record<string, any> = {
      user,
      params,
      headers,
      query,
    };

    const handler = () => {};
    const controllerClass = class {};

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
      getHandler: () => handler,
      getClass: () => controllerClass,
    } as unknown as ExecutionContext;

    return { context, request };
  };

  const setupReflectorMetadata = (
    context: ExecutionContext,
    permissions?: Permission[],
    tenantWideRequired?: boolean,
  ) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: any) => {
      if (key === PERMISSIONS_KEY) return permissions;
      if (key === TENANT_WIDE_KEY) return tenantWideRequired;
      return undefined;
    });
  };

  const createMembership = (overrides: Partial<TenantMembershipEntity> = {}): TenantMembershipEntity => {
    const role = overrides.role || Role.CASHIER;
    const roles = overrides.roles || [role as Role];
    return {
      id: 'membership-uuid-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      branchId: 'branch-1',
      status: MembershipStatus.ACTIVE,
      role,
      roles,
      joinedAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as TenantMembershipEntity;
  };

  // --- 1. Authentication & Tenancy Boundary ---

  it('Scenario 1: Unauthenticated user receives 401/403', async () => {
    const { context } = createMockContext(undefined, { tenantId: 'tenant-1' });
    await expect(tenantGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 2: Invalid or non-existent membership receives 403', async () => {
    mockFind.mockResolvedValueOnce([]); // No active membership found
    const { context } = createMockContext({ userId: 'user-1' }, { tenantId: 'tenant-1' });
    await expect(tenantGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 3: Suspended/revoked membership is rejected with 403', async () => {
    mockFind.mockResolvedValueOnce([]); // Suspended rows filtered by where: { status: ACTIVE }
    const { context } = createMockContext({ userId: 'suspended-user' }, { tenantId: 'tenant-1' });
    await expect(tenantGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 4: Cross-tenant IDOR attempts are rejected', async () => {
    // Attacker is member of tenant-A, but attempts to query tenant-B
    mockFind.mockResolvedValueOnce([]); // No membership for tenant-B
    const { context } = createMockContext({ userId: 'attacker' }, { tenantId: 'victim-tenant-id' });
    await expect(tenantGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  // --- 2. Cashier Permissions & Restrictions ---

  it('Scenario 5: Cashier CANNOT create products (receives 403)', async () => {
    mockFind.mockResolvedValueOnce([createMembership({ role: Role.CASHIER, roles: [Role.CASHIER] })]);
    const { context } = createMockContext({ userId: 'cashier-1' }, { tenantId: 'tenant-1' });

    await tenantGuard.canActivate(context);

    setupReflectorMetadata(context, [Permission.CATALOG_CREATE]);
    expect(() => permissionsGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('Scenario 6: Cashier CANNOT adjust stock manually (receives 403)', async () => {
    mockFind.mockResolvedValueOnce([createMembership({ role: Role.CASHIER, roles: [Role.CASHIER] })]);
    const { context } = createMockContext({ userId: 'cashier-1' }, { tenantId: 'tenant-1' });

    await tenantGuard.canActivate(context);

    setupReflectorMetadata(context, [Permission.STOCK_ADJUSTMENT_MANUAL]);
    expect(() => permissionsGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('Scenario 7: Cashier CANNOT register devices (receives 403)', async () => {
    mockFind.mockResolvedValueOnce([createMembership({ role: Role.CASHIER, roles: [Role.CASHIER] })]);
    const { context } = createMockContext({ userId: 'cashier-1' }, { tenantId: 'tenant-1' });

    await tenantGuard.canActivate(context);

    setupReflectorMetadata(context, [Permission.DEVICE_MANAGE]);
    expect(() => permissionsGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('Scenario 8: Cashier CANNOT access business-wide financial reports (receives 403)', async () => {
    mockFind.mockResolvedValueOnce([createMembership({ role: Role.CASHIER, roles: [Role.CASHIER] })]);
    const { context } = createMockContext({ userId: 'cashier-1' }, { tenantId: 'tenant-1' });

    await tenantGuard.canActivate(context);

    setupReflectorMetadata(context, [Permission.REPORTS_FINANCIAL_READ]);
    expect(() => permissionsGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('Scenario 9: Cashier CAN process POS billing & print receipts (authorized)', async () => {
    mockFind.mockResolvedValueOnce([createMembership({ role: Role.CASHIER, roles: [Role.CASHIER] })]);
    const { context } = createMockContext({ userId: 'cashier-1' }, { tenantId: 'tenant-1' });

    await tenantGuard.canActivate(context);

    setupReflectorMetadata(context, [Permission.BILLING_POS_CREATE, Permission.HARDWARE_PRINT]);
    expect(permissionsGuard.canActivate(context)).toBe(true);
  });

  // --- 3. Branch Scoping & Cross-Branch Isolation ---

  it('Scenario 10: Branch Manager CANNOT access or mutate another branch (receives 403)', async () => {
    // User is branch manager for Branch A ('branch-1')
    mockFind.mockResolvedValueOnce([
      createMembership({
        role: Role.BRANCH_MANAGER,
        roles: [Role.BRANCH_MANAGER],
        branchId: 'branch-1',
      }),
    ]);

    // Request attempts to access Branch B ('branch-2')
    const { context } = createMockContext(
      { userId: 'manager-1' },
      { tenantId: 'tenant-1', branchId: 'branch-2' },
    );

    await expect(tenantGuard.canActivate(context)).rejects.toThrow(
      /Cross-branch access denied: membership is restricted to branch 'branch-1'/,
    );
  });

  it('Scenario 11: Branch Manager CAN access and manage their own assigned branch (authorized)', async () => {
    mockFind.mockResolvedValueOnce([
      createMembership({
        role: Role.BRANCH_MANAGER,
        roles: [Role.BRANCH_MANAGER],
        branchId: 'branch-1',
      }),
    ]);

    const { context } = createMockContext(
      { userId: 'manager-1' },
      { tenantId: 'tenant-1', branchId: 'branch-1' },
    );

    const allowed = await tenantGuard.canActivate(context);
    expect(allowed).toBe(true);

    setupReflectorMetadata(context, [Permission.STOCK_ADJUSTMENT_MANUAL, Permission.SHIFT_REPORT_READ]);
    expect(permissionsGuard.canActivate(context)).toBe(true);
  });

  // --- 4. Inventory Staff Restrictions ---

  it('Scenario 12: Inventory Staff CANNOT create sales (receives 403)', async () => {
    mockFind.mockResolvedValueOnce([
      createMembership({ role: Role.INVENTORY_STAFF, roles: [Role.INVENTORY_STAFF] }),
    ]);
    const { context } = createMockContext({ userId: 'inventory-clerk' }, { tenantId: 'tenant-1' });

    await tenantGuard.canActivate(context);

    setupReflectorMetadata(context, [Permission.BILLING_POS_CREATE]);
    expect(() => permissionsGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('Scenario 13: Inventory Staff CAN record inward stock movements (authorized)', async () => {
    mockFind.mockResolvedValueOnce([
      createMembership({ role: Role.INVENTORY_STAFF, roles: [Role.INVENTORY_STAFF] }),
    ]);
    const { context } = createMockContext({ userId: 'inventory-clerk' }, { tenantId: 'tenant-1' });

    await tenantGuard.canActivate(context);

    setupReflectorMetadata(context, [Permission.STOCK_MOVEMENT_RECORD]);
    expect(permissionsGuard.canActivate(context)).toBe(true);
  });

  // --- 5. Accountant Permissions & Restrictions ---

  it('Scenario 14: Accountant CANNOT modify product prices or create catalog items (receives 403)', async () => {
    mockFind.mockResolvedValueOnce([
      createMembership({ role: Role.ACCOUNTANT, roles: [Role.ACCOUNTANT] }),
    ]);
    const { context } = createMockContext({ userId: 'accountant-1' }, { tenantId: 'tenant-1' });

    await tenantGuard.canActivate(context);

    setupReflectorMetadata(context, [Permission.CATALOG_UPDATE]);
    expect(() => permissionsGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('Scenario 15: Accountant CAN access permitted financial & GST export reports (authorized)', async () => {
    mockFind.mockResolvedValueOnce([
      createMembership({ role: Role.ACCOUNTANT, roles: [Role.ACCOUNTANT] }),
    ]);
    const { context } = createMockContext({ userId: 'accountant-1' }, { tenantId: 'tenant-1' });

    await tenantGuard.canActivate(context);

    setupReflectorMetadata(context, [
      Permission.REPORTS_FINANCIAL_READ,
      Permission.REPORTS_GST_EXPORT,
      Permission.BILLING_INVOICE_READ,
    ]);
    expect(permissionsGuard.canActivate(context)).toBe(true);
  });

  // --- 6. Store Owner Unrestricted Authority ---

  it('Scenario 16: Owner can access all business operations across all branches (authorized)', async () => {
    mockFind.mockResolvedValueOnce([
      createMembership({
        role: Role.OWNER,
        roles: [Role.OWNER],
        branchId: null, // Tenant-wide
      }),
    ]);

    // Owner accesses branch-2 without restriction
    const { context } = createMockContext(
      { userId: 'owner-1' },
      { tenantId: 'tenant-1', branchId: 'branch-2' },
    );

    const allowed = await tenantGuard.canActivate(context);
    expect(allowed).toBe(true);

    // Any permission (including sensitive financial operations) is granted to Owner
    setupReflectorMetadata(context, [
      Permission.TENANT_UPDATE,
      Permission.BRANCH_CREATE,
      Permission.STOCK_ADJUSTMENT_MANUAL,
      Permission.SUBSCRIPTION_MANAGE,
    ]);
    expect(permissionsGuard.canActivate(context)).toBe(true);
  });

  // --- 7. Tenant-Wide Scope Requirements ---

  it('Scenario 17: Branch-scoped user CANNOT create a new branch (tenant-wide required)', async () => {
    mockFind.mockResolvedValueOnce([
      createMembership({
        role: Role.BRANCH_MANAGER,
        roles: [Role.BRANCH_MANAGER],
        branchId: 'branch-1',
      }),
    ]);

    const { context } = createMockContext({ userId: 'manager-1' }, { tenantId: 'tenant-1' });
    await tenantGuard.canActivate(context);

    setupReflectorMetadata(context, [Permission.BRANCH_CREATE], true);
    expect(() => permissionsGuard.canActivate(context)).toThrow(
      /Tenant-wide scope required/,
    );
  });

  // --- 8. Multiple Roles per User ---

  it('Scenario 18: User with multiple roles (Cashier + Inventory Staff) receives the union of permissions', async () => {
    mockFind.mockResolvedValueOnce([
      createMembership({
        role: Role.CASHIER,
        roles: [Role.CASHIER, Role.INVENTORY_STAFF],
        branchId: 'branch-1',
      }),
    ]);

    const { context, request } = createMockContext({ userId: 'hybrid-worker' }, { tenantId: 'tenant-1' });
    await tenantGuard.canActivate(context);

    // User can bill like a cashier
    setupReflectorMetadata(context, [Permission.BILLING_POS_CREATE]);
    expect(permissionsGuard.canActivate(context)).toBe(true);

    // AND user can record inward stock like inventory staff
    setupReflectorMetadata(context, [Permission.STOCK_MOVEMENT_RECORD]);
    expect(permissionsGuard.canActivate(context)).toBe(true);

    // BUT user still cannot adjust stock manually
    setupReflectorMetadata(context, [Permission.STOCK_ADJUSTMENT_MANUAL]);
    expect(() => permissionsGuard.canActivate(context)).toThrow(ForbiddenException);
  });
});
