import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantGuard } from './tenant.guard';
import { TenantMembershipEntity } from '../entities/tenant-membership.entity';
import { MembershipStatus, Role } from '@pos/shared-types';

describe('TenantGuard (IDOR Prevention & Branch Scoping)', () => {
  let guard: TenantGuard;
  let mockFind: jest.Mock;
  let mockDataSource: { getRepository: jest.Mock };

  beforeEach(async () => {
    mockFind = jest.fn();
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue({
        find: mockFind,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantGuard, { provide: DataSource, useValue: mockDataSource }],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
  });

  const createMockContext = (
    user: { userId: string } | undefined,
    params: { tenantId?: string; branchId?: string } = {},
    headers: Record<string, string> = {},
  ): { context: ExecutionContext; request: Record<string, any> } => {
    const request: Record<string, any> = {
      user,
      params,
      headers,
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    return { context, request };
  };

  it('allows access when user is an active member of the requested tenant', async () => {
    const userId = 'user-uuid-1';
    const tenantId = 'tenant-uuid-1';

    mockFind.mockResolvedValueOnce([
      {
        tenantId,
        userId,
        role: Role.OWNER,
        roles: [Role.OWNER],
        branchId: null,
        status: MembershipStatus.ACTIVE,
      } as TenantMembershipEntity,
    ]);

    const { context, request } = createMockContext({ userId }, { tenantId });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request['tenantContext'].tenantId).toBe(tenantId);
    expect(request['tenantContext'].userId).toBe(userId);
    expect(request['tenantContext'].isOwner).toBe(true);
  });

  it('rejects access (cross-tenant IDOR) when user does not belong to the target tenant', async () => {
    const userId = 'user-uuid-1';
    const attackerTargetTenantId = 'tenant-uuid-other-company';

    // Database lookup returns empty array (no membership found)
    mockFind.mockResolvedValueOnce([]);

    const { context } = createMockContext({ userId }, { tenantId: attackerTargetTenantId });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('rejects unauthenticated requests', async () => {
    const { context } = createMockContext(undefined, { tenantId: 'tenant-1' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('throws BadRequestException if tenantId is omitted from request', async () => {
    const { context } = createMockContext({ userId: 'user-1' }, {});
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });
});
