import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantTableEntity } from './entities/restaurant-table.entity';
import { RestaurantOrderEntity } from './entities/restaurant-order.entity';
import { RestaurantKotEntity } from './entities/restaurant-kot.entity';
import { RestaurantKotLineEntity } from './entities/restaurant-kot-line.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { BillingService } from '../billing/billing.service';
import {
  TableStatus,
  RestaurantOrderType,
  RestaurantOrderStatus,
  KitchenStation,
  PaymentMethod,
} from '@pos/shared-types';

describe('RestaurantService', () => {
  let service: RestaurantService;

  const mockTableRepo = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn().mockImplementation((dto) => ({ id: 'table-uuid-1', ...dto })),
    save: jest.fn().mockImplementation((table) => Promise.resolve(table)),
    count: jest.fn(),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockOrderRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn().mockImplementation((dto) => ({ id: 'order-uuid-1', ...dto })),
    save: jest.fn().mockImplementation((order) => Promise.resolve(order)),
  };

  const mockKotRepo = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn().mockImplementation((dto) => ({ id: 'kot-uuid-1', ...dto })),
    save: jest.fn().mockImplementation((kot) => Promise.resolve(kot)),
    count: jest.fn(),
  };

  const mockKotLineRepo = {
    create: jest.fn().mockImplementation((dto) => ({ id: 'kot-line-uuid-1', ...dto })),
    save: jest.fn().mockImplementation((lines) => Promise.resolve(lines)),
  };

  const mockProductRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockBillingService = {
    createSale: jest.fn().mockResolvedValue({
      id: 'invoice-uuid-1',
      invoiceNumber: 'INV-20261103-0001',
      grandTotal: '525.00',
    }),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((cb) => {
      const mockManager = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn().mockImplementation((entity, dto) => ({ id: 'mock-uuid', ...dto })),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        count: jest.fn().mockResolvedValue(0),
      };
      return cb(mockManager);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantService,
        { provide: getRepositoryToken(RestaurantTableEntity), useValue: mockTableRepo },
        { provide: getRepositoryToken(RestaurantOrderEntity), useValue: mockOrderRepo },
        { provide: getRepositoryToken(RestaurantKotEntity), useValue: mockKotRepo },
        { provide: getRepositoryToken(RestaurantKotLineEntity), useValue: mockKotLineRepo },
        { provide: getRepositoryToken(ProductEntity), useValue: mockProductRepo },
        { provide: BillingService, useValue: mockBillingService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
  });

  describe('Table Management', () => {
    it('creates a new table with VACANT status', async () => {
      mockTableRepo.findOne.mockResolvedValue(null);

      const result = await service.createTable('tenant-1', 'branch-1', {
        tableNumber: 'T-01',
        tableName: 'Window Table',
        section: 'Main Dining',
        seatingCapacity: 4,
      });

      expect(mockTableRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tableNumber: 'T-01',
          status: TableStatus.VACANT,
        }),
      );
      expect(result.tableNumber).toBe('T-01');
    });

    it('throws ConflictException if tableNumber already exists in branch', async () => {
      mockTableRepo.findOne.mockResolvedValue({ id: 'existing-id', tableNumber: 'T-01' });

      await expect(
        service.createTable('tenant-1', 'branch-1', {
          tableNumber: 'T-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('seeds 12 default tables if branch has no tables', async () => {
      mockTableRepo.count.mockResolvedValue(0);

      await service.seedDefaultTables('tenant-1', 'branch-1');

      expect(mockTableRepo.save).toHaveBeenCalled();
    });
  });

  describe('Dining Order & Seating', () => {
    it('creates a dining order and marks table as SEATED', async () => {
      const mockTable = {
        id: 'table-1',
        tableNumber: 'T-01',
        section: 'Main Dining',
        status: TableStatus.VACANT,
      };

      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockImplementation((entity) => {
            if (entity === RestaurantTableEntity) return Promise.resolve(mockTable);
            return Promise.resolve(null);
          }),
          create: jest.fn().mockImplementation((entity, dto) => ({ id: 'order-1', ...dto })),
          save: jest.fn().mockImplementation((obj) => Promise.resolve(obj)),
        };
        return cb(manager);
      });

      const order = await service.createOrder('tenant-1', 'branch-1', {
        tableId: 'table-1',
        guestCount: 2,
        orderType: RestaurantOrderType.DINE_IN,
      });

      expect(order.tableId).toBe('table-1');
      expect(order.status).toBe(RestaurantOrderStatus.OPEN);
      expect(mockTable.status).toBe(TableStatus.SEATED);
    });
  });

  describe('KOT Dispatch', () => {
    it('dispatches KOT, calculates line total, and sets table status to ORDERED', async () => {
      const mockOrder = {
        id: 'order-1',
        tableId: 'table-1',
        tableNumberSnapshot: 'T-01',
        status: RestaurantOrderStatus.OPEN,
        subtotal: '0.00',
        taxTotal: '0.00',
        grandTotal: '0.00',
      };
      const mockProduct = {
        id: 'prod-1',
        name: 'Paneer Tikka',
        sellingPrice: '250.00',
      };

      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(mockOrder),
          find: jest.fn().mockResolvedValue([mockProduct]),
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockImplementation((entity, dto) => ({ id: 'kot-1', ...dto })),
          save: jest.fn().mockImplementation((obj) => Promise.resolve(obj)),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        return cb(manager);
      });

      const result = await service.dispatchKot('tenant-1', 'branch-1', {
        orderId: 'order-1',
        items: [
          {
            productId: 'prod-1',
            quantity: '2.000',
            specialInstructions: 'Less spicy',
            kitchenStation: KitchenStation.MAIN_KITCHEN,
          },
        ],
      });

      expect(result.kot.kotNumber).toBe('KOT-01');
      expect(result.order.subtotal).toBe('500.00'); // 2 x 250
      expect(result.order.taxTotal).toBe('25.00'); // 5% GST
      expect(result.order.grandTotal).toBe('525.00');
    });
  });

  describe('Table Settlement', () => {
    it('bridges into BillingService.createSale and marks table VACANT', async () => {
      const mockOrder = {
        id: 'order-1',
        tableId: 'table-1',
        status: RestaurantOrderStatus.OPEN,
        grandTotal: '525.00',
        lines: [
          {
            productId: 'prod-1',
            quantity: '2.000',
            unitPrice: '250.00',
            lineTotal: '500.00',
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.settleOrder('tenant-1', 'branch-1', 'user-1', {
        orderId: 'order-1',
        paymentMethod: PaymentMethod.CASH,
      });

      expect(mockBillingService.createSale).toHaveBeenCalled();
      expect(result.order.status).toBe(RestaurantOrderStatus.COMPLETED);
      expect(mockTableRepo.update).toHaveBeenCalledWith(
        { id: 'table-1' },
        expect.objectContaining({ status: TableStatus.VACANT }),
      );
    });
  });
});
