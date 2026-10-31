import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';
import { UnitEntity } from './entities/unit.entity';
import { SupplierEntity } from './entities/supplier.entity';
import { StockLedgerEntity } from './entities/stock-ledger.entity';
import { StockBalanceEntity } from './entities/stock-balance.entity';
import { StockMovementType } from '@pos/shared-types';

describe('CatalogService & Inventory Reconciliation', () => {
  let service: CatalogService;
  let mockCategoryRepo: any;
  let mockProductRepo: any;
  let mockUnitRepo: any;
  let mockSupplierRepo: any;
  let mockStockLedgerRepo: any;
  let mockStockBalanceRepo: any;
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
      save: jest.fn((dto) => dto),
      create: jest.fn((dto) => dto),
      find: jest.fn(),
    };
    mockUnitRepo = { find: jest.fn() };
    mockSupplierRepo = { find: jest.fn() };
    mockStockLedgerRepo = { findOne: jest.fn(), save: jest.fn() };
    mockStockBalanceRepo = {
      createQueryBuilder: jest.fn(),
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
        { provide: getRepositoryToken(StockLedgerEntity), useValue: mockStockLedgerRepo },
        { provide: getRepositoryToken(StockBalanceEntity), useValue: mockStockBalanceRepo },
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
  });

  describe('Products', () => {
    it('creates product with decimal price and uppercase SKU', async () => {
      mockProductRepo.findOne.mockResolvedValueOnce(null);
      const result = await service.createProduct('tenant-1', {
        name: 'Basmati Rice 5kg',
        sku: 'rice-5kg',
        purchaseCost: '450.00',
        sellingPrice: '520.00',
        mrp: '550.00',
      });
      expect(result.sku).toBe('RICE-5KG');
      expect(result.sellingPrice).toBe('520.00');
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
  });

  describe('Inventory Reconciliation & Idempotency', () => {
    it('records opening stock movement and updates balance projection atomically', async () => {
      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(null) // idempotency check
          .mockResolvedValueOnce({ id: 'prod-1' }) // product validation
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
        findOne: jest.fn()
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
        findOne: jest.fn()
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
});

