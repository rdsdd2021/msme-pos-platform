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
import { CategoryEntity } from '../catalog/entities/category.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { BillingService } from '../billing/billing.service';
import {
  TableStatus,
  RestaurantOrderType,
  RestaurantOrderStatus,
  KotStatus,
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
    update: jest.fn().mockResolvedValue({ affected: 1 }),
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
    create: jest.fn().mockImplementation((dto) => ({ id: 'prod-uuid-1', ...dto })),
    save: jest.fn().mockImplementation((prod) => Promise.resolve(prod)),
  };

  const mockCategoryRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((dto) => ({ id: 'cat-uuid-1', ...dto })),
    save: jest.fn().mockImplementation((cat) => Promise.resolve(cat)),
  };

  const mockTenantRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'tenant-1',
      name: 'Test Tenant',
      settings: {},
    }),
    save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
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
        { provide: getRepositoryToken(CategoryEntity), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(TenantEntity), useValue: mockTenantRepo },
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

    it('dispatches KOT with portion variant, calculates variant line total and snapshots portion name', async () => {
      const mockOrder = {
        id: 'order-variant-1',
        tableId: 'table-1',
        tableNumberSnapshot: 'T-01',
        status: RestaurantOrderStatus.OPEN,
        subtotal: '0.00',
        taxTotal: '0.00',
        grandTotal: '0.00',
      };
      const mockProduct = {
        id: 'd19c3e41-0000-4000-8000-000000000001',
        name: 'Dal Makhani',
        sellingPrice: '280.00',
        variants: [
          { name: 'Half', price: '160.00' },
          { name: 'Full', price: '280.00' },
        ],
      };

      let savedLines: any[] = [];
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockImplementation((entity) => {
            if (entity === RestaurantOrderEntity) return Promise.resolve(mockOrder);
            return Promise.resolve(null);
          }),
          find: jest.fn().mockResolvedValue([mockProduct]),
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockImplementation((entity, dto) => ({ id: 'mock-id', ...dto })),
          save: jest.fn().mockImplementation((obj) => {
            if (Array.isArray(obj)) savedLines = obj;
            return Promise.resolve(obj);
          }),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        return cb(manager);
      });

      const result = await service.dispatchKot('tenant-1', 'branch-1', {
        orderId: 'order-variant-1',
        items: [
          {
            productId: 'd19c3e41-0000-4000-8000-000000000001',
            variantName: 'Half',
            quantity: '2.000', // 2 x 160 = 320.00
          },
        ],
      });

      expect(savedLines[0].productNameSnapshot).toBe('Dal Makhani (Half)');
      expect(savedLines[0].unitPrice).toBe('160.00');
      expect(savedLines[0].lineTotal).toBe('320.00');
      expect(result.order.subtotal).toBe('320.00');
      expect(result.order.taxTotal).toBe('16.00'); // 5% GST
      expect(result.order.grandTotal).toBe('336.00');
    });

    it('auto-provisions culinary product when productId is missing from catalog during KOT dispatch', async () => {
      const mockOrder = {
        id: 'order-autoprovision-1',
        tableId: 'table-1',
        tableNumberSnapshot: 'T-01',
        status: RestaurantOrderStatus.OPEN,
        subtotal: '0.00',
        taxTotal: '0.00',
        grandTotal: '0.00',
      };

      let savedProduct: any = null;
      let savedLines: any[] = [];
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockImplementation((entity) => {
            if (entity === RestaurantOrderEntity) return Promise.resolve(mockOrder);
            return Promise.resolve(null);
          }),
          find: jest.fn().mockResolvedValue([]), // Product not found in catalog!
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockImplementation((entity, dto) => ({ id: 'new-product-id-999', ...dto })),
          save: jest.fn().mockImplementation((obj) => {
            if (Array.isArray(obj)) {
              savedLines = obj;
            } else if (obj.name === 'mutton kosha') {
              savedProduct = obj;
            }
            return Promise.resolve(obj);
          }),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        return cb(manager);
      });

      const result = await service.dispatchKot('tenant-1', 'branch-1', {
        orderId: 'order-autoprovision-1',
        items: [
          {
            productId: 'missing-client-uuid-1',
            productName: 'mutton kosha',
            quantity: '1.000',
            unitPrice: '250.00',
          },
        ],
      });

      expect(savedProduct).not.toBeNull();
      expect(savedProduct.name).toBe('mutton kosha');
      expect(savedLines[0].productNameSnapshot).toBe('mutton kosha');
      expect(savedLines[0].unitPrice).toBe('250.00');
      expect(savedLines[0].productId).toBe('new-product-id-999');
      expect(result.order.subtotal).toBe('250.00');
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

    it('excludes cancelled KOT lines and passes verified unitPrice and customName to BillingService', async () => {
      const mockOrder = {
        id: 'order-with-cancelled-1',
        tableId: 'table-1',
        status: RestaurantOrderStatus.OPEN,
        grandTotal: '525.00',
        lines: [
          {
            productId: 'd19c3e41-0000-4000-8000-000000000001',
            productNameSnapshot: 'Paneer Butter Masala (Half)',
            quantity: '1.000',
            unitPrice: '180.00',
            lineTotal: '180.00',
            status: KotStatus.SERVED,
          },
          {
            productId: 'd19c3e41-0000-4000-8000-000000000002',
            productNameSnapshot: 'Cold Coffee (Cancelled)',
            quantity: '1.000',
            unitPrice: '120.00',
            lineTotal: '120.00',
            status: KotStatus.CANCELLED, // Voided item!
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.settleOrder('tenant-1', 'branch-1', 'user-1', {
        orderId: 'order-with-cancelled-1',
        paymentMethod: PaymentMethod.CASH,
      });

      expect(mockBillingService.createSale).toHaveBeenCalledWith(
        'tenant-1',
        'user-1',
        expect.objectContaining({
          items: [
            {
              productId: 'd19c3e41-0000-4000-8000-000000000001',
              customName: 'Paneer Butter Masala (Half)',
              unitPrice: '180.00',
              quantity: '1.000',
              discountAmount: undefined,
              gstRatePercent: '5.00',
            },
          ],
          payments: [
            {
              paymentMethod: PaymentMethod.CASH,
              amount: '189.00', // 180 + 5% GST (9.00) = 189.00 (Cancelled Cold Coffee excluded!)
            },
          ],
        }),
      );
      expect(result.order.status).toBe(RestaurantOrderStatus.COMPLETED);
    });
  });

  describe('Restaurant Settings', () => {
    it('returns default dining settings when tenant has no custom settings', async () => {
      mockTenantRepo.findOne.mockResolvedValue({
        id: 'tenant-1',
        name: 'Kirana Store',
        settings: {},
      });

      const settings = await service.getRestaurantSettings('tenant-1');
      expect(settings).toBeDefined();
      expect(settings.enableGst).toBe(true);
      expect(settings.defaultGstPercent).toBe('5.00');
      expect(settings.floorSections.length).toBeGreaterThan(0);
    });

    it('updates dining settings and persists into tenant.settings.diningSettings', async () => {
      mockTenantRepo.findOne.mockResolvedValue({
        id: 'tenant-1',
        name: 'Fine Dining Resto',
        settings: {},
      });

      const updated = await service.updateRestaurantSettings('tenant-1', 'branch-1', {
        enableGst: false,
        serviceChargePercent: '5.00',
        defaultGstPercent: '0.00',
        autoPrintKotOnFire: true,
      });

      expect(mockTenantRepo.save).toHaveBeenCalled();
      expect(updated.enableGst).toBe(false);
      expect(updated.defaultGstPercent).toBe('0.00');
      expect(updated.serviceChargePercent).toBe('5.00');
      expect(updated.autoPrintKotOnFire).toBe(true);
    });

    it('settles order with 0% GST when restaurant GST is disabled', async () => {
      mockTenantRepo.findOne.mockResolvedValue({
        id: 'tenant-1',
        name: 'Exempt Eatery',
        settings: {
          diningSettings: {
            enableGst: false,
            defaultGstPercent: '0.00',
          },
        },
      });

      const mockOrder: any = {
        id: 'order-non-gst-1',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        tableId: 'table-1',
        status: RestaurantOrderStatus.OPEN,
        subtotal: '200.00',
        taxTotal: '0.00',
        grandTotal: '200.00',
        lines: [
          {
            id: 'line-1',
            productId: 'prod-1',
            productNameSnapshot: 'Special Thali',
            unitPrice: '200.00',
            quantity: '1.000',
            lineTotal: '200.00',
            status: KotStatus.SERVED,
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.settleOrder('tenant-1', 'branch-1', 'user-1', {
        orderId: 'order-non-gst-1',
        paymentMethod: PaymentMethod.CASH,
      });

      expect(mockBillingService.createSale).toHaveBeenCalledWith(
        'tenant-1',
        'user-1',
        expect.objectContaining({
          items: [
            {
              productId: 'prod-1',
              customName: 'Special Thali',
              unitPrice: '200.00',
              quantity: '1.000',
              discountAmount: undefined,
              gstRatePercent: '0.00',
            },
          ],
          payments: [
            {
              paymentMethod: PaymentMethod.CASH,
              amount: '200.00',
            },
          ],
        }),
      );
      expect(result.order.status).toBe(RestaurantOrderStatus.COMPLETED);
    });
  });

  describe('AI Menu Parse & Import', () => {
    it('falls back gracefully to parsed sample dishes when Gemini API key is not present', async () => {
      const result = await service.parseMenuImageWithAI('tenant-1', 'mockBase64String', 'image/jpeg');
      expect(result).toBeDefined();
      expect(result.dishes.length).toBeGreaterThan(0);
      expect(result.dishes[0]).toHaveProperty('name');
      expect(result.dishes[0]).toHaveProperty('price');
      expect(result.dishes[0]).toHaveProperty('category');
    });

    it('imports dishes and auto-provisions missing categories and products', async () => {
      mockCategoryRepo.find.mockResolvedValue([]);
      mockCategoryRepo.save.mockImplementation((c) => Promise.resolve({ id: 'cat-123', ...c }));
      mockProductRepo.save.mockImplementation((p) => Promise.resolve({ id: 'prod-123', ...p }));

      const importResult = await service.importMenuDishes('tenant-1', 'branch-1', [
        {
          name: 'Butter Naan',
          price: '40.00',
          category: 'Breads',
          foodType: 'veg',
          kitchenStation: 'tandoor',
        },
        {
          name: 'Chicken Biryani',
          price: '240.00',
          category: 'Biryani & Rice',
          foodType: 'non_veg',
          kitchenStation: 'kitchen',
        },
      ]);

      expect(importResult.importedCount).toBe(2);
      expect(importResult.categoriesCreated).toBe(2);
      expect(importResult.dishes.length).toBe(2);
    });
  });
});
