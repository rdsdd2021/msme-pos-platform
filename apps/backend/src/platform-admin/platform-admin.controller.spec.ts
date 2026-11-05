import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { SubscriptionPlanCode, SubscriptionStatus, TenantStatus } from '@pos/shared-types';

describe('PlatformAdminController & SuperAdminGuard', () => {
  let controller: PlatformAdminController;
  let service: any;
  let guard: SuperAdminGuard;

  beforeEach(async () => {
    service = {
      getMetrics: jest.fn().mockResolvedValue({ systemStatus: 'healthy', tenants: { total: 1 } }),
      getTenants: jest.fn().mockResolvedValue([{ id: 't-1', legalName: 'Kirana' }]),
      createTenant: jest.fn().mockResolvedValue({ tenant: { id: 't-1' } }),
      updateTenantStatus: jest.fn().mockResolvedValue({ id: 't-1', status: TenantStatus.ACTIVE }),
      getPlans: jest.fn().mockReturnValue([{ planCode: SubscriptionPlanCode.BASIC_KIRANA }]),
      updateSubscription: jest
        .fn()
        .mockResolvedValue({ id: 's-1', status: SubscriptionStatus.ACTIVE }),
      getDevices: jest.fn().mockResolvedValue([{ id: 'd-1', deviceName: 'Counter POS' }]),
      revokeDevice: jest.fn().mockResolvedValue({ id: 'd-1', status: 'revoked' }),
      getAuditLogs: jest.fn().mockResolvedValue({ total: 1, data: [] }),
    };

    guard = new SuperAdminGuard();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformAdminController],
      providers: [{ provide: PlatformAdminService, useValue: service }],
    }).compile();

    controller = module.get<PlatformAdminController>(PlatformAdminController);
  });

  describe('SuperAdminGuard', () => {
    it('allows access for authenticated super admin user', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'u-admin', email: 'superadmin@pos.assistt.in', isSuperAdmin: true },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('blocks access with ForbiddenException for store owner or regular user', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'u-owner', email: 'admin@kirana.dev', isSuperAdmin: false },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('blocks access if user is missing', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: null }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });

  describe('Controller delegation', () => {
    it('calls getMetrics on service', async () => {
      const res = await controller.getMetrics();
      expect(res.systemStatus).toBe('healthy');
      expect(service.getMetrics).toHaveBeenCalled();
    });

    it('calls createTenant passing admin user context', async () => {
      const req = { user: { userId: 'super-1' }, ip: '1.2.3.4' };
      const dto = {
        legalName: 'New Shop',
        displayName: 'New Shop',
        ownerEmail: 'new@shop.com',
        ownerName: 'Owner',
        ownerPassword: 'Password@123',
      };
      await controller.createTenant(dto, req);
      expect(service.createTenant).toHaveBeenCalledWith(dto, 'super-1', '1.2.3.4');
    });

    it('calls revokeDevice passing admin context', async () => {
      const req = { user: { userId: 'super-1' }, ip: '1.2.3.4' };
      const dto = { reason: 'Decommissioned' };
      await controller.revokeDevice('d-1', dto, req);
      expect(service.revokeDevice).toHaveBeenCalledWith('d-1', dto, 'super-1', '1.2.3.4');
    });
  });
});
