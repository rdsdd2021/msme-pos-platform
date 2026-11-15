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
import { CustomerLedgerEntity } from '../operations/entities/customer-ledger.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { StockBalanceEntity } from '../catalog/entities/stock-balance.entity';
import { StockLedgerEntity } from '../catalog/entities/stock-ledger.entity';
import { BillingService } from '../billing/billing.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { DeviceStatus } from '@pos/shared-types';

describe('SyncService — Offline Push, Pull & Idempotent Ingestion', () => {
  let service: SyncService;
  let mockIngestedRepo: any;
  let mockRangeRepo: any;
  let mockProductRepo: any;
  let mockCategoryRepo: any;
  let mockCustomerRepo: any;
  let mockCustomerLedgerRepo: any;
  let mockDeviceRepo: any;
  let mockBranchRepo: any;
  let mockStockBalanceRepo: any;
  let mockStockLedgerRepo: any;
  let mockBillingService: any;
  let mockRestaurantService: any;
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
    mockProductRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((d) => ({ ...d, id: 'product-uuid-1' })),
      save: jest.fn(async (d) => ({ ...d, id: d.id || 'product-uuid-1' })),
    };
    mockCategoryRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((d) => ({ ...d, id: 'category-uuid-1' })),
      save: jest.fn(async (d) => ({ ...d, id: d.id || 'category-uuid-1' })),
    };
    mockCustomerRepo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn().mockResolvedValue(null), save: jest.fn(async (d) => d), create: jest.fn((d) => d) };
    mockCustomerLedgerRepo = { find: jest.fn().mockResolvedValue([]), save: jest.fn(async (d) => d), create: jest.fn((d) => d) };
    mockStockBalanceRepo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn().mockResolvedValue(null), save: jest.fn(async (d) => d), create: jest.fn((d) => d) };
    mockStockLedgerRepo = { find: jest.fn().mockResolvedValue([]), save: jest.fn(async (d) => d), create: jest.fn((d) => d) };
    mockBillingService = {
      createSale: jest.fn().mockResolvedValue({ id: 'server-invoice-uuid-101' }),
      getInvoices: jest.fn().mockResolvedValue([]),
    };
    mockRestaurantService = {
      createOrder: jest.fn().mockResolvedValue({ id: 'rest-order-uuid-1' }),
      dispatchKot: jest.fn().mockResolvedValue({ kot: { id: 'kot-uuid-1' }, order: { id: 'rest-order-uuid-1' } }),
      settleOrder: jest.fn().mockResolvedValue({ order: { id: 'rest-order-uuid-1' }, invoice: { id: 'inv-101' } }),
      updateTable: jest.fn().mockResolvedValue({ id: 'table-uuid-1' }),
      transferTable: jest.fn().mockResolvedValue({ sourceTable: { id: 'table-1' }, targetTable: { id: 'table-2' } }),
      getTables: jest.fn().mockResolvedValue([{ id: 'table-uuid-1', tableNumber: 'T-01', activeOrder: { id: 'order-1' } }]),
      seedDefaultTables: jest.fn().mockResolvedValue([]),
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
        { provide: getRepositoryToken(CustomerLedgerEntity), useValue: mockCustomerLedgerRepo },
        { provide: getRepositoryToken(DeviceEntity), useValue: mockDeviceRepo },
        { provide: getRepositoryToken(BranchEntity), useValue: mockBranchRepo },
        { provide: getRepositoryToken(StockBalanceEntity), useValue: mockStockBalanceRepo },
        { provide: getRepositoryToken(StockLedgerEntity), useValue: mockStockLedgerRepo },
        { provide: BillingService, useValue: mockBillingService },
        { provide: RestaurantService, useValue: mockRestaurantService },
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

    it('ingests CREATE_PRODUCT mutation and creates product in catalog', async () => {
      const response = await service.ingestBatch('tenant-1', 'owner-1', {
        deviceId: 'device-pos-001',
        operations: [
          {
            operationId: 'op-prod-create-1',
            deviceId: 'device-pos-001',
            sequence: 1,
            operationType: 'CREATE_PRODUCT',
            schemaVersion: 1,
            occurredAt: '2026-10-31T12:00:00.000Z',
            payload: {
              name: 'Aashirvaad Atta 5kg',
              sku: 'ITEM-ATTA-5KG',
              barcode: '8901030000001',
              category: 'Groceries',
              sellingPrice: '250.00',
              costPrice: '210.00',
              taxRate: '0.00',
              unit: 'PKT',
            },
          },
        ],
      });

      expect(response.processedCount).toBe(1);
      expect(response.results[0].status).toBe('accepted');
      expect(mockProductRepo.save).toHaveBeenCalled();
    });

    it('ingests CREATE_SALE with mobile lines and branch-1 fallback gracefully', async () => {
      const response = await service.ingestBatch('tenant-1', 'cashier-1', {
        deviceId: 'device-pos-001',
        operations: [
          {
            operationId: 'op-sale-mobile-1',
            deviceId: 'device-pos-001',
            sequence: 2,
            operationType: 'CREATE_SALE',
            schemaVersion: 1,
            occurredAt: '2026-10-31T12:05:00.000Z',
            payload: {
              invoiceNumber: 'INV-2026-001',
              branchId: 'branch-1',
              lines: [
                {
                  productId: 'prod-uuid-1',
                  quantity: '2',
                  unitPrice: '100.00',
                  gstRate: '5.00',
                },
              ],
              payments: [
                {
                  method: 'cash',
                  amount: '200.00',
                },
              ],
            },
          },
        ],
      });

      expect(response.processedCount).toBe(1);
      expect(response.results[0].status).toBe('accepted');
      expect(mockBillingService.createSale).toHaveBeenCalledWith(
        'tenant-1',
        'cashier-1',
        expect.objectContaining({
          branchId: 'branch-uuid-001',
          idempotencyKey: 'INV-2026-001',
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: 'prod-uuid-1',
              quantity: '2',
              gstRatePercent: '5.00',
            }),
          ]),
        }),
      );
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

    it('pulls restaurant tables and orders when restaurantService is present', async () => {
      mockProductRepo.find.mockResolvedValueOnce([]);
      mockCategoryRepo.find.mockResolvedValueOnce([]);
      mockCustomerRepo.find.mockResolvedValueOnce([]);

      const deltas = await service.pullDeltas('tenant-1', '2026-10-31T00:00:00.000Z');

      expect(deltas.restaurantTables).toBeDefined();
      expect(deltas.restaurantTables?.length).toBe(1);
      expect(deltas.restaurantOrders).toBeDefined();
      expect(deltas.restaurantOrders?.length).toBe(1);
      expect(mockRestaurantService.getTables).toHaveBeenCalled();
    });
  });

  describe('Restaurant Dining Operations Ingestion', () => {
    it('ingests CREATE_RESTAURANT_ORDER and delegates to restaurantService', async () => {
      mockIngestedRepo.findOne.mockResolvedValueOnce(null);

      const response = await service.ingestBatch('tenant-1', 'cashier-1', {
        deviceId: 'device-pos-01',
        operations: [
          {
            operationId: 'op-rest-order-1',
            deviceId: 'device-pos-01',
            sequence: 10,
            operationType: 'CREATE_RESTAURANT_ORDER',
            schemaVersion: 1,
            occurredAt: '2026-10-31T12:00:00.000Z',
            payload: { tableId: 'tbl-1', guestCount: 4, captainName: 'Ravi' },
          },
        ],
      });

      expect(response.processedCount).toBe(1);
      expect(response.results[0].status).toBe('accepted');
      expect(response.results[0].serverEntityId).toBe('rest-order-uuid-1');
      expect(mockRestaurantService.createOrder).toHaveBeenCalled();
    });

    it('ingests DISPATCH_KOT and delegates to restaurantService', async () => {
      mockIngestedRepo.findOne.mockResolvedValueOnce(null);

      const response = await service.ingestBatch('tenant-1', 'cashier-1', {
        deviceId: 'device-pos-01',
        operations: [
          {
            operationId: 'op-kot-1',
            deviceId: 'device-pos-01',
            sequence: 11,
            operationType: 'DISPATCH_KOT',
            schemaVersion: 1,
            occurredAt: '2026-10-31T12:05:00.000Z',
            payload: { orderId: 'rest-order-uuid-1', lines: [] },
          },
        ],
      });

      expect(response.processedCount).toBe(1);
      expect(response.results[0].status).toBe('accepted');
      expect(response.results[0].serverEntityId).toBe('kot-uuid-1');
      expect(mockRestaurantService.dispatchKot).toHaveBeenCalled();
    });

    it('ingests SETTLE_RESTAURANT_ORDER and delegates to restaurantService', async () => {
      mockIngestedRepo.findOne.mockResolvedValueOnce(null);

      const response = await service.ingestBatch('tenant-1', 'cashier-1', {
        deviceId: 'device-pos-01',
        operations: [
          {
            operationId: 'op-settle-1',
            deviceId: 'device-pos-01',
            sequence: 12,
            operationType: 'SETTLE_RESTAURANT_ORDER',
            schemaVersion: 1,
            occurredAt: '2026-10-31T12:30:00.000Z',
            payload: { orderId: 'rest-order-uuid-1', paymentMethod: 'cash' },
          },
        ],
      });

      expect(response.processedCount).toBe(1);
      expect(response.results[0].status).toBe('accepted');
      expect(response.results[0].serverEntityId).toBe('rest-order-uuid-1');
      expect(mockRestaurantService.settleOrder).toHaveBeenCalled();
    });
  });
});
