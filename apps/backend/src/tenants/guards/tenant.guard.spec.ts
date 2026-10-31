import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantGuard } from './tenant.guard';
import { TenantMembershipEntity } from '../entities/tenant-membership.entity';
import { MembershipStatus } from '@pos/shared-types';

describe('TenantGuard (IDOR Prevention)', () => {
  let guard: TenantGuard;
  let mockFindOne: jest.Mock;
  let mockDataSource: { getRepository: jest.Mock };

  beforeEach(async () => {
    mockFindOne = jest.fn();
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue({
        findOne: mockFindOne,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
  });

  const createMockContext = (
    user: { userId: string } | undefined,
    params: { tenantId?: string } = {},
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

    mockFindOne.mockResolvedValueOnce({
      tenantId,
      userId,
      role: 'owner',
      status: MembershipStatus.ACTIVE,
    } as TenantMembershipEntity);

    const { context, request } = createMockContext({ userId }, { tenantId });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request['tenantContext']).toEqual({
      tenantId,
      userId,
      role: 'owner',
    });
  });

  it('rejects access (cross-tenant IDOR) when user does not belong to the target tenant', async () => {
    const userId = 'user-uuid-1';
    const attackerTargetTenantId = 'tenant-uuid-other-company';

    // Database lookup returns null (no membership found)
    mockFindOne.mockResolvedValueOnce(null);

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

