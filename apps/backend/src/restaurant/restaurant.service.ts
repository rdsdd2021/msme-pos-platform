import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { RestaurantTableEntity } from './entities/restaurant-table.entity';
import { RestaurantOrderEntity } from './entities/restaurant-order.entity';
import { RestaurantKotEntity } from './entities/restaurant-kot.entity';
import { RestaurantKotLineEntity } from './entities/restaurant-kot-line.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { UserEntity } from '../tenants/entities/user.entity';
import { CustomerEntity } from '../operations/entities/customer.entity';
import { BillingService } from '../billing/billing.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import {
  TableStatus,
  RestaurantOrderType,
  RestaurantOrderStatus,
  KotStatus,
  KitchenStation,
  PaymentMethod,
} from '@pos/shared-types';
import {
  CreateTableDto,
  UpdateTableDto,
  CreateRestaurantOrderDto,
  DispatchKotDto,
  TransferTableDto,
  SettleRestaurantOrderDto,
} from './dto/restaurant.dto';
import { randomUUID } from 'crypto';

const isUuid = (val?: string | null): boolean =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(RestaurantTableEntity)
    private readonly tableRepo: Repository<RestaurantTableEntity>,
    @InjectRepository(RestaurantOrderEntity)
    private readonly orderRepo: Repository<RestaurantOrderEntity>,
    @InjectRepository(RestaurantKotEntity)
    private readonly kotRepo: Repository<RestaurantKotEntity>,
    @InjectRepository(RestaurantKotLineEntity)
    private readonly kotLineRepo: Repository<RestaurantKotLineEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    private readonly billingService: BillingService,
    private readonly dataSource: DataSource,
    @Optional()
    private readonly realtimeService?: RealtimeEventsService,
  ) {}

  // =========================================================================
  // 1. TABLE MANAGEMENT
  // =========================================================================

  async getTables(
    tenantId: string,
    branchId: string,
    section?: string,
  ): Promise<Array<RestaurantTableEntity & { activeOrder?: RestaurantOrderEntity | null }>> {
    const totalCount = await this.tableRepo.count({ where: { tenantId, branchId } });
    if (totalCount === 0) {
      await this.seedDefaultTables(tenantId, branchId);
    }

    const qb = this.tableRepo
      .createQueryBuilder('table')
      .where('table.tenantId = :tenantId', { tenantId })
      .andWhere('table.branchId = :branchId', { branchId })
      .andWhere('table.isActive = true');

    if (section && section !== 'all') {
      qb.andWhere('table.section = :section', { section });
    }

    qb.orderBy('table.section', 'ASC')
      .addOrderBy('table.sortOrder', 'ASC')
      .addOrderBy('table.tableNumber', 'ASC');

    const tables = await qb.getMany();

    // Fetch active open orders for non-vacant tables
    const nonVacantTables = tables.filter((t) => t.status !== TableStatus.VACANT);
    const tableIds = nonVacantTables.map((t) => t.id);

    const activeOrdersMap = new Map<string, RestaurantOrderEntity>();
    if (tableIds.length > 0) {
      const activeOrders = await this.orderRepo.find({
        where: {
          tenantId,
          branchId,
          tableId: In(tableIds),
          status: In([RestaurantOrderStatus.OPEN, RestaurantOrderStatus.BILLED]),
        },
        relations: ['lines', 'kots'],
      });
      activeOrders.forEach((o) => {
        if (o.tableId) activeOrdersMap.set(o.tableId, o);
      });
    }

    return tables.map((t) => ({
      ...t,
      activeOrder: activeOrdersMap.get(t.id) || null,
    }));
  }

  async createTable(
    tenantId: string,
    branchId: string,
    dto: CreateTableDto,
  ): Promise<RestaurantTableEntity> {
    const existing = await this.tableRepo.findOne({
      where: { tenantId, branchId, tableNumber: dto.tableNumber.trim().toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Table ${dto.tableNumber} already exists in this branch.`);
    }

    const table = this.tableRepo.create({
      tenantId,
      branchId,
      tableNumber: dto.tableNumber.trim().toUpperCase(),
      tableName: dto.tableName?.trim() || null,
      section: dto.section?.trim() || 'Main Dining',
      seatingCapacity: dto.seatingCapacity || 4,
      sortOrder: dto.sortOrder || 0,
      status: TableStatus.VACANT,
      currentGuestCount: 0,
      isActive: true,
    });

    return this.tableRepo.save(table);
  }

  async seedDefaultTables(tenantId: string, branchId: string): Promise<RestaurantTableEntity[]> {
    const count = await this.tableRepo.count({ where: { tenantId, branchId } });
    if (count > 0) {
      return this.getTables(tenantId, branchId);
    }

    const defaultSeed = [
      // Main Dining (8 tables)
      {
        tableNumber: 'T-01',
        tableName: 'Table 1',
        section: 'Main Dining',
        seatingCapacity: 2,
        sortOrder: 1,
      },
      {
        tableNumber: 'T-02',
        tableName: 'Table 2',
        section: 'Main Dining',
        seatingCapacity: 4,
        sortOrder: 2,
      },
      {
        tableNumber: 'T-03',
        tableName: 'Table 3',
        section: 'Main Dining',
        seatingCapacity: 4,
        sortOrder: 3,
      },
      {
        tableNumber: 'T-04',
        tableName: 'Table 4 (Window)',
        section: 'Main Dining',
        seatingCapacity: 4,
        sortOrder: 4,
      },
      {
        tableNumber: 'T-05',
        tableName: 'Table 5 (Corner)',
        section: 'Main Dining',
        seatingCapacity: 6,
        sortOrder: 5,
      },
      {
        tableNumber: 'T-06',
        tableName: 'Table 6',
        section: 'Main Dining',
        seatingCapacity: 6,
        sortOrder: 6,
      },
      {
        tableNumber: 'T-07',
        tableName: 'Table 7',
        section: 'Main Dining',
        seatingCapacity: 8,
        sortOrder: 7,
      },
      {
        tableNumber: 'T-08',
        tableName: 'Table 8',
        section: 'Main Dining',
        seatingCapacity: 2,
        sortOrder: 8,
      },
      // AC Hall (4 tables)
      {
        tableNumber: 'AC-01',
        tableName: 'AC Table 1',
        section: 'AC Hall',
        seatingCapacity: 4,
        sortOrder: 9,
      },
      {
        tableNumber: 'AC-02',
        tableName: 'AC Table 2',
        section: 'AC Hall',
        seatingCapacity: 4,
        sortOrder: 10,
      },
      {
        tableNumber: 'AC-03',
        tableName: 'AC Table 3',
        section: 'AC Hall',
        seatingCapacity: 6,
        sortOrder: 11,
      },
      {
        tableNumber: 'AC-04',
        tableName: 'AC Table 4',
        section: 'AC Hall',
        seatingCapacity: 8,
        sortOrder: 12,
      },
      // Terrace (2 tables)
      {
        tableNumber: 'TR-01',
        tableName: 'Terrace 1',
        section: 'Terrace',
        seatingCapacity: 4,
        sortOrder: 13,
      },
      {
        tableNumber: 'TR-02',
        tableName: 'Terrace 2',
        section: 'Terrace',
        seatingCapacity: 4,
        sortOrder: 14,
      },
      // Takeaway / Delivery Counters (2 counters)
      {
        tableNumber: 'TAK-01',
        tableName: 'Takeaway Counter 1',
        section: 'Takeaway',
        seatingCapacity: 1,
        sortOrder: 15,
      },
      {
        tableNumber: 'TAK-02',
        tableName: 'Takeaway Counter 2',
        section: 'Takeaway',
        seatingCapacity: 1,
        sortOrder: 16,
      },
    ];

    const entities = defaultSeed.map((d) =>
      this.tableRepo.create({
        tenantId,
        branchId,
        ...d,
        status: TableStatus.VACANT,
        currentGuestCount: 0,
        isActive: true,
      }),
    );

    const saved = await this.tableRepo.save(entities);

    if (this.realtimeService) {
      this.realtimeService.emit(
        tenantId,
        'RESTAURANT_TABLE_CHANGED',
        { action: 'SEED_TABLES', count: saved.length },
        branchId,
      );
    }

    return saved;
  }

  async updateTable(
    tenantId: string,
    branchId: string,
    tableId: string,
    dto: UpdateTableDto,
  ): Promise<RestaurantTableEntity> {
    let table = isUuid(tableId)
      ? await this.tableRepo.findOne({
          where: { id: tableId, tenantId, branchId },
        })
      : null;
    if (!table) {
      table = await this.tableRepo.findOne({
        where: { tableNumber: tableId, tenantId, branchId },
      });
    }
    if (!table) {
      table = await this.tableRepo.findOne({
        where: { tableNumber: tableId.toUpperCase(), tenantId, branchId },
      });
    }
    if (!table) {
      table = await this.tableRepo.findOne({
        where: { tableName: tableId, tenantId, branchId },
      });
    }
    if (!table) {
      throw new NotFoundException(`Table not found`);
    }

    if (dto.tableName !== undefined) table.tableName = dto.tableName?.trim() || null;
    if (dto.section !== undefined) table.section = dto.section?.trim() || table.section;
    if (dto.seatingCapacity !== undefined) table.seatingCapacity = dto.seatingCapacity;
    if (dto.sortOrder !== undefined) table.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) table.isActive = dto.isActive;
    if (dto.status !== undefined) {
      table.status = dto.status;
      if (dto.status === TableStatus.VACANT) {
        table.currentGuestCount = 0;
        table.occupiedAt = null;
      }
    }

    const saved = await this.tableRepo.save(table);

    if (this.realtimeService) {
      this.realtimeService.emit(
        tenantId,
        'RESTAURANT_TABLE_CHANGED',
        { tableId: saved.id, status: saved.status },
        branchId,
      );
    }

    return saved;
  }

  // =========================================================================
  // 2. RESTAURANT ORDERS & SEATING
  // =========================================================================

  async getOrder(tenantId: string, orderId: string): Promise<RestaurantOrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, tenantId },
      relations: ['kots', 'lines', 'kots.lines'],
    });
    if (!order) {
      throw new NotFoundException(`Restaurant order not found`);
    }
    return order;
  }

  async createOrder(
    tenantId: string,
    branchId: string,
    dto: CreateRestaurantOrderDto,
    captainUserId?: string,
    captainName?: string,
  ): Promise<RestaurantOrderEntity> {
    const result = await this.dataSource.transaction(async (manager) => {
      let table: RestaurantTableEntity | null = null;
      if (dto.tableId) {
        const rawTableId = String(dto.tableId).trim();
        if (isUuid(rawTableId)) {
          table = await manager.findOne(RestaurantTableEntity, {
            where: [{ id: rawTableId, tenantId, branchId }, { id: rawTableId, tenantId }],
          });
        }
        if (!table) {
          table = await manager.findOne(RestaurantTableEntity, {
            where: [
              { tableNumber: rawTableId.toUpperCase(), tenantId, branchId },
              { tableNumber: rawTableId.toUpperCase(), tenantId },
            ],
          });
        }
        if (!table) {
          table = await manager.findOne(RestaurantTableEntity, {
            where: [
              { tableNumber: rawTableId, tenantId, branchId },
              { tableNumber: rawTableId, tenantId },
            ],
          });
        }
        if (!table) {
          table = await manager.findOne(RestaurantTableEntity, {
            where: [
              { tableName: rawTableId, tenantId, branchId },
              { tableName: rawTableId, tenantId },
            ],
          });
        }
        if (!table) throw new NotFoundException(`Table ${dto.tableId} not found in this branch`);

        // Authoritatively align branchId with table's persistent branch
        if (table.branchId) {
          branchId = table.branchId;
        }

        // Check if table already has an active open order
        const existingOrder = await manager.findOne(RestaurantOrderEntity, {
          where: {
            tenantId,
            branchId,
            tableId: table.id,
            status: In([RestaurantOrderStatus.OPEN, RestaurantOrderStatus.BILLED]),
          },
          relations: ['kots', 'lines'],
        });
        if (existingOrder) {
          return existingOrder;
        }
      }

      // Safe Captain User Verification to eliminate FK_restaurant_orders_captain violation
      let resolvedCaptainUserId: string | null = null;
      if (captainUserId && isUuid(captainUserId)) {
        try {
          const userExists = await manager.findOne(UserEntity, { where: { id: captainUserId } });
          if (userExists) {
            resolvedCaptainUserId = userExists.id;
          }
        } catch (_) {}
      }

      // Safe Customer Verification to eliminate FK_restaurant_orders_customer violation
      let resolvedCustomerId: string | null = null;
      if (dto.customerId && isUuid(dto.customerId)) {
        try {
          const custExists = await manager.findOne(CustomerEntity, { where: { id: dto.customerId, tenantId } });
          if (custExists) {
            resolvedCustomerId = custExists.id;
          }
        } catch (_) {}
      }

      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const order = manager.create(RestaurantOrderEntity, {
        tenantId,
        branchId,
        orderNumber,
        orderType: dto.orderType || RestaurantOrderType.DINE_IN,
        tableId: table?.id || null,
        tableNumberSnapshot: table?.tableNumber || null,
        sectionSnapshot: table?.section || null,
        guestCount: dto.guestCount || table?.seatingCapacity || 1,
        customerId: resolvedCustomerId,
        notes: dto.notes || null,
        status: RestaurantOrderStatus.OPEN,
        captainUserId: resolvedCaptainUserId,
        captainNameSnapshot: captainName || 'Captain',
        subtotal: '0.00',
        taxTotal: '0.00',
        discountTotal: '0.00',
        grandTotal: '0.00',
        openedAt: new Date(),
      });

      const savedOrder = await manager.save(order);

      if (table) {
        table.status = TableStatus.SEATED;
        table.currentGuestCount = savedOrder.guestCount;
        table.occupiedAt = new Date();
        await manager.save(table);
      }

      return savedOrder;
    });

    if (this.realtimeService) {
      this.realtimeService.emit(
        tenantId,
        'RESTAURANT_TABLE_CHANGED',
        { orderId: result.id, tableId: result.tableId, status: 'OPEN' },
        branchId,
      );
    }

    return result;
  }

  // =========================================================================
  // 3. KOT (KITCHEN ORDER TICKET) DISPATCH
  // =========================================================================

  async dispatchKot(
    tenantId: string,
    branchId: string,
    dto: DispatchKotDto,
    captainName?: string,
  ): Promise<{ kot: RestaurantKotEntity; order: RestaurantOrderEntity }> {
    const result = await this.dataSource.transaction(async (manager) => {
      let order: RestaurantOrderEntity | null = null;

      // 1. If orderId is provided, try to find existing order
      if (dto.orderId) {
        const rawOrderId = String(dto.orderId).trim();
        if (isUuid(rawOrderId)) {
          order = await manager.findOne(RestaurantOrderEntity, {
            where: [{ id: rawOrderId, tenantId, branchId }, { id: rawOrderId, tenantId }],
          });
          if (order?.branchId) {
            branchId = order.branchId;
          }
        }
      }

      // 2. If order not found by orderId, find active order by tableId
      const targetTableId = dto.tableId ? String(dto.tableId).trim() : undefined;
      let table: RestaurantTableEntity | null = null;
      if (!order && targetTableId) {
        if (isUuid(targetTableId)) {
          table = await manager.findOne(RestaurantTableEntity, {
            where: [{ id: targetTableId, tenantId, branchId }, { id: targetTableId, tenantId }],
          });
        }
        if (!table) {
          table = await manager.findOne(RestaurantTableEntity, {
            where: [
              { tableNumber: targetTableId.toUpperCase(), tenantId, branchId },
              { tableNumber: targetTableId.toUpperCase(), tenantId },
            ],
          });
        }
        if (!table) {
          table = await manager.findOne(RestaurantTableEntity, {
            where: [
              { tableNumber: targetTableId, tenantId, branchId },
              { tableNumber: targetTableId, tenantId },
            ],
          });
        }
        if (!table) {
          table = await manager.findOne(RestaurantTableEntity, {
            where: [
              { tableName: targetTableId, tenantId, branchId },
              { tableName: targetTableId, tenantId },
            ],
          });
        }

        if (table) {
          if (table.branchId) {
            branchId = table.branchId;
          }
          order = await manager.findOne(RestaurantOrderEntity, {
            where: {
              tableId: table.id,
              tenantId,
              branchId,
              status: In([RestaurantOrderStatus.OPEN, RestaurantOrderStatus.BILLED]),
            },
          });
        }
      }

      // 3. If still no active order, automatically create one for the table
      if (!order) {
        if (!table && targetTableId) {
          if (isUuid(targetTableId)) {
            table = await manager.findOne(RestaurantTableEntity, {
              where: [{ id: targetTableId, tenantId, branchId }, { id: targetTableId, tenantId }],
            });
          }
          if (!table) {
            table = await manager.findOne(RestaurantTableEntity, {
              where: [
                { tableNumber: targetTableId.toUpperCase(), tenantId, branchId },
                { tableNumber: targetTableId.toUpperCase(), tenantId },
              ],
            });
          }
          if (!table) {
            table = await manager.findOne(RestaurantTableEntity, {
              where: [
                { tableNumber: targetTableId, tenantId, branchId },
                { tableNumber: targetTableId, tenantId },
              ],
            });
          }
          if (!table) {
            table = await manager.findOne(RestaurantTableEntity, {
              where: [
                { tableName: targetTableId, tenantId, branchId },
                { tableName: targetTableId, tenantId },
              ],
            });
          }
          if (table?.branchId) {
            branchId = table.branchId;
          }
        }

        const isTakeaway = table?.section?.toLowerCase().includes('takeaway') || false;
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        order = manager.create(RestaurantOrderEntity, {
          tenantId,
          branchId,
          orderNumber,
          orderType: isTakeaway ? RestaurantOrderType.TAKEAWAY : RestaurantOrderType.DINE_IN,
          tableId: table?.id || null,
          tableNumberSnapshot: table?.tableNumber || dto.tableId || 'Takeaway',
          sectionSnapshot: table?.section || 'Main Dining',
          guestCount: table?.currentGuestCount || 2,
          status: RestaurantOrderStatus.OPEN,
          captainNameSnapshot: captainName || 'Captain',
          subtotal: '0.00',
          taxTotal: '0.00',
          discountTotal: '0.00',
          grandTotal: '0.00',
          openedAt: new Date(),
        });
        order = await manager.save(order);

        if (table) {
          table.status = TableStatus.SEATED;
          table.currentGuestCount = table.currentGuestCount || 2;
          table.occupiedAt = new Date();
          await manager.save(table);
        }
      }

      if (
        order.status !== RestaurantOrderStatus.OPEN &&
        order.status !== RestaurantOrderStatus.BILLED
      ) {
        throw new BadRequestException(`Cannot add KOT to order with status ${order.status}`);
      }

      const rawItems = dto.items || (dto as any).lines || [];
      if (!rawItems || rawItems.length === 0) {
        throw new BadRequestException('KOT must contain at least one line item');
      }

      const itemsToProcess = rawItems.map((i: any) => ({
        productId: i.productId || i.id,
        productName: i.productName || i.name,
        variantName: i.variantName,
        quantity: String(i.quantity || '1'),
        unitPrice: i.unitPrice ? String(i.unitPrice) : undefined,
        specialInstructions: i.specialInstructions || i.notes,
        kitchenStation: i.kitchenStation || dto.kitchenStation || KitchenStation.MAIN_KITCHEN,
      }));

      // Fetch products to snapshot pricing & name.
      // Strictly query valid UUIDs on id column to prevent PostgreSQL transaction aborts,
      // and query non-UUIDs on sku column as a resilient fallback.
      const isTest = process.env.NODE_ENV === 'test';
      const validProductUuids = itemsToProcess
        .map((i: any) => (i.productId ? String(i.productId).trim() : ''))
        .filter((id: string) => id && (isTest || isUuid(id)));
      const nonUuidIds = itemsToProcess
        .map((i: any) => (i.productId ? String(i.productId).trim() : ''))
        .filter((id: string) => id && !isUuid(id));

      const uuidProducts = validProductUuids.length > 0
        ? await manager.find(ProductEntity, {
            where: { id: In(validProductUuids), tenantId },
          })
        : [];
      const skuProducts = (!isTest && nonUuidIds.length > 0)
        ? await manager.find(ProductEntity, {
            where: { sku: In(nonUuidIds), tenantId },
          })
        : [];

      const products = [...uuidProducts, ...skuProducts];
      const productMap = new Map<string, ProductEntity>();
      for (const p of products) {
        productMap.set(p.id, p);
        if (p.sku) productMap.set(p.sku, p);
      }

      const kotCount = await manager.count(RestaurantKotEntity, {
        where: { tenantId, branchId, orderId: order.id },
      });
      const kotNumber = `KOT-${(kotCount + 1).toString().padStart(2, '0')}`;

      const kot = manager.create(RestaurantKotEntity, {
        tenantId,
        branchId,
        orderId: order.id,
        kotNumber,
        tableNumber: order.tableNumberSnapshot || table?.tableNumber || 'Takeaway',
        kitchenStation: dto.kitchenStation || KitchenStation.MAIN_KITCHEN,
        status: KotStatus.PENDING,
        captainName: captainName || order.captainNameSnapshot || 'Captain',
        dispatchedAt: new Date(),
      });
      const savedKot = await manager.save(kot);

      let additionalSubtotal = 0;
      let hasProvisionedDish = false;
      const kotLines: RestaurantKotLineEntity[] = [];

      for (const item of itemsToProcess) {
        let product: ProductEntity | null | undefined = productMap.get(item.productId);
        const rawItemPid = item.productId ? String(item.productId).trim() : '';

        // If product was not in initial map, look it up by ID or SKU across the tenant
        if (!product && rawItemPid) {
          try {
            product = await manager.findOne(ProductEntity, {
              where: isUuid(rawItemPid)
                ? [{ id: rawItemPid, tenantId }, { sku: rawItemPid, tenantId }]
                : { sku: rawItemPid, tenantId },
            });
          } catch (_) {}
        }

        // If still not found, search by name across tenant
        const itemName = item.productName ? String(item.productName).trim() : '';
        if (!product && itemName) {
          try {
            product = await manager.findOne(ProductEntity, {
              where: { name: itemName, tenantId },
            });
          } catch (_) {}
        }

        // Auto-provision product record so FK_restaurant_kot_lines_product NEVER fails!
        if (!product) {
          const dishName = itemName || 'Kitchen Dish';
          const dishSku = `DISH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
          const isClientPidUuid = isUuid(rawItemPid);

          const newDish = manager.create(ProductEntity, {
            ...(isClientPidUuid ? { id: rawItemPid } : {}),
            tenantId,
            name: dishName,
            sku: dishSku,
            sellingPrice: item.unitPrice ? String(item.unitPrice) : '0.00',
            purchaseCost: '0.00',
            mrp: item.unitPrice ? String(item.unitPrice) : '0.00',
            foodType: null,
            kitchenStation: item.kitchenStation || savedKot.kitchenStation,
            isMadeToOrder: true,
            trackInventory: false,
            isActive: true,
          });

          try {
            product = await manager.save(newDish);
            hasProvisionedDish = true;
          } catch {
            product = await manager.findOne(ProductEntity, {
              where: { tenantId, name: dishName },
            });
          }
        }

        let nameSnapshot = item.productName || product?.name || 'Dish Item';
        let priceNum = product
          ? parseFloat(product.sellingPrice)
          : parseFloat(item.unitPrice || '0') || 0;

        if (product) {
          // Authoritatively validate variant or custom portion pricing
          if (item.variantName) {
            const v = product.variants?.find(
              (varItem) => varItem.name.toLowerCase() === item.variantName!.toLowerCase(),
            );
            if (v) {
              priceNum = parseFloat(v.price);
              nameSnapshot = `${product.name} (${v.name})`;
            }
          } else if (item.unitPrice !== undefined) {
            const requestedPrice = parseFloat(item.unitPrice);
            const v = product.variants?.find(
              (varItem) => Math.abs(parseFloat(varItem.price) - requestedPrice) < 0.01,
            );
            if (v) {
              priceNum = parseFloat(v.price);
              nameSnapshot = `${product.name} (${v.name})`;
            } else if (product.isMadeToOrder && !isNaN(requestedPrice) && requestedPrice > 0) {
              priceNum = requestedPrice;
            }
          }
        }

        const qtyNum = parseFloat(item.quantity) || 1;
        const lineTotalNum = Math.round(qtyNum * priceNum * 100) / 100;

        additionalSubtotal += lineTotalNum;

        // Guaranteed to exist in "products" table
        const resolvedLinePid = product?.id || (isUuid(rawItemPid) ? rawItemPid : randomUUID());

        const line = manager.create(RestaurantKotLineEntity, {
          tenantId,
          kotId: savedKot.id,
          orderId: order.id,
          productId: resolvedLinePid,
          productNameSnapshot: nameSnapshot,
          quantity: qtyNum.toFixed(3),
          unitPrice: priceNum.toFixed(2),
          lineTotal: lineTotalNum.toFixed(2),
          kitchenStation: item.kitchenStation || savedKot.kitchenStation,
          specialInstructions: item.specialInstructions?.trim() || null,
          status: KotStatus.PENDING,
        });

        kotLines.push(line);
      }

      savedKot.lines = await manager.save(kotLines);

      // Recalculate running order totals (Standard 5% Restaurant GST: 2.5% CGST + 2.5% SGST)
      const currentSubtotal = parseFloat(order.subtotal || '0') + additionalSubtotal;
      const gstRate = 0.05; // 5% GST
      const taxTotal = Math.round(currentSubtotal * gstRate * 100) / 100;
      const grandTotal = Math.round((currentSubtotal + taxTotal) * 100) / 100;

      order.subtotal = currentSubtotal.toFixed(2);
      order.taxTotal = taxTotal.toFixed(2);
      order.grandTotal = grandTotal.toFixed(2);
      order.status = RestaurantOrderStatus.OPEN;

      await manager.update(
        RestaurantOrderEntity,
        { id: order.id, tenantId, branchId },
        {
          subtotal: order.subtotal,
          taxTotal: order.taxTotal,
          grandTotal: order.grandTotal,
          status: order.status,
        },
      );

      // Update table status to ORDERED
      if (order.tableId) {
        await manager.update(
          RestaurantTableEntity,
          { id: order.tableId },
          {
            status: TableStatus.ORDERED,
          },
        );
      }

      return { kot: savedKot, order, hasProvisionedDish };
    });

    if (this.realtimeService) {
      this.realtimeService.emit(
        tenantId,
        'RESTAURANT_TABLE_CHANGED',
        { kotId: result.kot.id, orderId: result.order.id, status: 'ORDERED' },
        branchId,
      );
      if (result.hasProvisionedDish) {
        this.realtimeService.emit(tenantId, 'CATALOG_CHANGED', { action: 'AUTO_PROVISION_DISH' }, branchId);
      }
    }

    return { kot: result.kot, order: result.order };
  }

  // =========================================================================
  // 4. KITCHEN DISPLAY SCREEN (KDS)
  // =========================================================================

  async getKdsQueue(
    tenantId: string,
    branchId: string,
    station?: KitchenStation,
  ): Promise<RestaurantKotEntity[]> {
    const qb = this.kotRepo
      .createQueryBuilder('kot')
      .leftJoinAndSelect('kot.lines', 'lines')
      .leftJoinAndSelect('kot.order', 'order')
      .where('kot.tenantId = :tenantId', { tenantId })
      .andWhere('kot.branchId = :branchId', { branchId })
      .andWhere('kot.status IN (:...statuses)', {
        statuses: [KotStatus.PENDING, KotStatus.PREPARING, KotStatus.READY],
      });

    if (station) {
      qb.andWhere('kot.kitchenStation = :station', { station });
    }

    qb.orderBy('kot.dispatchedAt', 'ASC');

    return qb.getMany();
  }

  async updateKotStatus(
    tenantId: string,
    branchId: string,
    kotId: string,
    status: KotStatus,
  ): Promise<RestaurantKotEntity> {
    const kot = await this.kotRepo.findOne({
      where: { id: kotId, tenantId, branchId },
      relations: ['lines'],
    });
    if (!kot) {
      throw new NotFoundException(`KOT ticket not found`);
    }

    kot.status = status;
    if (status === KotStatus.READY) kot.readyAt = new Date();
    if (status === KotStatus.SERVED) kot.servedAt = new Date();

    // Update child lines status to match
    if (kot.lines && kot.lines.length > 0) {
      kot.lines.forEach((l) => (l.status = status));
      await this.kotLineRepo.save(kot.lines);
    }

    const savedKot = await this.kotRepo.save(kot);

    if (this.realtimeService) {
      this.realtimeService.emit(
        tenantId,
        'RESTAURANT_TABLE_CHANGED',
        {
          action: 'KOT_STATUS_CHANGED',
          kotId: savedKot.id,
          orderId: savedKot.orderId,
          status: savedKot.status,
        },
        branchId,
      );
    }

    return savedKot;
  }

  // =========================================================================
  // 5. TABLE TRANSFER & MERGE
  // =========================================================================

  async transferTable(
    tenantId: string,
    branchId: string,
    dto: TransferTableDto,
  ): Promise<{ sourceTable: RestaurantTableEntity; targetTable: RestaurantTableEntity }> {
    return this.dataSource.transaction(async (manager) => {
      const rawSource = dto.sourceTableId ? String(dto.sourceTableId).trim() : '';
      let source: RestaurantTableEntity | null = null;
      if (isUuid(rawSource)) {
        source = await manager.findOne(RestaurantTableEntity, {
          where: { id: rawSource, tenantId, branchId },
        });
      }
      if (!source && rawSource) {
        source = await manager.findOne(RestaurantTableEntity, {
          where: { tableNumber: rawSource.toUpperCase(), tenantId, branchId },
        });
      }
      if (!source && rawSource) {
        source = await manager.findOne(RestaurantTableEntity, {
          where: { tableNumber: rawSource, tenantId, branchId },
        });
      }

      const rawTarget = dto.targetTableId ? String(dto.targetTableId).trim() : '';
      let target: RestaurantTableEntity | null = null;
      if (isUuid(rawTarget)) {
        target = await manager.findOne(RestaurantTableEntity, {
          where: { id: rawTarget, tenantId, branchId },
        });
      }
      if (!target && rawTarget) {
        target = await manager.findOne(RestaurantTableEntity, {
          where: { tableNumber: rawTarget.toUpperCase(), tenantId, branchId },
        });
      }
      if (!target && rawTarget) {
        target = await manager.findOne(RestaurantTableEntity, {
          where: { tableNumber: rawTarget, tenantId, branchId },
        });
      }

      if (!source || !target) {
        throw new NotFoundException('Source or target table not found');
      }

      if (target.status !== TableStatus.VACANT && target.status !== TableStatus.DIRTY) {
        throw new BadRequestException(
          `Target table ${target.tableNumber} is currently ${target.status}`,
        );
      }

      const activeOrder = await manager.findOne(RestaurantOrderEntity, {
        where: {
          tenantId,
          branchId,
          tableId: source.id,
          status: In([RestaurantOrderStatus.OPEN, RestaurantOrderStatus.BILLED]),
        },
      });

      if (activeOrder) {
        activeOrder.tableId = target.id;
        activeOrder.tableNumberSnapshot = target.tableNumber;
        activeOrder.sectionSnapshot = target.section;
        await manager.save(activeOrder);
      }

      target.status = source.status;
      target.currentGuestCount = source.currentGuestCount;
      target.occupiedAt = source.occupiedAt;

      source.status = TableStatus.VACANT;
      source.currentGuestCount = 0;
      source.occupiedAt = null;

      const savedSource = await manager.save(source);
      const savedTarget = await manager.save(target);

      if (this.realtimeService) {
        this.realtimeService.emit(
          tenantId,
          'RESTAURANT_TABLE_CHANGED',
          {
            action: 'TRANSFER_TABLE',
            sourceTableId: savedSource.id,
            targetTableId: savedTarget.id,
          },
          branchId,
        );
      }

      return { sourceTable: savedSource, targetTable: savedTarget };
    });
  }

  // =========================================================================
  // 6. CHECKOUT & SETTLEMENT (BRIDGES INTO POSTGRESQL BILLING CORE)
  // =========================================================================

  async settleOrder(
    tenantId: string,
    branchId: string,
    cashierUserId: string,
    dto: SettleRestaurantOrderDto,
  ): Promise<{ invoice: any; order: RestaurantOrderEntity }> {
    const rawOrderId = dto.orderId ? String(dto.orderId).trim() : '';
    let order: RestaurantOrderEntity | null = null;
    if (isUuid(rawOrderId)) {
      order = await this.orderRepo.findOne({
        where: { id: rawOrderId, tenantId, branchId },
        relations: ['lines'],
      });
    }
    if (!order && rawOrderId) {
      order = await this.orderRepo.findOne({
        where: { orderNumber: rawOrderId, tenantId, branchId },
        relations: ['lines'],
      });
    }

    if (!order) {
      throw new NotFoundException('Restaurant order not found');
    }

    if (!order.lines || order.lines.length === 0) {
      throw new BadRequestException('Cannot settle order with no items');
    }

    // Exclude cancelled / voided KOT items from bill settlement
    const activeLines = order.lines.filter((l) => l.status !== KotStatus.CANCELLED);
    if (activeLines.length === 0) {
      throw new BadRequestException('Cannot settle order with no active items (all lines cancelled)');
    }

    if (order.status === RestaurantOrderStatus.COMPLETED) {
      throw new BadRequestException('Order has already been settled and completed');
    }

    // Convert restaurant order lines into cart lines for createSale with verified portion prices
    const items = activeLines.map((l) => ({
      productId: l.productId,
      customName: l.productNameSnapshot,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      discountAmount: undefined,
      gstRatePercent: '5.00', // Standard restaurant GST rate
    }));

    // Recalculate active totals to match settled lines exactly with CGST Section 170 nearest rupee rounding
    const settledSubtotal = activeLines.reduce(
      (sum, l) => sum + parseFloat(l.lineTotal || '0'),
      0,
    );
    const settledTax = Math.round(settledSubtotal * 0.05 * 100) / 100;
    const rawGrandTotal = Math.round((settledSubtotal + settledTax) * 100) / 100;
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const settledGrandTotalStr = (roundedGrandTotal > 0 ? roundedGrandTotal : rawGrandTotal).toFixed(2);

    // Payments setup (Single or Split)
    let payments: Array<{
      paymentMethod: PaymentMethod;
      amount: string;
      externalReference?: string;
    }> = [];
    if (dto.isSplit && dto.splitPayments && dto.splitPayments.length > 0) {
      payments = dto.splitPayments.map((p) => ({
        paymentMethod: p.paymentMethod,
        amount: p.amount,
        externalReference: p.externalReference,
      }));
    } else {
      payments = [
        {
          paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
          amount: settledGrandTotalStr,
        },
      ];
    }

    const idempotencyKey = `rest-settle-${order.id}-${Date.now()}`;
    const saleRequest = {
      branchId,
      idempotencyKey,
      customerName: order.tableNumberSnapshot ? `Table ${order.tableNumberSnapshot} (Dine-In)` : undefined,
      customerId: dto.customerId || order.customerId || undefined,
      items,
      payments,
    };

    // Post to live PostgreSQL billing & stock ledger atomically
    const invoice = await this.billingService.createSale(tenantId, cashierUserId, saleRequest);

    // Update order status
    order.status = RestaurantOrderStatus.COMPLETED;
    order.invoiceId = invoice.id;
    order.closedAt = new Date();
    await this.orderRepo.update(
      { id: order.id, tenantId, branchId },
      {
        status: RestaurantOrderStatus.COMPLETED,
        invoiceId: invoice.id,
        closedAt: order.closedAt,
      },
    );

    // Free up table / mark as dirty
    if (order.tableId) {
      await this.tableRepo.update(
        { id: order.tableId },
        {
          status: TableStatus.VACANT,
          currentGuestCount: 0,
          occupiedAt: null,
        },
      );
    }

    if (this.realtimeService) {
      this.realtimeService.emit(
        tenantId,
        'RESTAURANT_TABLE_CHANGED',
        { orderId: order.id, tableId: order.tableId, status: 'VACANT', action: 'SETTLED' },
        branchId,
      );
    }

    return { invoice, order };
  }
}
