import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SyncService } from './sync.service';
import { SyncIngestedOperationEntity } from './entities/sync-ingested-operation.entity';
import { DeviceInvoiceRangeEntity } from './entities/device-invoice-range.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { CategoryEntity } from '../catalog/entities/category.entity';
import { DeviceEntity } from '../commercial/entities/device.entity';
import { CustomerEntity } from '../operations/entities/customer.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { BillingService } from '../billing/billing.service';
import { DeviceStatus } from '@pos/shared-types';

describe('SyncService — Offline Push, Pull & Idempotent Ingestion', () => {
  let service: SyncService;
  let mockIngestedRepo: any;
  let mockRangeRepo: any;
  let mockProductRepo: any;
  let mockCategoryRepo: any;
  let mockCustomerRepo: any;
  let mockDeviceRepo: any;
  let mockBranchRepo: any;
  let mockBillingService: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockIngestedRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (d) => d),
      create: jest.fn((d) => d),
    };
    mockRangeRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (d) => d),
      create: jest.fn((d) => d),
    };
    mockDeviceRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'device-pos-001', status: DeviceStatus.ACTIVE }),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn((d) => ({ ...d, id: 'device-pos-001' })),
      save: jest.fn(async (d) => ({ ...d, id: 'device-pos-001' })),
    };
    mockBranchRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'branch-uuid-001', name: 'Main Store' }),
    };
    mockProductRepo = { find: jest.fn().mockResolvedValue([]) };
    mockCategoryRepo = { find: jest.fn().mockResolvedValue([]) };
    mockCustomerRepo = { find: jest.fn().mockResolvedValue([]) };
    mockBillingService = {
      createSale: jest.fn().mockResolvedValue({ id: 'server-invoice-uuid-101' }),
    };
    mockDataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: getRepositoryToken(SyncIngestedOperationEntity), useValue: mockIngestedRepo },
        { provide: getRepositoryToken(DeviceInvoiceRangeEntity), useValue: mockRangeRepo },
        { provide: getRepositoryToken(ProductEntity), useValue: mockProductRepo },
        { provide: getRepositoryToken(CategoryEntity), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(CustomerEntity), useValue: mockCustomerRepo },
        { provide: getRepositoryToken(DeviceEntity), useValue: mockDeviceRepo },
        { provide: getRepositoryToken(BranchEntity), useValue: mockBranchRepo },
        { provide: BillingService, useValue: mockBillingService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  describe('Offline Batch Ingestion & Idempotency (Non-Negotiable Rule 12)', () => {
    it('ingests offline sale operation and returns accepted status with server entity ID', async () => {
      mockIngestedRepo.findOne.mockResolvedValueOnce(null); // First time seen

      const response = await service.ingestBatch('tenant-1', 'cashier-1', {
        deviceId: 'device-pos-01',
        operations: [
          {
            operationId: 'op-sale-uuid-1',
            deviceId: 'device-pos-01',
            sequence: 1,
            operationType: 'CREATE_SALE',
            schemaVersion: 1,
            occurredAt: '2026-10-31T11:50:00.000Z',
            payload: { branchId: 'branch-1', items: [], payments: [] },
          },
        ],
      });

      expect(response.processedCount).toBe(1);
      expect(response.results[0].status).toBe('accepted');
      expect(response.results[0].serverEntityId).toBe('server-invoice-uuid-101');
      expect(mockBillingService.createSale).toHaveBeenCalled();
      expect(mockIngestedRepo.save).toHaveBeenCalled();
    });

    it('returns already_processed without creating second sale when re-syncing same operation', async () => {
      mockIngestedRepo.findOne.mockResolvedValueOnce({
        tenantId: 'tenant-1',
        deviceId: 'device-pos-01',
        operationId: 'op-sale-uuid-1',
        status: 'accepted',
        serverEntityId: 'server-invoice-uuid-101',
      });

      const response = await service.ingestBatch('tenant-1', 'cashier-1', {
        deviceId: 'device-pos-01',
        operations: [
          {
            operationId: 'op-sale-uuid-1',
            deviceId: 'device-pos-01',
            sequence: 1,
            operationType: 'CREATE_SALE',
            schemaVersion: 1,
            occurredAt: '2026-10-31T11:50:00.000Z',
            payload: {},
          },
        ],
      });

      expect(response.processedCount).toBe(1);
      expect(response.results[0].status).toBe('already_processed');
      expect(response.results[0].serverEntityId).toBe('server-invoice-uuid-101');
      expect(mockBillingService.createSale).not.toHaveBeenCalled();
    });

    it('auto-provisions an unknown device terminal and ingests offline sale', async () => {
      mockDeviceRepo.findOne.mockResolvedValueOnce(null);
      mockDeviceRepo.create.mockReturnValue({
        id: 'new-device-uuid',
        tenantId: 'tenant-1',
        deviceIdentifier: 'device-pos-unknown',
        status: DeviceStatus.ACTIVE,
      });
      mockDeviceRepo.save.mockResolvedValue({
        id: 'new-device-uuid',
        status: DeviceStatus.ACTIVE,
      });

      const response = await service.ingestBatch('tenant-1', 'cashier-1', {
        deviceId: 'device-pos-unknown',
        operations: [
          {
            operationId: 'op-auto-1',
            deviceId: 'device-pos-unknown',
            sequence: 1,
            operationType: 'CREATE_SALE',
            schemaVersion: 1,
            occurredAt: '2026-10-31T12:00:00.000Z',
            payload: { branchId: 'branch-1' },
          },
        ],
      });

      expect(response.results[0].status).toBe('accepted');
      expect(mockDeviceRepo.create).toHaveBeenCalled();
    });

    it('rejects batch operations from a revoked device', async () => {
      mockDeviceRepo.findOne.mockResolvedValueOnce({
        id: 'device-revoked-01',
        status: DeviceStatus.REVOKED,
      });

      const response = await service.ingestBatch('tenant-1', 'cashier-1', {
        deviceId: 'device-revoked-01',
        operations: [
          {
            operationId: 'op-sale-uuid-revoked',
            deviceId: 'device-revoked-01',
            sequence: 1,
            operationType: 'CREATE_SALE',
            schemaVersion: 1,
            occurredAt: '2026-10-31T11:50:00.000Z',
            payload: {},
          },
        ],
      });

      expect(response.processedCount).toBe(1);
      expect(response.results[0].status).toBe('rejected');
      expect(response.results[0].errorCode).toBe('DEVICE_REVOKED');
      expect(mockBillingService.createSale).not.toHaveBeenCalled();
    });
  });

  describe('Device Offline Invoice Number Allocation', () => {
    it('allocates a sequential non-overlapping invoice range for a device', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValueOnce(null), // No prior ranges in branch
        create: jest.fn((entity, data) => ({ id: 'range-1', ...data })),
        save: jest.fn(async (data) => data),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const range = await service.allocateInvoiceRange('tenant-1', {
        branchId: 'branch-1',
        deviceId: 'device-pos-01',
        rangeSize: 50,
      });

      expect(range.startNumber).toBe(1001);
      expect(range.endNumber).toBe(1050);
      expect(range.isExhausted).toBe(false);
    });
  });

  describe('Delta Pull (Catalog & Customer Reference Data)', () => {
    it('pulls products, categories, and customer deltas after cursor timestamp', async () => {
      mockProductRepo.find.mockResolvedValueOnce([{ id: 'prod-1', name: 'Tata Salt' }]);
      mockCategoryRepo.find.mockResolvedValueOnce([{ id: 'cat-1', name: 'Grocery' }]);
      mockCustomerRepo.find.mockResolvedValueOnce([{ id: 'cust-1', name: 'Ramesh Sharma' }]);

      const deltas = await service.pullDeltas('tenant-1', '2026-10-31T00:00:00.000Z');

      expect(deltas.products.length).toBe(1);
      expect(deltas.categories.length).toBe(1);
      expect(deltas.customers?.length).toBe(1);
      expect(deltas.hasMore).toBe(false);
      expect(deltas.cursor).toBeDefined();
    });
  });
});

