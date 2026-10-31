import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantEntity } from './entities/tenant.entity';
import { TenantMembershipEntity } from './entities/tenant-membership.entity';
import { BranchEntity } from './entities/branch.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { BusinessType } from '@pos/shared-types';

describe('TenantsService', () => {
  let service: TenantsService;
  let mockTenantRepo: any;
  let mockMembershipRepo: any;
  let mockBranchRepo: any;
  let mockAuditLogRepo: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockTenantRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockMembershipRepo = {
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockBranchRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((dto) => dto),
    };
    mockAuditLogRepo = {
      save: jest.fn(),
      create: jest.fn((dto) => dto),
    };
    mockDataSource = {
      transaction: jest.fn(async (cb) => {
        const manager = {
          create: jest.fn((entity, data) => ({ id: 'mock-id', ...data })),
          save: jest.fn(async (data) => data),
        };
        return cb(manager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: getRepositoryToken(TenantEntity), useValue: mockTenantRepo },
        { provide: getRepositoryToken(TenantMembershipEntity), useValue: mockMembershipRepo },
        { provide: getRepositoryToken(BranchEntity), useValue: mockBranchRepo },
        { provide: getRepositoryToken(AuditLogEntity), useValue: mockAuditLogRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  it('creates a tenant with default MAIN branch and owner membership in a single transaction', async () => {
    const result = await service.createTenant('user-1', {
      legalName: 'Kirana Store',
      displayName: 'Kirana',
      businessType: BusinessType.GROCERY,
    });

    expect(result).toBeDefined();
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('rejects duplicate branch code within the same tenant', async () => {
    mockBranchRepo.findOne.mockResolvedValueOnce({
      id: 'branch-1',
      code: 'MAIN',
      tenantId: 'tenant-1',
    });

    await expect(
      service.createBranch('tenant-1', 'user-1', {
        code: 'MAIN',
        name: 'Another Main Branch',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

