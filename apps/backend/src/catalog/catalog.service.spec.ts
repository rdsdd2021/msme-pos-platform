import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';
import { UnitEntity } from './entities/unit.entity';
import { SupplierEntity } from './entities/supplier.entity';
import { PurchaseOrderEntity, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderLineEntity } from './entities/purchase-order-line.entity';
import { StockLedgerEntity } from './entities/stock-ledger.entity';
import { StockBalanceEntity } from './entities/stock-balance.entity';
import { StockTransferEntity } from './entities/stock-transfer.entity';
import { StockTransferLineEntity } from './entities/stock-transfer-line.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { StockMovementType, StockTransferStatus } from '@pos/shared-types';

describe('CatalogService & Inventory Reconciliation', () => {
  let service: CatalogService;
  let mockCategoryRepo: any;
  let mockProductRepo: any;
  let mockUnitRepo: any;
  let mockSupplierRepo: any;
  let mockPoRepo: any;
  let mockPoLineRepo: any;
  let mockStockLedgerRepo: any;
  let mockStockBalanceRepo: any;
  let mockTransferRepo: any;
  let mockTransferLineRepo: any;
  let mockBranchRepo: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockCategoryRepo = {
      findOne: jest.fn(),
      save: jest.fn((dto) => dto),
      create: jest.fn((dto) => dto),
      find: jest.fn(),
    };
    mockProductRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn((dto) => dto),
      create: jest.fn((dto) => dto),
      find: jest.fn(),
    };
    mockUnitRepo = {
      findOne: jest.fn(),
      save: jest.fn((dto) => dto),
      create: jest.fn((dto) => dto),
      find: jest.fn(),
    };
    mockSupplierRepo = {
      findOne: jest.fn(),
      save: jest.fn((dto) => dto),
      create: jest.fn((dto) => dto),
      find: jest.fn(),
    };
    mockPoRepo = {
      findOne: jest.fn(),
      save: jest.fn((dto) => dto),
      create: jest.fn((dto) => dto),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    mockPoLineRepo = {
      findOne: jest.fn(),
      save: jest.fn((dto) => dto),
      create: jest.fn((dto) => dto),
      find: jest.fn(),
    };
    mockStockLedgerRepo = { findOne: jest.fn(), save: jest.fn() };
    mockStockBalanceRepo = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
    };

    mockTransferRepo = {
      findOne: jest.fn(),
      save: jest.fn((dto) => dto),
      create: jest.fn((dto) => dto),
      find: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    mockTransferLineRepo = {
      findOne: jest.fn(),
      save: jest.fn((dto) => dto),
      create: jest.fn((dto) => dto),
      find: jest.fn(),
    };
    mockBranchRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: getRepositoryToken(CategoryEntity), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(ProductEntity), useValue: mockProductRepo },
        { provide: getRepositoryToken(UnitEntity), useValue: mockUnitRepo },
        { provide: getRepositoryToken(SupplierEntity), useValue: mockSupplierRepo },
        { provide: getRepositoryToken(PurchaseOrderEntity), useValue: mockPoRepo },
        { provide: getRepositoryToken(PurchaseOrderLineEntity), useValue: mockPoLineRepo },
        { provide: getRepositoryToken(StockLedgerEntity), useValue: mockStockLedgerRepo },
        { provide: getRepositoryToken(StockBalanceEntity), useValue: mockStockBalanceRepo },
        { provide: getRepositoryToken(StockTransferEntity), useValue: mockTransferRepo },
        { provide: getRepositoryToken(StockTransferLineEntity), useValue: mockTransferLineRepo },
        { provide: getRepositoryToken(BranchEntity), useValue: mockBranchRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  describe('Categories', () => {
    it('creates category with uppercase code', async () => {
      mockCategoryRepo.findOne.mockResolvedValueOnce(null);
      const result = await service.createCategory('tenant-1', {
        name: 'Beverages',
        code: 'bev',
      });
      expect(result.code).toBe('BEV');
    });

    it('rejects duplicate category code in same tenant', async () => {
      mockCategoryRepo.findOne.mockResolvedValueOnce({ id: 'cat-1', code: 'BEV' });
      await expect(
        service.createCategory('tenant-1', { name: 'Beverages', code: 'BEV' }),
      ).rejects.toThrow(ConflictException);
    });

    it('deactivates category on delete', async () => {
      const cat = { id: 'cat-1', tenantId: 'tenant-1', isActive: true };
      mockCategoryRepo.findOne.mockResolvedValueOnce(cat);
      const res = await service.deleteCategory('tenant-1', 'cat-1');
      expect(res.success).toBe(true);
      expect(cat.isActive).toBe(false);
    });
  });

  describe('Units of Measurement', () => {
    it('creates a new unit when symbol is unique', async () => {
      mockUnitRepo.findOne.mockResolvedValueOnce(null);
      const unit = await service.createUnit('tenant-1', {
        name: 'Kilogram',
        symbol: 'kg',
        decimalPlaces: 3,
      });
      expect(unit.symbol).toBe('KG');
      expect(unit.decimalPlaces).toBe(3);
    });

    it('rejects duplicate unit symbol', async () => {
      mockUnitRepo.findOne.mockResolvedValueOnce({ id: 'unit-1', symbol: 'KG' });
      await expect(
        service.createUnit('tenant-1', { name: 'Kilogram', symbol: 'KG' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Products', () => {
    it('creates product with decimal price and uppercase SKU', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);
      const result = await service.createProduct('tenant-1', {
        name: 'Basmati Rice 5kg',
        sku: 'rice-5kg',
        purchaseCost: '450.00',
        sellingPrice: '520.00',
        mrp: '550.00',
        hsnCode: '10063020',
        gstRatePercent: '0.00',
        packageSize: '5 kg',
      });
      expect(result.sku).toBe('RICE-5KG');
      expect(result.sellingPrice).toBe('520.00');
      expect(result.packageSize).toBe('5 kg');
    });

    it('rejects duplicate SKU in same tenant', async () => {
      mockProductRepo.findOne.mockResolvedValueOnce({ id: 'prod-1' });
      await expect(
        service.createProduct('tenant-1', {
          name: 'Basmati Rice',
          sku: 'RICE-5KG',
          purchaseCost: '450.00',
          sellingPrice: '520.00',
          mrp: '550.00',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects duplicate barcode in same tenant', async () => {
      mockProductRepo.findOne
        .mockResolvedValueOnce(null) // SKU check passes
        .mockResolvedValueOnce({ id: 'prod-existing', name: 'Other Rice', sku: 'RICE-OLD' }); // Barcode check hits

      await expect(
        service.createProduct('tenant-1', {
          name: 'Basmati Rice',
          sku: 'RICE-5KG',
          barcodePrimary: '8901234567890',
          purchaseCost: '450.00',
          sellingPrice: '520.00',
          mrp: '550.00',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects selling price higher than MRP', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createProduct('tenant-1', {
          name: 'Basmati Rice',
          sku: 'RICE-5KG',
          purchaseCost: '450.00',
          sellingPrice: '600.00', // exceeds MRP 550.00
          mrp: '550.00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates product and atomic opening stock in one transaction', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      const mockManager = {
        create: jest.fn((entity, data) => data),
        save: jest.fn(async (data) => ({ id: 'new-prod-uuid', ...data })),
        findOne: jest.fn().mockResolvedValue(null),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const res = await service.createProduct('tenant-1', {
        name: 'Fortune Sunflower Oil 1L',
        sku: 'FORT-1L',
        purchaseCost: '130.00',
        sellingPrice: '150.00',
        mrp: '160.00',
        openingStockQuantity: '20.000',
        openingStockBranchId: 'branch-1',
      });

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(res.sku).toBe('FORT-1L');
    });

    it('updates product and increments version', async () => {
      const existing = {
        id: 'prod-1',
        tenantId: 'tenant-1',
        sku: 'RICE-5KG',
        name: 'Old Name',
        sellingPrice: '500.00',
        mrp: '550.00',
        version: 1,
      };
      mockProductRepo.findOne.mockResolvedValue(existing);

      const updated = await service.updateProduct('tenant-1', 'prod-1', {
        name: 'New Basmati Rice 5kg',
        sellingPrice: '520.00',
      });

      expect(updated.name).toBe('New Basmati Rice 5kg');
      expect(updated.sellingPrice).toBe('520.00');
      expect(updated.version).toBe(2);
    });

    it('soft-deletes product setting isActive false and archivedAt timestamp', async () => {
      const existing = {
        id: 'prod-1',
        tenantId: 'tenant-1',
        isActive: true,
        archivedAt: null,
      };
      mockProductRepo.findOne.mockResolvedValue(existing);

      const res = await service.deleteProduct('tenant-1', 'prod-1');
      expect(res.success).toBe(true);
      expect(existing.isActive).toBe(false);
      expect(existing.archivedAt).toBeInstanceOf(Date);
    });
  });

  describe('Inventory Reconciliation & Idempotency', () => {
    it('records opening stock movement and updates balance projection atomically', async () => {
      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // idempotency check
          .mockResolvedValueOnce({ id: 'prod-1', purchaseCost: '100.00' }) // product validation
          .mockResolvedValueOnce(null), // initial balance lookup
        create: jest.fn((entity, data) => data),
        save: jest.fn(async (data) => data),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const result = await service.recordStockMovement('tenant-1', 'user-1', {
        branchId: 'branch-1',
        productId: 'prod-1',
        movementType: StockMovementType.OPENING,
        quantityDelta: '25.000',
        unitCost: '100.00',
        sourceType: 'manual',
        sourceId: 'init-1',
        idempotencyKey: 'idem-key-1',
      });

      expect(result.ledger.quantityDelta).toBe('25.000');
      expect(result.balance.quantityOnHand).toBe('25.000');
    });

    it('returns existing movement without duplicate ledger entry when idempotencyKey repeats', async () => {
      const existingLedger = {
        id: 'ledger-existing',
        idempotencyKey: 'idem-key-repeated',
        quantityDelta: '10.000',
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(existingLedger) // idempotency hit
          .mockResolvedValueOnce({ quantityOnHand: '10.000' }), // balance
        save: jest.fn(),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const result = await service.recordStockMovement('tenant-1', 'user-1', {
        branchId: 'branch-1',
        productId: 'prod-1',
        movementType: StockMovementType.PURCHASE,
        quantityDelta: '10.000',
        unitCost: '100.00',
        sourceType: 'purchase',
        sourceId: 'inv-1',
        idempotencyKey: 'idem-key-repeated',
      });

      expect(result.ledger.id).toBe('ledger-existing');
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('rejects stock movement for non-existent product', async () => {
      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // idempotency check
          .mockResolvedValueOnce(null), // product validation fails
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.recordStockMovement('tenant-1', 'user-1', {
          branchId: 'branch-1',
          productId: 'non-existent',
          movementType: StockMovementType.ADJUSTMENT,
          quantityDelta: '-5.000',
          unitCost: '0.00',
          sourceType: 'manual',
          sourceId: 'adj-1',
          idempotencyKey: 'key-new',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Suppliers', () => {
    it('creates a supplier with trimmed fields', async () => {
      const result = await service.createSupplier('tenant-1', {
        name: '  Amul Dairy Cooperative  ',
        contactPerson: '  Verghese K  ',
        phone: '9876543210',
        email: 'amul@coop.org',
        gstin: '24AAAAA0000A1Z5',
      });
      expect(result.name).toBe('Amul Dairy Cooperative');
      expect(result.contactPerson).toBe('Verghese K');
      expect(result.isActive).toBe(true);
    });

    it('lists active suppliers', async () => {
      mockSupplierRepo.find.mockResolvedValueOnce([
        { id: 'sup-1', name: 'Amul', isActive: true },
        { id: 'sup-2', name: 'Tata Tea', isActive: true },
      ]);
      const list = await service.getSuppliers('tenant-1');
      expect(list).toHaveLength(2);
      expect(mockSupplierRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isActive: true },
        order: { name: 'ASC' },
      });
    });

    it('updates existing supplier', async () => {
      const existing = { id: 'sup-1', tenantId: 'tenant-1', name: 'Old Name', isActive: true };
      mockSupplierRepo.findOne.mockResolvedValueOnce(existing);
      const updated = await service.updateSupplier('tenant-1', 'sup-1', {
        name: 'New Supplier Name',
      });
      expect(updated.name).toBe('New Supplier Name');
    });

    it('soft-deletes supplier by marking inactive', async () => {
      const existing = { id: 'sup-1', tenantId: 'tenant-1', name: 'Amul', isActive: true };
      mockSupplierRepo.findOne.mockResolvedValueOnce(existing);
      const archived = await service.deleteSupplier('tenant-1', 'sup-1');
      expect(archived.isActive).toBe(false);
    });
  });

  describe('Purchase Orders & GRN Receiving', () => {
    it('creates purchase order with calculated lines and GST', async () => {
      mockSupplierRepo.findOne.mockResolvedValueOnce({
        id: 'sup-1',
        name: 'ITC Ltd',
        isActive: true,
      });

      const mockProduct = {
        id: 'prod-1',
        name: 'Aashirvaad Atta',
        gstRatePercent: '5.00',
      };

      const mockManager = {
        findByIds: jest.fn().mockResolvedValueOnce([mockProduct]),
        create: jest.fn((entity, data) => ({ id: 'po-1', ...data })),
        save: jest.fn().mockImplementation(async (entity, data) => data),
        findOneOrFail: jest.fn().mockResolvedValueOnce({
          id: 'po-1',
          orderNumber: 'PO-TEST-001',
          subtotal: '2000.00',
          taxAmount: '100.00',
          totalAmount: '2100.00',
          status: PurchaseOrderStatus.DRAFT,
          lines: [
            {
              id: 'line-1',
              productId: 'prod-1',
              quantityOrdered: '10.000',
              quantityReceived: '0.000',
              unitCost: '200.00',
              taxRatePercent: '5.00',
              lineTotal: '2100.00',
            },
          ],
        }),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const po = await service.createPurchaseOrder('tenant-1', 'user-1', {
        branchId: 'branch-1',
        supplierId: 'sup-1',
        orderNumber: 'PO-TEST-001',
        lines: [
          {
            productId: 'prod-1',
            quantityOrdered: '10.000',
            unitCost: '200.00',
          },
        ],
      });

      expect(po.orderNumber).toBe('PO-TEST-001');
      expect(po.totalAmount).toBe('2100.00');
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('rejects purchase order if supplier does not exist', async () => {
      mockSupplierRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createPurchaseOrder('tenant-1', 'user-1', {
          branchId: 'branch-1',
          supplierId: 'missing-sup',
          lines: [{ productId: 'p-1', quantityOrdered: '5.000', unitCost: '50.00' }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('receives goods (GRN): creates stock ledger entry with movementType PURCHASE and updates stock balance', async () => {
      const mockPo = {
        id: 'po-1',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        orderNumber: 'PO-TEST-001',
        status: PurchaseOrderStatus.ORDERED,
        lines: [
          {
            id: 'line-1',
            productId: 'prod-1',
            quantityOrdered: '10.000',
            quantityReceived: '0.000',
            unitCost: '200.00',
          },
        ],
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(mockPo) // find PO
          .mockResolvedValueOnce(null) // check idempotency for ledger
          .mockResolvedValueOnce({ quantityOnHand: '5.000' }), // existing balance
        create: jest.fn((entity, data) => data),
        save: jest.fn().mockImplementation(async (entity, data) => data),
        findOneOrFail: jest.fn().mockResolvedValueOnce({
          ...mockPo,
          status: PurchaseOrderStatus.RECEIVED,
        }),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const updatedPo = await service.receiveGoods('tenant-1', 'user-1', 'po-1', {
        items: [{ lineId: 'line-1', quantityReceived: '10.000' }],
      });

      expect(mockManager.save).toHaveBeenCalled();
      expect(updatedPo.status).toBe(PurchaseOrderStatus.RECEIVED);
    });

    it('rejects receiving goods on a cancelled purchase order', async () => {
      const mockPo = {
        id: 'po-1',
        tenantId: 'tenant-1',
        status: PurchaseOrderStatus.CANCELLED,
        lines: [],
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValueOnce(mockPo),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.receiveGoods('tenant-1', 'user-1', 'po-1', {
          items: [{ lineId: 'line-1', quantityReceived: '5.000' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Multi-Branch Stock Transfers & Reconciliation', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const sourceBranchId = 'branch-source-1';
    const destBranchId = 'branch-dest-2';
    const productId = 'prod-1';

    it('rejects transfer when source and destination branch are the same', async () => {
      await expect(
        service.createStockTransfer(tenantId, userId, {
          sourceBranchId: 'branch-1',
          destinationBranchId: 'branch-1',
          lines: [{ productId, quantityRequested: '10.000' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects transfer if source branch does not exist', async () => {
      mockBranchRepo.findOne.mockResolvedValueOnce(null); // source
      mockBranchRepo.findOne.mockResolvedValueOnce({ id: destBranchId, tenantId }); // dest

      await expect(
        service.createStockTransfer(tenantId, userId, {
          sourceBranchId,
          destinationBranchId: destBranchId,
          lines: [{ productId, quantityRequested: '10.000' }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a draft stock transfer with lines and calculated total', async () => {
      mockBranchRepo.findOne
        .mockResolvedValueOnce({ id: sourceBranchId, tenantId, name: 'Main Store' })
        .mockResolvedValueOnce({ id: destBranchId, tenantId, name: 'West Branch' });

      mockTransferRepo.findOne.mockResolvedValueOnce(null); // unique number check

      mockProductRepo.findOne.mockResolvedValueOnce({
        id: productId,
        tenantId,
        name: 'Basmati Rice',
        purchaseCost: '120.00',
        isActive: true,
      });

      mockTransferRepo.save.mockImplementationOnce(async (t: any) => ({
        ...t,
        id: 'trans-1',
        createdAt: new Date(),
      }));

      mockProductRepo.findOneOrFail.mockResolvedValueOnce({
        id: productId,
        tenantId,
        purchaseCost: '120.00',
      });

      mockTransferLineRepo.save.mockResolvedValueOnce([]);

      mockTransferRepo.findOne.mockResolvedValueOnce({
        id: 'trans-1',
        tenantId,
        transferNumber: 'TRF-TEST-001',
        status: StockTransferStatus.DRAFT,
        totalItemsRequested: '15.000',
        sourceBranchId,
        destinationBranchId: destBranchId,
        lines: [
          {
            id: 'line-1',
            productId,
            quantityRequested: '15.000',
            quantityDispatched: '0.000',
            quantityReceived: '0.000',
          },
        ],
      });

      const result = await service.createStockTransfer(tenantId, userId, {
        sourceBranchId,
        destinationBranchId: destBranchId,
        transferNumber: 'TRF-TEST-001',
        lines: [{ productId, quantityRequested: '15.000' }],
      });

      expect(result.id).toBe('trans-1');
      expect(result.status).toBe(StockTransferStatus.DRAFT);
      expect(result.totalItemsRequested).toBe('15.000');
    });

    it('rejects dispatching when source branch has insufficient stock', async () => {
      const mockTransfer = {
        id: 'trans-1',
        tenantId,
        status: StockTransferStatus.DRAFT,
        sourceBranchId,
        destinationBranchId: destBranchId,
        lines: [{ id: 'line-1', productId, quantityRequested: '20.000' }],
      };

      mockTransferRepo.findOne.mockResolvedValueOnce(mockTransfer);

      const mockManager = {
        findOne: jest.fn().mockImplementation((entity: any) => {
          if (entity === StockBalanceEntity) {
            return {
              tenantId,
              branchId: sourceBranchId,
              productId,
              quantityOnHand: '5.000', // only 5 on hand, requested 20
            };
          }
          return null;
        }),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(service.dispatchStockTransfer(tenantId, userId, 'trans-1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('dispatches transfer atomically: creates TRANSFER_OUT ledger and decrements stock', async () => {
      const mockTransfer = {
        id: 'trans-1',
        tenantId,
        transferNumber: 'TRF-2026-001',
        status: StockTransferStatus.DRAFT,
        sourceBranchId,
        destinationBranchId: destBranchId,
        totalItemsRequested: '10.000',
        lines: [
          {
            id: 'line-1',
            productId,
            quantityRequested: '10.000',
            quantityDispatched: '0.000',
            unitCost: '120.00',
          },
        ],
      };

      mockTransferRepo.findOne.mockResolvedValueOnce(mockTransfer);

      const mockBalance = {
        tenantId,
        branchId: sourceBranchId,
        productId,
        quantityOnHand: '50.000',
      };

      const mockManager = {
        findOne: jest.fn().mockImplementation((entity: any) => {
          if (entity === StockBalanceEntity) return mockBalance;
          return null;
        }),
        create: jest.fn((entity: any, dto: any) => dto),
        save: jest.fn((entityOrDto: any, dto?: any) => dto || entityOrDto),
        findOneOrFail: jest.fn().mockResolvedValueOnce({
          ...mockTransfer,
          status: StockTransferStatus.IN_TRANSIT,
          totalItemsDispatched: '10.000',
        }),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const dispatched = await service.dispatchStockTransfer(tenantId, userId, 'trans-1', {});

      expect(mockBalance.quantityOnHand).toBe('40.000'); // 50 - 10 = 40
      expect(dispatched.status).toBe(StockTransferStatus.IN_TRANSIT);
    });

    it('receives transfer atomically and flags discrepancy when received < dispatched', async () => {
      const mockTransfer = {
        id: 'trans-1',
        tenantId,
        transferNumber: 'TRF-2026-001',
        status: StockTransferStatus.IN_TRANSIT,
        sourceBranchId,
        destinationBranchId: destBranchId,
        totalItemsDispatched: '10.000',
        lines: [
          {
            id: 'line-1',
            productId,
            quantityDispatched: '10.000',
            quantityReceived: '0.000',
            unitCost: '120.00',
          },
        ],
      };

      mockTransferRepo.findOne.mockResolvedValueOnce(mockTransfer);

      const mockDestBalance = {
        tenantId,
        branchId: destBranchId,
        productId,
        quantityOnHand: '2.000',
      };

      const mockManager = {
        findOne: jest.fn().mockImplementation((entity: any) => {
          if (entity === StockBalanceEntity) return mockDestBalance;
          return null;
        }),
        create: jest.fn((entity: any, dto: any) => dto),
        save: jest.fn((entityOrDto: any, dto?: any) => dto || entityOrDto),
        findOneOrFail: jest.fn().mockResolvedValueOnce({
          ...mockTransfer,
          status: StockTransferStatus.RECEIVED,
          hasDiscrepancy: true,
          discrepancyReason: '1 carton damaged in transit',
          totalItemsReceived: '8.000',
        }),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      // Dispatched 10, received 8 (2 missing/damaged)
      const received = await service.receiveStockTransfer(tenantId, userId, 'trans-1', {
        items: [{ lineId: 'line-1', quantityReceived: '8.000' }],
        discrepancyReason: '1 carton damaged in transit',
      });

      expect(mockDestBalance.quantityOnHand).toBe('10.000'); // 2 + 8 = 10
      expect(received.status).toBe(StockTransferStatus.RECEIVED);
      expect(received.hasDiscrepancy).toBe(true);
    });

    it('cancels transfer and reverses stock if already in transit', async () => {
      const mockTransfer = {
        id: 'trans-1',
        tenantId,
        transferNumber: 'TRF-2026-001',
        status: StockTransferStatus.IN_TRANSIT,
        sourceBranchId,
        destinationBranchId: destBranchId,
        lines: [
          {
            id: 'line-1',
            productId,
            quantityDispatched: '10.000',
            unitCost: '120.00',
          },
        ],
      };

      mockTransferRepo.findOne.mockResolvedValueOnce(mockTransfer);

      const mockSourceBalance = {
        tenantId,
        branchId: sourceBranchId,
        productId,
        quantityOnHand: '40.000',
      };

      const mockManager = {
        findOne: jest.fn().mockImplementation((entity: any) => {
          if (entity === StockBalanceEntity) return mockSourceBalance;
          return null;
        }),
        create: jest.fn((entity: any, dto: any) => dto),
        save: jest.fn((entityOrDto: any, dto?: any) => dto || entityOrDto),
        findOneOrFail: jest.fn().mockResolvedValueOnce({
          ...mockTransfer,
          status: StockTransferStatus.CANCELLED,
        }),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const cancelled = await service.cancelStockTransfer(tenantId, userId, 'trans-1', {
        reason: 'Order cancelled by regional manager',
      });

      expect(mockSourceBalance.quantityOnHand).toBe('50.000'); // 40 + 10 = 50 reversed back!
      expect(cancelled.status).toBe(StockTransferStatus.CANCELLED);
    });

    it('retrieves paginated stock transfers with filters', async () => {
      const mockList = [{ id: 'trans-1', status: StockTransferStatus.IN_TRANSIT }];
      mockTransferRepo.findAndCount.mockResolvedValueOnce([mockList, 1]);

      const result = await service.getStockTransfers(tenantId, {
        branchId: sourceBranchId,
        status: StockTransferStatus.IN_TRANSIT,
        page: 1,
        limit: 10,
      });

      expect(mockTransferRepo.findAndCount).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });
});
