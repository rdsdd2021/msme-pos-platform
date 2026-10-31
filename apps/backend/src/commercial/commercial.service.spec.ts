import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { CommercialService } from './commercial.service';
import { DeviceEntity } from './entities/device.entity';
import { TenantSubscriptionEntity } from './entities/tenant-subscription.entity';
import { DeviceStatus, Platform } from '@pos/shared-types';

describe('CommercialService — Device Registration & Subscription Entitlements', () => {
  let service: CommercialService;
  let mockDeviceRepo: any;
  let mockSubscriptionRepo: any;

  beforeEach(async () => {
    mockDeviceRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(async (d) => d),
      create: jest.fn((d) => d),
      find: jest.fn(),
    };
    mockSubscriptionRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (d) => d),
      create: jest.fn((d) => d),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommercialService,
        { provide: getRepositoryToken(DeviceEntity), useValue: mockDeviceRepo },
        { provide: getRepositoryToken(TenantSubscriptionEntity), useValue: mockSubscriptionRepo },
      ],
    }).compile();

    service = module.get<CommercialService>(CommercialService);
  });

  it('registers a new device within plan limits', async () => {
    mockDeviceRepo.findOne.mockResolvedValueOnce(null);
    mockSubscriptionRepo.findOne.mockResolvedValueOnce({
      tenantId: 'tenant-1',
      maxDevices: 2,
    });
    mockDeviceRepo.count.mockResolvedValueOnce(0); // 0 active devices currently

    const device = await service.registerDevice('tenant-1', {
      branchId: 'branch-1',
      deviceIdentifier: 'POS-01',
      deviceName: 'Billing Terminal 1',
      platform: Platform.ANDROID,
    });

    expect(device.deviceIdentifier).toBe('POS-01');
    expect(device.status).toBe(DeviceStatus.ACTIVE);
  });

  it('rejects device registration when plan device limit is exceeded', async () => {
    mockDeviceRepo.findOne.mockResolvedValueOnce(null);
    mockSubscriptionRepo.findOne.mockResolvedValueOnce({
      tenantId: 'tenant-1',
      maxDevices: 2,
    });
    mockDeviceRepo.count.mockResolvedValueOnce(2); // Already 2 devices registered

    await expect(
      service.registerDevice('tenant-1', {
        branchId: 'branch-1',
        deviceIdentifier: 'POS-03',
        deviceName: 'Billing Terminal 3',
        platform: Platform.ANDROID,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('revokes an active device with reason', async () => {
    const mockDevice = {
      id: 'dev-1',
      tenantId: 'tenant-1',
      status: DeviceStatus.ACTIVE,
    };
    mockDeviceRepo.findOne.mockResolvedValueOnce(mockDevice);

    const revoked = await service.revokeDevice('tenant-1', 'dev-1', {
      reason: 'Device lost',
    });

    expect(revoked.status).toBe(DeviceStatus.REVOKED);
    expect(revoked.revocationReason).toBe('Device lost');
    expect(revoked.revokedAt).toBeDefined();
  });
});

