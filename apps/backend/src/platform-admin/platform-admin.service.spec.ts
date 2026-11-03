import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PlatformAdminService } from './platform-admin.service';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { UserEntity } from '../tenants/entities/user.entity';
import { TenantMembershipEntity } from '../tenants/entities/tenant-membership.entity';
import { DeviceEntity } from '../commercial/entities/device.entity';
import { TenantSubscriptionEntity } from '../commercial/entities/tenant-subscription.entity';
import { InvoiceEntity } from '../billing/entities/invoice.entity';
import { AuditLogEntity } from '../tenants/entities/audit-log.entity';
import {
  TenantStatus,
  DeviceStatus,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '@pos/shared-types';

describe('PlatformAdminService', () => {
  let service: PlatformAdminService;
  let tenantRepo: any;
  let branchRepo: any;
  let userRepo: any;
  let membershipRepo: any;
  let deviceRepo: any;
  let subscriptionRepo: any;
  let invoiceRepo: any;
  let auditRepo: any;
  let dataSource: any;

  beforeEach(async () => {
    tenantRepo = {
      count: jest.fn().mockResolvedValue(5),
      find: jest.fn().mockResolvedValue([
        { id: 't-1', legalName: 'Kirana Corp', displayName: 'Kirana Store', status: TenantStatus.ACTIVE, createdAt: new Date() },
      ]),
      findOne: jest.fn().mockResolvedValue({ id: 't-1', status: TenantStatus.ACTIVE }),
      save: jest.fn().mockImplementation((t) => Promise.resolve({ ...t })),
      create: jest.fn().mockImplementation((t) => t),
    };

    branchRepo = {
      count: jest.fn().mockResolvedValue(8),
      findOne: jest.fn().mockResolvedValue({ id: 'b-1', name: 'Main Branch', code: 'BR-01' }),
      create: jest.fn().mockImplementation((b) => b),
    };

    userRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((u) => u),
    };

    membershipRepo = {
      count: jest.fn().mockResolvedValue(12),
      create: jest.fn().mockImplementation((m) => m),
    };

    deviceRepo = {
      count: jest.fn().mockResolvedValue(15),
      find: jest.fn().mockResolvedValue([
        { id: 'd-1', tenantId: 't-1', branchId: 'b-1', deviceName: 'Counter POS 1', status: DeviceStatus.ACTIVE, createdAt: new Date() },
      ]),
      findOne: jest.fn().mockResolvedValue({
        id: 'd-1',
        tenantId: 't-1',
        branchId: 'b-1',
        deviceName: 'Counter POS 1',
        status: DeviceStatus.ACTIVE,
      }),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d })),
    };

    subscriptionRepo = {
      findOne: jest.fn().mockResolvedValue({
        planCode: SubscriptionPlanCode.BASIC_KIRANA,
        status: SubscriptionStatus.ACTIVE,
        maxBranches: 1,
        maxDevices: 2,
        maxUsers: 5,
      }),
      create: jest.fn().mockImplementation((s) => s),
      save: jest.fn().mockImplementation((s) => Promise.resolve({ ...s })),
    };

    invoiceRepo = {
      count: jest.fn().mockResolvedValue(250),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalSales: '125430.50' }),
      }),
    };

    auditRepo = {
      create: jest.fn().mockImplementation((a) => a),
      save: jest.fn().mockImplementation((a) => Promise.resolve({ ...a, id: 'a-1' })),
      findAndCount: jest.fn().mockResolvedValue([[{ id: 'a-1', action: 'platform:tenant:created' }], 1]),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        const manager = {
          create: jest.fn().mockImplementation((entityClass, data) => ({ ...data, id: 'mock-id' })),
          save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 'saved-id' })),
        };
        return callback(manager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformAdminService,
        { provide: getRepositoryToken(TenantEntity), useValue: tenantRepo },
        { provide: getRepositoryToken(BranchEntity), useValue: branchRepo },
        { provide: getRepositoryToken(UserEntity), useValue: userRepo },
        { provide: getRepositoryToken(TenantMembershipEntity), useValue: membershipRepo },
        { provide: getRepositoryToken(DeviceEntity), useValue: deviceRepo },
        { provide: getRepositoryToken(TenantSubscriptionEntity), useValue: subscriptionRepo },
        { provide: getRepositoryToken(InvoiceEntity), useValue: invoiceRepo },
        { provide: getRepositoryToken(AuditLogEntity), useValue: auditRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<PlatformAdminService>(PlatformAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    it('returns platform-wide metrics with aggregated sales', async () => {
      const metrics = await service.getMetrics();
      expect(metrics.tenants.total).toBe(5);
      expect(metrics.branches.total).toBe(8);
      expect(metrics.devices.total).toBe(15);
      expect(metrics.transactions.totalInvoices).toBe(250);
      expect(metrics.transactions.totalSalesVolume).toBe('125430.50');
      expect(metrics.systemStatus).toBe('healthy');
    });
  });

  describe('getTenants', () => {
    it('returns enriched tenant list with branch and device counts', async () => {
      const tenants = await service.getTenants();
      expect(tenants.length).toBe(1);
      expect(tenants[0].legalName).toBe('Kirana Corp');
      expect(tenants[0].branchCount).toBe(8);
      expect(tenants[0].deviceCount).toBe(15);
      expect(tenants[0].subscription).toBeDefined();
    });
  });

  describe('createTenant', () => {
    it(
      'creates new tenant organization, branch, owner user and subscription',
      async () => {
        const result = await service.createTenant(
          {
            legalName: 'Shree Krishna Retailers',
            displayName: 'Krishna Supermart',
            ownerEmail: 'owner@krishna.com',
            ownerName: 'Gopal Sharma',
            ownerPassword: 'Password@123',
            planCode: SubscriptionPlanCode.BASIC_KIRANA,
          },
          'admin-user-id',
          '127.0.0.1',
        );

        expect(result.tenant).toBeDefined();
        expect(result.branch).toBeDefined();
        expect(result.owner.email).toBe('owner@krishna.com');
        expect(result.subscription).toBeDefined();
      },
      15000,
    );

    it('throws ConflictException if user with same email exists', async () => {
      userRepo.findOne.mockResolvedValueOnce({ id: 'existing-user' });

      await expect(
        service.createTenant(
          {
            legalName: 'Existing Shop',
            displayName: 'Existing Shop',
            ownerEmail: 'existing@shop.com',
            ownerName: 'Existing Owner',
            ownerPassword: 'Password@123',
          },
          'admin-user-id',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateTenantStatus', () => {
    it('updates tenant status and records platform audit log', async () => {
      const updated = await service.updateTenantStatus(
        't-1',
        { status: TenantStatus.SUSPENDED },
        'admin-user-id',
        '127.0.0.1',
      );

      expect(updated.status).toBe(TenantStatus.SUSPENDED);
      expect(auditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'platform:tenant:status_changed',
        }),
      );
      expect(auditRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException if tenant does not exist', async () => {
      tenantRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateTenantStatus(
          'non-existent',
          { status: TenantStatus.SUSPENDED },
          'admin-user-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeDevice', () => {
    it('marks device as revoked with timestamp and reason', async () => {
      const revoked = await service.revokeDevice(
        'd-1',
        { reason: 'Device reported stolen' },
        'admin-user-id',
        '10.0.0.1',
      );

      expect(revoked.status).toBe(DeviceStatus.REVOKED);
      expect(revoked.revocationReason).toBe('Device reported stolen');
      expect(revoked.revokedAt).toBeDefined();
      expect(auditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'platform:device:revoked',
        }),
      );
    });
  });

  describe('getPlans', () => {
    it('returns the 3 standard commercial tiers', () => {
      const plans = service.getPlans();
      expect(plans.length).toBe(3);
      expect(plans[0].planCode).toBe(SubscriptionPlanCode.BASIC_KIRANA);
      expect(plans[1].planCode).toBe(SubscriptionPlanCode.PRO_RETAIL);
      expect(plans[2].planCode).toBe(SubscriptionPlanCode.ENTERPRISE);
    });
  });
});
