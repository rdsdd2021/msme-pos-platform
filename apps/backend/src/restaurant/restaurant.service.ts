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

    return this.tableRepo.save(entities);
  }

  async updateTable(
    tenantId: string,
    branchId: string,
    tableId: string,
    dto: UpdateTableDto,
  ): Promise<RestaurantTableEntity> {
    const table = await this.tableRepo.findOne({
      where: { id: tableId, tenantId, branchId },
    });
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

    return this.tableRepo.save(table);
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
        table = await manager.findOne(RestaurantTableEntity, {
          where: { id: dto.tableId, tenantId, branchId },
        });
        if (!table) throw new NotFoundException('Table not found');

        // Check if table already has an active open order
        const existingOrder = await manager.findOne(RestaurantOrderEntity, {
          where: {
            tenantId,
            branchId,
            tableId: dto.tableId,
            status: In([RestaurantOrderStatus.OPEN, RestaurantOrderStatus.BILLED]),
          },
          relations: ['kots', 'lines'],
        });
        if (existingOrder) {
          return existingOrder;
        }
      }

      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const order = manager.create(RestaurantOrderEntity, {
        tenantId,
        branchId,
        orderNumber,
        orderType: dto.orderType || RestaurantOrderType.DINE_IN,
        tableId: dto.tableId || null,
        tableNumberSnapshot: table?.tableNumber || null,
        sectionSnapshot: table?.section || null,
        guestCount: dto.guestCount || table?.seatingCapacity || 1,
        customerId: dto.customerId || null,
        notes: dto.notes || null,
        status: RestaurantOrderStatus.OPEN,
        captainUserId: captainUserId || null,
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
      const order = await manager.findOne(RestaurantOrderEntity, {
        where: { id: dto.orderId, tenantId, branchId },
      });
      if (!order) {
        throw new NotFoundException('Restaurant order not found');
      }
      if (
        order.status !== RestaurantOrderStatus.OPEN &&
        order.status !== RestaurantOrderStatus.BILLED
      ) {
        throw new BadRequestException(`Cannot add KOT to order with status ${order.status}`);
      }

      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException('KOT must contain at least one line item');
      }

      // Fetch products to snapshot pricing & name
      const productIds = dto.items.map((i) => i.productId);
      const products = await manager.find(ProductEntity, {
        where: { id: In(productIds), tenantId },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      const kotCount = await manager.count(RestaurantKotEntity, {
        where: { tenantId, branchId, orderId: order.id },
      });
      const kotNumber = `KOT-${(kotCount + 1).toString().padStart(2, '0')}`;

      const kot = manager.create(RestaurantKotEntity, {
        tenantId,
        branchId,
        orderId: order.id,
        kotNumber,
        tableNumber: order.tableNumberSnapshot || 'Takeaway',
        kitchenStation: dto.kitchenStation || KitchenStation.MAIN_KITCHEN,
        status: KotStatus.PENDING,
        captainName: captainName || order.captainNameSnapshot || 'Captain',
        dispatchedAt: new Date(),
      });
      const savedKot = await manager.save(kot);

      let additionalSubtotal = 0;
      const kotLines: RestaurantKotLineEntity[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        const qtyNum = parseFloat(item.quantity);
        const priceNum = parseFloat(product.sellingPrice);
        const lineTotalNum = Math.round(qtyNum * priceNum * 100) / 100;

        additionalSubtotal += lineTotalNum;

        const line = manager.create(RestaurantKotLineEntity, {
          tenantId,
          kotId: savedKot.id,
          orderId: order.id,
          productId: product.id,
          productNameSnapshot: product.name,
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

      return { kot: savedKot, order };
    });

    if (this.realtimeService) {
      this.realtimeService.emit(
        tenantId,
        'RESTAURANT_TABLE_CHANGED',
        { kotId: result.kot.id, orderId: result.order.id, status: 'ORDERED' },
        branchId,
      );
    }

    return result;
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

    return this.kotRepo.save(kot);
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
      const source = await manager.findOne(RestaurantTableEntity, {
        where: { id: dto.sourceTableId, tenantId, branchId },
      });
      const target = await manager.findOne(RestaurantTableEntity, {
        where: { id: dto.targetTableId, tenantId, branchId },
      });

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
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId, tenantId, branchId },
      relations: ['lines'],
    });

    if (!order) {
      throw new NotFoundException('Restaurant order not found');
    }

    if (!order.lines || order.lines.length === 0) {
      throw new BadRequestException('Cannot settle order with no items');
    }

    if (order.status === RestaurantOrderStatus.COMPLETED) {
      throw new BadRequestException('Order has already been settled and completed');
    }

    // Convert restaurant order lines into cart lines for createSale
    const items = order.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      discountAmount: undefined,
      gstRatePercent: '5.00', // Standard restaurant GST rate
    }));

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
          amount: order.grandTotal,
        },
      ];
    }

    const idempotencyKey = `rest-settle-${order.id}-${Date.now()}`;
    const saleRequest = {
      branchId,
      idempotencyKey,
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
