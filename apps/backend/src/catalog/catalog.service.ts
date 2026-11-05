import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, FindOptionsWhere } from 'typeorm';
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
import { AuditService } from '../tenants/audit.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { Permission, StockMovementType, StockTransferStatus, TenantContext } from '@pos/shared-types';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateUnitDto,
  CreateProductDto,
  UpdateProductDto,
  RecordStockMovementDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
  ReceivePurchaseOrderDto,
  CreateStockTransferDto,
  DispatchStockTransferDto,
  ReceiveStockTransferDto,
  CancelStockTransferDto,
} from './dto/catalog.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepo: Repository<UnitEntity>,
    @InjectRepository(SupplierEntity)
    private readonly supplierRepo: Repository<SupplierEntity>,
    @InjectRepository(PurchaseOrderEntity)
    private readonly poRepo: Repository<PurchaseOrderEntity>,
    @InjectRepository(PurchaseOrderLineEntity)
    private readonly poLineRepo: Repository<PurchaseOrderLineEntity>,
    @InjectRepository(StockLedgerEntity)
    private readonly stockLedgerRepo: Repository<StockLedgerEntity>,
    @InjectRepository(StockBalanceEntity)
    private readonly stockBalanceRepo: Repository<StockBalanceEntity>,
    @InjectRepository(StockTransferEntity)
    private readonly transferRepo: Repository<StockTransferEntity>,
    @InjectRepository(StockTransferLineEntity)
    private readonly transferLineRepo: Repository<StockTransferLineEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepo: Repository<BranchEntity>,
    private readonly dataSource: DataSource,
    @Optional()
    private readonly auditService?: AuditService,
    @Optional()
    private readonly realtimeService?: RealtimeEventsService,
  ) {}

  // --- Category Management ---

  async createCategory(tenantId: string, dto: CreateCategoryDto): Promise<CategoryEntity> {
    const existing = await this.categoryRepo.findOne({
      where: { tenantId, code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Category code ${dto.code} already exists`);
    }

    const category = this.categoryRepo.create({
      tenantId,
      code: dto.code.toUpperCase(),
      name: dto.name,
      parentId: dto.parentId ?? null,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.categoryRepo.save(category);
  }

  async getCategories(tenantId: string): Promise<CategoryEntity[]> {
    return this.categoryRepo.find({
      where: { tenantId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async updateCategory(tenantId: string, categoryId: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId, tenantId },
    });
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    if (dto.code && dto.code.toUpperCase() !== category.code) {
      const existing = await this.categoryRepo.findOne({
        where: { tenantId, code: dto.code.toUpperCase() },
      });
      if (existing) {
        throw new ConflictException(`Category code ${dto.code} already exists`);
      }
      category.code = dto.code.toUpperCase();
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.parentId !== undefined) category.parentId = dto.parentId;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    return this.categoryRepo.save(category);
  }

  async deleteCategory(tenantId: string, categoryId: string): Promise<{ success: boolean; message: string }> {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId, tenantId },
    });
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    category.isActive = false;
    await this.categoryRepo.save(category);
    return { success: true, message: 'Category deactivated successfully' };
  }

  // --- Unit Management ---

  async getUnits(tenantId: string): Promise<UnitEntity[]> {
    return this.unitRepo.find({
      where: [{ tenantId }, { tenantId: IsNull() }],
      order: { name: 'ASC' },
    });
  }

  async createUnit(tenantId: string, dto: CreateUnitDto): Promise<UnitEntity> {
    const existing = await this.unitRepo.findOne({
      where: [
        { tenantId, symbol: dto.symbol.toUpperCase() },
        { tenantId: IsNull(), symbol: dto.symbol.toUpperCase() },
      ],
    });
    if (existing) {
      throw new ConflictException(`Unit symbol ${dto.symbol} already exists`);
    }

    const unit = this.unitRepo.create({
      tenantId,
      name: dto.name,
      symbol: dto.symbol.toUpperCase(),
      decimalPlaces: dto.decimalPlaces ?? 0,
    });
    return this.unitRepo.save(unit);
  }

  // --- Product & SKU Management ---

  async createProduct(tenantId: string, dto: CreateProductDto): Promise<ProductEntity> {
    // 1. SKU uniqueness validation
    const existingSku = await this.productRepo.findOne({
      where: { tenantId, sku: dto.sku.toUpperCase() },
    });
    if (existingSku) {
      throw new ConflictException(`Product SKU "${dto.sku}" already exists in your store`);
    }

    // 2. Barcode duplicate validation per tenant
    if (dto.barcodePrimary && dto.barcodePrimary.trim()) {
      const barcodeClean = dto.barcodePrimary.trim();
      const existingBarcode = await this.productRepo.findOne({
        where: { tenantId, barcodePrimary: barcodeClean, isActive: true },
      });
      if (existingBarcode) {
        throw new ConflictException(
          `Barcode "${barcodeClean}" is already assigned to active product "${existingBarcode.name}" (SKU: ${existingBarcode.sku})`,
        );
      }
    }

    // 3. Price integrity validation: Selling Price cannot exceed MRP
    const sellingPriceNum = parseFloat(dto.sellingPrice);
    const mrpNum = parseFloat(dto.mrp);
    if (mrpNum > 0 && sellingPriceNum > mrpNum) {
      throw new BadRequestException(
        `Selling price (₹${dto.sellingPrice}) cannot exceed Maximum Retail Price (MRP ₹${dto.mrp})`,
      );
    }

    // 4. Opening stock handling: if openingStockQuantity is provided, commit in atomic transaction with StockLedger
    const hasOpeningStock =
      dto.openingStockQuantity &&
      parseFloat(dto.openingStockQuantity) > 0 &&
      dto.openingStockBranchId;

    if (hasOpeningStock) {
      const res = await this.dataSource.transaction(async (manager) => {
        const product = manager.create(ProductEntity, {
          tenantId,
          sku: dto.sku.toUpperCase(),
          name: dto.name,
          barcodePrimary: dto.barcodePrimary ? dto.barcodePrimary.trim() : null,
          categoryId: dto.categoryId ?? null,
          baseUnitId: dto.baseUnitId ?? null,
          purchaseCost: dto.purchaseCost,
          sellingPrice: dto.sellingPrice,
          mrp: dto.mrp,
          hsnCode: dto.hsnCode ?? null,
          gstRatePercent: dto.gstRatePercent ?? '0.00',
          packageSize: dto.packageSize ?? null,
          imageUrl: dto.imageUrl ?? null,
          productType: dto.productType,
          trackInventory: dto.trackInventory ?? true,
          allowFractionalQuantity: dto.allowFractionalQuantity ?? false,
        });

        const savedProduct = await manager.save(product);

        // Record opening stock in immutable stock ledger
        const openingStockQty = parseFloat(dto.openingStockQuantity!).toFixed(3);
        const openingMovement = manager.create(StockLedgerEntity, {
          tenantId,
          branchId: dto.openingStockBranchId!,
          productId: savedProduct.id,
          movementType: StockMovementType.OPENING,
          quantityDelta: openingStockQty,
          unitCost: dto.purchaseCost,
          sourceType: 'opening_stock',
          sourceId: savedProduct.id,
          idempotencyKey: randomUUID(),
          reason: 'Initial Opening Stock Entry',
        });
        await manager.save(openingMovement);

        // Project opening stock balance
        let balance = await manager.findOne(StockBalanceEntity, {
          where: { tenantId, branchId: dto.openingStockBranchId!, productId: savedProduct.id },
        });

        if (!balance) {
          balance = manager.create(StockBalanceEntity, {
            tenantId,
            branchId: dto.openingStockBranchId!,
            productId: savedProduct.id,
            quantityOnHand: openingStockQty,
            lowStockThreshold: '5.000',
          });
        } else {
          const current = parseFloat(balance.quantityOnHand);
          balance.quantityOnHand = (current + parseFloat(openingStockQty)).toFixed(3);
        }
        await manager.save(balance);

        return savedProduct;
      });

      if (this.realtimeService) {
        this.realtimeService.emit(tenantId, 'CATALOG_CHANGED', { productId: res.id, action: 'CREATE' });
        this.realtimeService.emit(tenantId, 'STOCK_CHANGED', { productId: res.id, reason: 'OPENING_STOCK' }, dto.openingStockBranchId);
      }
      return res;
    }

    // Direct product creation without opening stock
    const product = this.productRepo.create({
      tenantId,
      sku: dto.sku.toUpperCase(),
      name: dto.name,
      barcodePrimary: dto.barcodePrimary ? dto.barcodePrimary.trim() : null,
      categoryId: dto.categoryId ?? null,
      baseUnitId: dto.baseUnitId ?? null,
      purchaseCost: dto.purchaseCost,
      sellingPrice: dto.sellingPrice,
      mrp: dto.mrp,
      hsnCode: dto.hsnCode ?? null,
      gstRatePercent: dto.gstRatePercent ?? '0.00',
      packageSize: dto.packageSize ?? null,
      imageUrl: dto.imageUrl ?? null,
      productType: dto.productType,
      trackInventory: dto.trackInventory ?? true,
      allowFractionalQuantity: dto.allowFractionalQuantity ?? false,
    });

    const saved = await this.productRepo.save(product);
    if (this.realtimeService) {
      this.realtimeService.emit(tenantId, 'CATALOG_CHANGED', { productId: saved.id, action: 'CREATE' });
    }
    return saved;
  }

  async getProducts(tenantId: string): Promise<ProductEntity[]> {
    return this.productRepo.find({
      where: { tenantId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getProductById(tenantId: string, productId: string): Promise<ProductEntity> {
    const product = await this.productRepo.findOne({
      where: { id: productId, tenantId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found in this store`);
    }
    return product;
  }

  async updateProduct(tenantId: string, productId: string, dto: UpdateProductDto): Promise<ProductEntity> {
    const product = await this.getProductById(tenantId, productId);

    // 1. SKU uniqueness if changed
    if (dto.sku && dto.sku.toUpperCase() !== product.sku) {
      const existingSku = await this.productRepo.findOne({
        where: { tenantId, sku: dto.sku.toUpperCase() },
      });
      if (existingSku && existingSku.id !== productId) {
        throw new ConflictException(`Product SKU "${dto.sku}" already exists`);
      }
      product.sku = dto.sku.toUpperCase();
    }

    // 2. Barcode duplicate validation if changed
    if (dto.barcodePrimary !== undefined) {
      const cleanBarcode = dto.barcodePrimary ? dto.barcodePrimary.trim() : null;
      if (cleanBarcode && cleanBarcode !== product.barcodePrimary) {
        const existingBarcode = await this.productRepo.findOne({
          where: { tenantId, barcodePrimary: cleanBarcode, isActive: true },
        });
        if (existingBarcode && existingBarcode.id !== productId) {
          throw new ConflictException(
            `Barcode "${cleanBarcode}" is already assigned to active product "${existingBarcode.name}" (SKU: ${existingBarcode.sku})`,
          );
        }
      }
      product.barcodePrimary = cleanBarcode;
    }

    // 3. Price validation: Selling price <= MRP
    const updatedSellingPrice = dto.sellingPrice !== undefined ? parseFloat(dto.sellingPrice) : parseFloat(product.sellingPrice);
    const updatedMrp = dto.mrp !== undefined ? parseFloat(dto.mrp) : parseFloat(product.mrp);
    if (updatedMrp > 0 && updatedSellingPrice > updatedMrp) {
      throw new BadRequestException(
        `Selling price (₹${updatedSellingPrice.toFixed(2)}) cannot exceed Maximum Retail Price (MRP ₹${updatedMrp.toFixed(2)})`,
      );
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
    if (dto.baseUnitId !== undefined) product.baseUnitId = dto.baseUnitId;
    if (dto.purchaseCost !== undefined) product.purchaseCost = dto.purchaseCost;
    if (dto.sellingPrice !== undefined) product.sellingPrice = dto.sellingPrice;
    if (dto.mrp !== undefined) product.mrp = dto.mrp;
    if (dto.hsnCode !== undefined) product.hsnCode = dto.hsnCode;
    if (dto.gstRatePercent !== undefined) product.gstRatePercent = dto.gstRatePercent;
    if (dto.packageSize !== undefined) product.packageSize = dto.packageSize;
    if (dto.imageUrl !== undefined) product.imageUrl = dto.imageUrl;
    if (dto.productType !== undefined) product.productType = dto.productType;
    if (dto.trackInventory !== undefined) product.trackInventory = dto.trackInventory;
    if (dto.allowFractionalQuantity !== undefined) product.allowFractionalQuantity = dto.allowFractionalQuantity;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;

    product.version += 1;
    const saved = await this.productRepo.save(product);
    if (this.realtimeService) {
      this.realtimeService.emit(tenantId, 'CATALOG_CHANGED', { productId: saved.id, action: 'UPDATE' });
    }
    return saved;
  }

  async deleteProduct(tenantId: string, productId: string): Promise<{ success: boolean; message: string }> {
    const product = await this.getProductById(tenantId, productId);
    product.isActive = false;
    product.archivedAt = new Date();
    await this.productRepo.save(product);
    if (this.realtimeService) {
      this.realtimeService.emit(tenantId, 'CATALOG_CHANGED', { productId, action: 'DELETE' });
    }
    return { success: true, message: 'Product archived successfully' };
  }

  async searchProductByBarcodeOrSku(tenantId: string, query: string): Promise<ProductEntity | null> {
    const cleanQuery = query.trim();
    return this.productRepo.findOne({
      where: [
        { tenantId, barcodePrimary: cleanQuery, isActive: true },
        { tenantId, sku: cleanQuery.toUpperCase(), isActive: true },
      ],
    });
  }

  // --- Inventory & Stock Movement ---

  /**
   * Records an immutable stock movement and updates the projected stock balance in one transaction.
   * Enforces idempotency via the unique idempotency key per tenant.
   */
  async recordStockMovement(
    tenantId: string,
    userId: string,
    dto: RecordStockMovementDto,
    tenantContext?: TenantContext,
  ): Promise<{ ledger: StockLedgerEntity; balance: StockBalanceEntity }> {
    const movementType = dto.movementType ?? StockMovementType.ADJUSTMENT;

    // Sensitive permission validation: manual adjustments require STOCK_ADJUSTMENT_MANUAL
    const isManualAdjustment =
      movementType === StockMovementType.ADJUSTMENT ||
      movementType === StockMovementType.DAMAGE ||
      movementType === StockMovementType.EXPIRY;

    if (isManualAdjustment && tenantContext && !tenantContext.isOwner) {
      if (!tenantContext.permissions.includes(Permission.STOCK_ADJUSTMENT_MANUAL)) {
        throw new ForbiddenException(
          "Forbidden: Missing required permission 'stock:adjustment:manual' for manual stock adjustments",
        );
      }
    }

    const result = await this.dataSource.transaction(async (manager) => {
      // 1. Check idempotency
      const existingMovement = await manager.findOne(StockLedgerEntity, {
        where: { tenantId, idempotencyKey: dto.idempotencyKey },
      });
      if (existingMovement) {
        const currentBalance = await manager.findOne(StockBalanceEntity, {
          where: { tenantId, branchId: dto.branchId, productId: dto.productId },
        });
        return {
          ledger: existingMovement,
          balance: currentBalance ?? {
            tenantId,
            branchId: dto.branchId,
            productId: dto.productId,
            quantityOnHand: '0',
            lowStockThreshold: '5',
            updatedAt: new Date(),
          },
        };
      }

      // 2. Validate product exists
      const product = await manager.findOne(ProductEntity, {
        where: { id: dto.productId, tenantId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${dto.productId} not found`);
      }

      // 3. Insert immutable ledger entry
      const movement = manager.create(StockLedgerEntity, {
        tenantId,
        branchId: dto.branchId,
        productId: dto.productId,
        movementType,
        quantityDelta: dto.quantityDelta,
        unitCost: dto.unitCost ?? product.purchaseCost,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        idempotencyKey: dto.idempotencyKey,
        createdBy: userId,
        reason: dto.reason ?? null,
      });
      const savedLedger = await manager.save(movement);

      // 4. Update or insert stock balance projection
      let balance = await manager.findOne(StockBalanceEntity, {
        where: { tenantId, branchId: dto.branchId, productId: dto.productId },
      });

      const deltaNum = parseFloat(dto.quantityDelta);
      if (!balance) {
        balance = manager.create(StockBalanceEntity, {
          tenantId,
          branchId: dto.branchId,
          productId: dto.productId,
          quantityOnHand: deltaNum.toFixed(3),
          lowStockThreshold: '5.000',
        });
      } else {
        const currentOnHand = parseFloat(balance.quantityOnHand);
        const newOnHand = (currentOnHand + deltaNum).toFixed(3);
        balance.quantityOnHand = newOnHand;
      }

      const savedBalance = await manager.save(balance);

      if (this.auditService && isManualAdjustment) {
        await this.auditService.log({
          tenantId,
          userId,
          action: 'STOCK_ADJUSTED',
          resourceType: 'stock_ledger',
          resourceId: savedLedger.id,
          details: {
            productId: dto.productId,
            branchId: dto.branchId,
            quantityDelta: dto.quantityDelta,
            reason: dto.reason,
            movementType,
          },
        });
      }

      return {
        ledger: savedLedger,
        balance: savedBalance,
      };
    });

    if (this.realtimeService) {
      this.realtimeService.emit(
        tenantId,
        'STOCK_CHANGED',
        {
          productId: dto.productId,
          branchId: dto.branchId,
          quantityOnHand: result.balance.quantityOnHand,
          reason: movementType,
        },
        dto.branchId,
      );
    }

    return result;
  }

  async getLowStockProducts(tenantId: string, branchId: string): Promise<StockBalanceEntity[]> {
    return this.stockBalanceRepo
      .createQueryBuilder('sb')
      .where('sb.tenant_id = :tenantId', { tenantId })
      .andWhere('sb.branch_id = :branchId', { branchId })
      .andWhere('sb.quantity_on_hand <= sb.low_stock_threshold')
      .getMany();
  }

  async getStockBalances(tenantId: string, branchId?: string): Promise<StockBalanceEntity[]> {
    const where: any = { tenantId };
    if (branchId) {
      where.branchId = branchId;
    }
    return this.stockBalanceRepo.find({ where });
  }

  // --- Supplier Management ---

  async createSupplier(tenantId: string, dto: CreateSupplierDto): Promise<SupplierEntity> {
    const supplier = this.supplierRepo.create({
      tenantId,
      name: dto.name.trim(),
      contactPerson: dto.contactPerson?.trim() ?? null,
      phone: dto.phone?.trim() ?? null,
      email: dto.email?.trim() ?? null,
      gstin: dto.gstin?.trim() ?? null,
      isActive: true,
    });
    return this.supplierRepo.save(supplier);
  }

  async getSuppliers(tenantId: string): Promise<SupplierEntity[]> {
    return this.supplierRepo.find({
      where: { tenantId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getSupplierById(tenantId: string, id: string): Promise<SupplierEntity> {
    const supplier = await this.supplierRepo.findOne({
      where: { id, tenantId },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${id} not found`);
    }
    return supplier;
  }

  async updateSupplier(tenantId: string, id: string, dto: UpdateSupplierDto): Promise<SupplierEntity> {
    const supplier = await this.getSupplierById(tenantId, id);
    if (dto.name !== undefined) supplier.name = dto.name.trim();
    if (dto.contactPerson !== undefined) supplier.contactPerson = dto.contactPerson?.trim() ?? null;
    if (dto.phone !== undefined) supplier.phone = dto.phone?.trim() ?? null;
    if (dto.email !== undefined) supplier.email = dto.email?.trim() ?? null;
    if (dto.gstin !== undefined) supplier.gstin = dto.gstin?.trim() ?? null;
    if (dto.isActive !== undefined) supplier.isActive = dto.isActive;
    return this.supplierRepo.save(supplier);
  }

  async deleteSupplier(tenantId: string, id: string): Promise<SupplierEntity> {
    const supplier = await this.getSupplierById(tenantId, id);
    supplier.isActive = false;
    return this.supplierRepo.save(supplier);
  }

  // --- Purchase Orders & GRN ---

  async createPurchaseOrder(
    tenantId: string,
    userId: string,
    dto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrderEntity> {
    const supplier = await this.supplierRepo.findOne({
      where: { id: dto.supplierId, tenantId, isActive: true },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${dto.supplierId} not found or inactive`);
    }

    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Purchase order must contain at least one line item');
    }

    return this.dataSource.transaction(async (manager) => {
      const productIds = dto.lines.map((l) => l.productId);
      const products = await manager.findByIds(ProductEntity, productIds);
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const line of dto.lines) {
        if (!productMap.has(line.productId)) {
          throw new NotFoundException(`Product ${line.productId} not found in tenant`);
        }
      }

      const orderNumber =
        dto.orderNumber?.trim() ||
        `PO-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      let subtotalAcc = 0;
      let taxAmountAcc = 0;

      const preparedLines: Partial<PurchaseOrderLineEntity>[] = [];

      for (const line of dto.lines) {
        const product = productMap.get(line.productId)!;
        const qty = parseFloat(line.quantityOrdered);
        const cost = parseFloat(line.unitCost);
        const lineBase = Math.round(qty * cost * 100) / 100;

        const taxRate =
          line.taxRatePercent !== undefined
            ? parseFloat(line.taxRatePercent)
            : parseFloat(product.gstRatePercent || '0');

        const tax = Math.round(lineBase * (taxRate / 100) * 100) / 100;
        const lineTotal = lineBase + tax;

        subtotalAcc += lineBase;
        taxAmountAcc += tax;

        preparedLines.push({
          tenantId,
          productId: line.productId,
          quantityOrdered: qty.toFixed(3),
          quantityReceived: '0.000',
          unitCost: cost.toFixed(2),
          taxRatePercent: taxRate.toFixed(2),
          lineTotal: lineTotal.toFixed(2),
        });
      }

      const totalAmount = subtotalAcc + taxAmountAcc;

      const po = manager.create(PurchaseOrderEntity, {
        tenantId,
        branchId: dto.branchId,
        supplierId: dto.supplierId,
        orderNumber,
        status: PurchaseOrderStatus.DRAFT,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
        subtotal: subtotalAcc.toFixed(2),
        taxAmount: taxAmountAcc.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        notes: dto.notes?.trim() ?? null,
        createdBy: userId,
      });

      const savedPo = await manager.save(PurchaseOrderEntity, po);

      const linesToSave = preparedLines.map((l) =>
        manager.create(PurchaseOrderLineEntity, {
          ...l,
          purchaseOrderId: savedPo.id,
        }),
      );

      await manager.save(PurchaseOrderLineEntity, linesToSave);

      if (this.auditService) {
        await this.auditService.log({
          tenantId,
          userId,
          action: 'PURCHASE_ORDER_CREATE',
          resourceType: 'purchase_orders',
          resourceId: savedPo.id,
          details: {
            orderNumber: savedPo.orderNumber,
            supplierId: dto.supplierId,
            branchId: dto.branchId,
            totalAmount: savedPo.totalAmount,
            linesCount: preparedLines.length,
          },
        });
      }

      return manager.findOneOrFail(PurchaseOrderEntity, {
        where: { id: savedPo.id, tenantId },
        relations: ['supplier', 'lines', 'lines.product'],
      });
    });
  }

  async getPurchaseOrders(
    tenantId: string,
    branchId?: string,
    supplierId?: string,
    status?: PurchaseOrderStatus,
  ): Promise<PurchaseOrderEntity[]> {
    const query = this.poRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.lines', 'lines')
      .leftJoinAndSelect('lines.product', 'product')
      .where('po.tenant_id = :tenantId', { tenantId })
      .orderBy('po.created_at', 'DESC');

    if (branchId) {
      query.andWhere('po.branch_id = :branchId', { branchId });
    }
    if (supplierId) {
      query.andWhere('po.supplier_id = :supplierId', { supplierId });
    }
    if (status) {
      query.andWhere('po.status = :status', { status });
    }

    return query.getMany();
  }

  async getPurchaseOrderById(tenantId: string, id: string): Promise<PurchaseOrderEntity> {
    const po = await this.poRepo.findOne({
      where: { id, tenantId },
      relations: ['supplier', 'lines', 'lines.product'],
    });
    if (!po) {
      throw new NotFoundException(`Purchase Order ${id} not found`);
    }
    return po;
  }

  async updatePurchaseOrderStatus(
    tenantId: string,
    id: string,
    status: PurchaseOrderStatus,
  ): Promise<PurchaseOrderEntity> {
    const po = await this.getPurchaseOrderById(tenantId, id);
    po.status = status;
    return this.poRepo.save(po);
  }

  async receiveGoods(
    tenantId: string,
    userId: string,
    poId: string,
    dto: ReceivePurchaseOrderDto,
  ): Promise<PurchaseOrderEntity> {
    return this.dataSource.transaction(async (manager) => {
      const po = await manager.findOne(PurchaseOrderEntity, {
        where: { id: poId, tenantId },
        relations: ['lines', 'supplier'],
      });

      if (!po) {
        throw new NotFoundException(`Purchase order ${poId} not found`);
      }

      if (po.status === PurchaseOrderStatus.CANCELLED) {
        throw new BadRequestException('Cannot receive goods against a cancelled purchase order');
      }

      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException('At least one line item receipt must be specified');
      }

      const lineMap = new Map((po.lines || []).map((l) => [l.id, l]));

      for (const item of dto.items) {
        const line = lineMap.get(item.lineId);
        if (!line) {
          throw new NotFoundException(`Line item ${item.lineId} does not belong to purchase order ${poId}`);
        }

        const qtyDelta = parseFloat(item.quantityReceived);
        if (isNaN(qtyDelta) || qtyDelta <= 0) {
          throw new BadRequestException(`Received quantity must be positive for line ${item.lineId}`);
        }

        const currentReceived = parseFloat(line.quantityReceived || '0');
        const newReceived = currentReceived + qtyDelta;

        line.quantityReceived = newReceived.toFixed(3);
        await manager.save(PurchaseOrderLineEntity, line);

        // 1. Immutable Stock Ledger Entry
        const ledgerIdempotencyKey =
          dto.idempotencyKey
            ? `${dto.idempotencyKey}-${line.id}`
            : `grn-${po.id}-${line.id}-${Date.now()}`;

        const existingLedger = await manager.findOne(StockLedgerEntity, {
          where: { tenantId, idempotencyKey: ledgerIdempotencyKey },
        });

        if (!existingLedger) {
          const ledgerEntry = manager.create(StockLedgerEntity, {
            tenantId,
            branchId: po.branchId,
            productId: line.productId,
            movementType: StockMovementType.PURCHASE,
            quantityDelta: qtyDelta.toFixed(3),
            unitCost: line.unitCost,
            sourceType: 'purchase_order',
            sourceId: po.id,
            idempotencyKey: ledgerIdempotencyKey,
            createdBy: userId,
            reason: dto.notes ?? `GRN receipt for PO ${po.orderNumber}`,
          });
          await manager.save(StockLedgerEntity, ledgerEntry);

          // 2. Stock Balance Projection
          let balance = await manager.findOne(StockBalanceEntity, {
            where: { tenantId, branchId: po.branchId, productId: line.productId },
          });

          if (!balance) {
            balance = manager.create(StockBalanceEntity, {
              tenantId,
              branchId: po.branchId,
              productId: line.productId,
              quantityOnHand: qtyDelta.toFixed(3),
              lowStockThreshold: '5.000',
            });
          } else {
            const currentBalance = parseFloat(balance.quantityOnHand);
            balance.quantityOnHand = (currentBalance + qtyDelta).toFixed(3);
          }
          await manager.save(StockBalanceEntity, balance);
        }
      }

      // Check if all lines are fully received
      const allFullyReceived = (po.lines || []).every(
        (l) => parseFloat(l.quantityReceived) >= parseFloat(l.quantityOrdered),
      );

      if (allFullyReceived) {
        po.status = PurchaseOrderStatus.RECEIVED;
      } else {
        po.status = PurchaseOrderStatus.ORDERED;
      }

      await manager.save(PurchaseOrderEntity, po);

      if (this.auditService) {
        await this.auditService.log({
          tenantId,
          userId,
          action: 'PURCHASE_ORDER_GRN_RECEIVE',
          resourceType: 'purchase_orders',
          resourceId: po.id,
          details: {
            orderNumber: po.orderNumber,
            status: po.status,
            receivedItems: dto.items,
          },
        });
      }

      return manager.findOneOrFail(PurchaseOrderEntity, {
        where: { id: po.id, tenantId },
        relations: ['supplier', 'lines', 'lines.product'],
      });
    });
  }

  // --- Multi-Branch Stock Transfer Management ---

  async createStockTransfer(
    tenantId: string,
    userId: string,
    dto: CreateStockTransferDto,
    tenantContext?: TenantContext,
  ): Promise<StockTransferEntity> {
    if (dto.sourceBranchId === dto.destinationBranchId) {
      throw new BadRequestException('Source and destination branches cannot be the same');
    }

    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('At least one line item is required for a stock transfer');
    }

    // Validate branches belong to tenant
    const [sourceBranch, destBranch] = await Promise.all([
      this.branchRepo.findOne({ where: { id: dto.sourceBranchId, tenantId } }),
      this.branchRepo.findOne({ where: { id: dto.destinationBranchId, tenantId } }),
    ]);
    if (!sourceBranch) {
      throw new NotFoundException(`Source branch ${dto.sourceBranchId} not found`);
    }
    if (!destBranch) {
      throw new NotFoundException(`Destination branch ${dto.destinationBranchId} not found`);
    }

    // Branch-level access validation for non-owners
    if (tenantContext?.branchId) {
      if (
        tenantContext.branchId !== dto.sourceBranchId &&
        tenantContext.branchId !== dto.destinationBranchId
      ) {
        throw new ForbiddenException(
          'Forbidden: You can only create stock transfers involving your assigned branch',
        );
      }
    }

    const transferNumber =
      dto.transferNumber?.trim() ||
      `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const existing = await this.transferRepo.findOne({
      where: { tenantId, transferNumber },
    });
    if (existing) {
      throw new ConflictException(`Transfer number "${transferNumber}" already exists`);
    }

    // Validate products exist
    for (const lineDto of dto.lines) {
      const product = await this.productRepo.findOne({
        where: { id: lineDto.productId, tenantId, isActive: true },
      });
      if (!product) {
        throw new NotFoundException(`Product ${lineDto.productId} not found or inactive`);
      }
      const qtyReq = parseFloat(lineDto.quantityRequested);
      if (isNaN(qtyReq) || qtyReq <= 0) {
        throw new BadRequestException(`Requested quantity for product ${product.name} must be greater than 0`);
      }
    }

    const totalItemsRequested = dto.lines
      .reduce((sum, l) => sum + parseFloat(l.quantityRequested), 0)
      .toFixed(3);

    const transfer = this.transferRepo.create({
      tenantId,
      transferNumber,
      sourceBranchId: dto.sourceBranchId,
      destinationBranchId: dto.destinationBranchId,
      status: StockTransferStatus.DRAFT,
      totalItemsRequested,
      totalItemsDispatched: '0.000',
      totalItemsReceived: '0.000',
      hasDiscrepancy: false,
      notes: dto.notes?.trim() ?? null,
      createdBy: userId,
    });

    const savedTransfer = await this.transferRepo.save(transfer);

    const linesToSave: StockTransferLineEntity[] = [];
    for (const lineDto of dto.lines) {
      const product = await this.productRepo.findOneOrFail({
        where: { id: lineDto.productId, tenantId },
      });
      const line = this.transferLineRepo.create({
        tenantId,
        transferId: savedTransfer.id,
        productId: lineDto.productId,
        quantityRequested: parseFloat(lineDto.quantityRequested).toFixed(3),
        quantityDispatched: '0.000',
        quantityReceived: '0.000',
        unitCost: lineDto.unitCost ?? product.purchaseCost,
        hasDiscrepancy: false,
        discrepancyQuantity: '0.000',
        discrepancyReason: null,
        notes: lineDto.notes?.trim() ?? null,
      });
      linesToSave.push(line);
    }
    await this.transferLineRepo.save(linesToSave);

    if (this.auditService) {
      await this.auditService.log({
        tenantId,
        userId,
        action: 'STOCK_TRANSFER_CREATED',
        resourceType: 'stock_transfers',
        resourceId: savedTransfer.id,
        details: {
          transferNumber,
          sourceBranchId: dto.sourceBranchId,
          destinationBranchId: dto.destinationBranchId,
          totalItemsRequested,
          linesCount: linesToSave.length,
        },
      });
    }

    if (dto.autoDispatch) {
      return this.dispatchStockTransfer(tenantId, userId, savedTransfer.id, {}, tenantContext);
    }

    return this.getStockTransferById(tenantId, savedTransfer.id);
  }

  async dispatchStockTransfer(
    tenantId: string,
    userId: string,
    transferId: string,
    dto: DispatchStockTransferDto,
    tenantContext?: TenantContext,
  ): Promise<StockTransferEntity> {
    const transfer = await this.transferRepo.findOne({
      where: { id: transferId, tenantId },
      relations: ['lines', 'sourceBranch', 'destinationBranch'],
    });
    if (!transfer) {
      throw new NotFoundException(`Stock transfer ${transferId} not found`);
    }

    if (transfer.status !== StockTransferStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot dispatch stock transfer with status "${transfer.status}". Only DRAFT transfers can be dispatched.`,
      );
    }

    if (tenantContext?.branchId && tenantContext.branchId !== transfer.sourceBranchId) {
      throw new ForbiddenException(
        'Forbidden: Only the source branch manager or store owner can dispatch this transfer',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const lines = transfer.lines || [];
      let totalDispatched = 0;

      for (const line of lines) {
        const qtyToDispatch = parseFloat(line.quantityRequested);
        if (qtyToDispatch <= 0) continue;

        // Check on-hand stock balance at source branch
        const balance = await manager.findOne(StockBalanceEntity, {
          where: { tenantId, branchId: transfer.sourceBranchId, productId: line.productId },
        });
        const currentOnHand = balance ? parseFloat(balance.quantityOnHand) : 0;

        if (currentOnHand < qtyToDispatch) {
          throw new BadRequestException(
            `Insufficient stock for product ${line.productId} at source branch. On-hand: ${currentOnHand}, Requested: ${qtyToDispatch}`,
          );
        }

        // 1. Record immutable StockLedgerEntity (TRANSFER_OUT)
        const outLedger = manager.create(StockLedgerEntity, {
          tenantId,
          branchId: transfer.sourceBranchId,
          productId: line.productId,
          movementType: StockMovementType.TRANSFER_OUT,
          quantityDelta: (-qtyToDispatch).toFixed(3),
          unitCost: line.unitCost,
          sourceType: 'stock_transfer',
          sourceId: transfer.id,
          idempotencyKey: dto.idempotencyKey
            ? `${dto.idempotencyKey}-OUT-${line.id}`
            : `TRF-${transfer.id}-OUT-${line.id}`,
          createdBy: userId,
          reason: `Inter-branch transfer ${transfer.transferNumber} dispatched to ${transfer.destinationBranch?.name || transfer.destinationBranchId}`,
        });
        await manager.save(StockLedgerEntity, outLedger);

        // 2. Decrement source branch stock balance projection
        balance!.quantityOnHand = (currentOnHand - qtyToDispatch).toFixed(3);
        await manager.save(StockBalanceEntity, balance!);

        // 3. Update line quantity dispatched
        line.quantityDispatched = qtyToDispatch.toFixed(3);
        await manager.save(StockTransferLineEntity, line);

        totalDispatched += qtyToDispatch;
      }

      transfer.status = StockTransferStatus.IN_TRANSIT;
      transfer.dispatchedAt = new Date();
      transfer.dispatchedBy = userId;
      transfer.totalItemsDispatched = totalDispatched.toFixed(3);
      if (dto.notes) {
        transfer.notes = (transfer.notes ? transfer.notes + '\n' : '') + dto.notes;
      }
      await manager.save(StockTransferEntity, transfer);

      if (this.auditService) {
        await this.auditService.log({
          tenantId,
          userId,
          action: 'STOCK_TRANSFER_DISPATCHED',
          resourceType: 'stock_transfers',
          resourceId: transfer.id,
          details: {
            transferNumber: transfer.transferNumber,
            totalDispatched: totalDispatched.toFixed(3),
            sourceBranchId: transfer.sourceBranchId,
            destinationBranchId: transfer.destinationBranchId,
          },
        });
      }

      return manager.findOneOrFail(StockTransferEntity, {
        where: { id: transfer.id, tenantId },
        relations: ['sourceBranch', 'destinationBranch', 'lines', 'lines.product'],
      });
    });
  }

  async receiveStockTransfer(
    tenantId: string,
    userId: string,
    transferId: string,
    dto: ReceiveStockTransferDto,
    tenantContext?: TenantContext,
  ): Promise<StockTransferEntity> {
    const transfer = await this.transferRepo.findOne({
      where: { id: transferId, tenantId },
      relations: ['lines', 'sourceBranch', 'destinationBranch'],
    });
    if (!transfer) {
      throw new NotFoundException(`Stock transfer ${transferId} not found`);
    }

    if (
      transfer.status !== StockTransferStatus.IN_TRANSIT &&
      transfer.status !== StockTransferStatus.DISPATCHED
    ) {
      throw new BadRequestException(
        `Cannot receive transfer with status "${transfer.status}". Only IN_TRANSIT transfers can be received.`,
      );
    }

    if (tenantContext?.branchId && tenantContext.branchId !== transfer.destinationBranchId) {
      throw new ForbiddenException(
        'Forbidden: Only the destination branch manager or store owner can receive this transfer',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const lines = transfer.lines || [];
      let totalReceived = 0;
      let hasAnyDiscrepancy = false;
      const discrepancyDetails: string[] = [];

      for (const line of lines) {
        const receivedItem = (dto.items || []).find((i) => i.lineId === line.id);
        const qtyReceived = receivedItem
          ? parseFloat(receivedItem.quantityReceived)
          : parseFloat(line.quantityDispatched);

        if (isNaN(qtyReceived) || qtyReceived < 0) {
          throw new BadRequestException(
            `Received quantity for line ${line.id} must be a non-negative decimal string`,
          );
        }

        const qtyDispatched = parseFloat(line.quantityDispatched);
        const diff = qtyDispatched - qtyReceived;

        if (Math.abs(diff) > 0.0001) {
          hasAnyDiscrepancy = true;
          line.hasDiscrepancy = true;
          line.discrepancyQuantity = diff.toFixed(3);
          line.discrepancyReason =
            receivedItem?.discrepancyReason ||
            dto.discrepancyReason ||
            (diff > 0 ? `${diff} units missing in transit` : `${-diff} extra units received`);
          discrepancyDetails.push(
            `Line ${line.productId}: Dispatched ${qtyDispatched}, Received ${qtyReceived} (${line.discrepancyReason})`,
          );
        } else {
          line.hasDiscrepancy = false;
          line.discrepancyQuantity = '0.000';
          line.discrepancyReason = null;
        }

        line.quantityReceived = qtyReceived.toFixed(3);
        await manager.save(StockTransferLineEntity, line);
        totalReceived += qtyReceived;

        // Inward stock movement for destination branch if qtyReceived > 0
        if (qtyReceived > 0) {
          const inLedger = manager.create(StockLedgerEntity, {
            tenantId,
            branchId: transfer.destinationBranchId,
            productId: line.productId,
            movementType: StockMovementType.TRANSFER_IN,
            quantityDelta: qtyReceived.toFixed(3),
            unitCost: line.unitCost,
            sourceType: 'stock_transfer',
            sourceId: transfer.id,
            idempotencyKey: dto.idempotencyKey
              ? `${dto.idempotencyKey}-IN-${line.id}`
              : `TRF-${transfer.id}-IN-${line.id}`,
            createdBy: userId,
            reason: `Inter-branch transfer ${transfer.transferNumber} received from ${transfer.sourceBranch?.name || transfer.sourceBranchId}`,
          });
          await manager.save(StockLedgerEntity, inLedger);

          // Update destination branch stock balance
          let destBalance = await manager.findOne(StockBalanceEntity, {
            where: { tenantId, branchId: transfer.destinationBranchId, productId: line.productId },
          });

          if (!destBalance) {
            destBalance = manager.create(StockBalanceEntity, {
              tenantId,
              branchId: transfer.destinationBranchId,
              productId: line.productId,
              quantityOnHand: qtyReceived.toFixed(3),
              lowStockThreshold: '5.000',
            });
          } else {
            const currentDestOnHand = parseFloat(destBalance.quantityOnHand);
            destBalance.quantityOnHand = (currentDestOnHand + qtyReceived).toFixed(3);
          }
          await manager.save(StockBalanceEntity, destBalance);
        }
      }

      transfer.status = StockTransferStatus.RECEIVED;
      transfer.receivedAt = new Date();
      transfer.receivedBy = userId;
      transfer.totalItemsReceived = totalReceived.toFixed(3);
      transfer.hasDiscrepancy = hasAnyDiscrepancy;
      if (hasAnyDiscrepancy) {
        transfer.discrepancyReason = dto.discrepancyReason || discrepancyDetails.join('; ');
      }
      if (dto.notes) {
        transfer.notes = (transfer.notes ? transfer.notes + '\n' : '') + dto.notes;
      }
      await manager.save(StockTransferEntity, transfer);

      if (this.auditService) {
        await this.auditService.log({
          tenantId,
          userId,
          action: 'STOCK_TRANSFER_RECEIVED',
          resourceType: 'stock_transfers',
          resourceId: transfer.id,
          details: {
            transferNumber: transfer.transferNumber,
            totalReceived: totalReceived.toFixed(3),
            hasDiscrepancy: hasAnyDiscrepancy,
            discrepancyReason: transfer.discrepancyReason,
          },
        });
      }

      return manager.findOneOrFail(StockTransferEntity, {
        where: { id: transfer.id, tenantId },
        relations: ['sourceBranch', 'destinationBranch', 'lines', 'lines.product'],
      });
    });
  }

  async cancelStockTransfer(
    tenantId: string,
    userId: string,
    transferId: string,
    dto: CancelStockTransferDto,
    tenantContext?: TenantContext,
  ): Promise<StockTransferEntity> {
    const transfer = await this.transferRepo.findOne({
      where: { id: transferId, tenantId },
      relations: ['lines', 'sourceBranch', 'destinationBranch'],
    });
    if (!transfer) {
      throw new NotFoundException(`Stock transfer ${transferId} not found`);
    }

    if (
      transfer.status === StockTransferStatus.RECEIVED ||
      transfer.status === StockTransferStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel stock transfer with status "${transfer.status}".`,
      );
    }

    // If DRAFT, no stock was deducted, simply mark CANCELLED
    if (transfer.status === StockTransferStatus.DRAFT) {
      transfer.status = StockTransferStatus.CANCELLED;
      if (dto.reason) {
        transfer.notes = (transfer.notes ? transfer.notes + '\n' : '') + `Cancellation Reason: ${dto.reason}`;
      }
      await this.transferRepo.save(transfer);

      if (this.auditService) {
        await this.auditService.log({
          tenantId,
          userId,
          action: 'STOCK_TRANSFER_CANCELLED',
          resourceType: 'stock_transfers',
          resourceId: transfer.id,
          details: { transferNumber: transfer.transferNumber, reason: dto.reason },
        });
      }
      return transfer;
    }

    // If IN_TRANSIT, reverse the deduction from source branch
    return this.dataSource.transaction(async (manager) => {
      const lines = transfer.lines || [];
      for (const line of lines) {
        const qtyDispatched = parseFloat(line.quantityDispatched);
        if (qtyDispatched > 0) {
          const revLedger = manager.create(StockLedgerEntity, {
            tenantId,
            branchId: transfer.sourceBranchId,
            productId: line.productId,
            movementType: StockMovementType.TRANSFER_IN,
            quantityDelta: qtyDispatched.toFixed(3),
            unitCost: line.unitCost,
            sourceType: 'stock_transfer_reversal',
            sourceId: transfer.id,
            idempotencyKey: `TRF-${transfer.id}-REV-${line.id}`,
            createdBy: userId,
            reason: `Reversal of cancelled transfer ${transfer.transferNumber}`,
          });
          await manager.save(StockLedgerEntity, revLedger);

          let balance = await manager.findOne(StockBalanceEntity, {
            where: { tenantId, branchId: transfer.sourceBranchId, productId: line.productId },
          });
          if (balance) {
            const currentOnHand = parseFloat(balance.quantityOnHand);
            balance.quantityOnHand = (currentOnHand + qtyDispatched).toFixed(3);
            await manager.save(StockBalanceEntity, balance);
          }
        }
      }

      transfer.status = StockTransferStatus.CANCELLED;
      if (dto.reason) {
        transfer.notes = (transfer.notes ? transfer.notes + '\n' : '') + `Cancellation Reason: ${dto.reason}`;
      }
      await manager.save(StockTransferEntity, transfer);

      if (this.auditService) {
        await this.auditService.log({
          tenantId,
          userId,
          action: 'STOCK_TRANSFER_CANCELLED',
          resourceType: 'stock_transfers',
          resourceId: transfer.id,
          details: { transferNumber: transfer.transferNumber, reversedStock: true, reason: dto.reason },
        });
      }

      return manager.findOneOrFail(StockTransferEntity, {
        where: { id: transfer.id, tenantId },
        relations: ['sourceBranch', 'destinationBranch', 'lines', 'lines.product'],
      });
    });
  }

  async getStockTransfers(
    tenantId: string,
    filters?: {
      branchId?: string;
      sourceBranchId?: string;
      destinationBranchId?: string;
      status?: StockTransferStatus;
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: StockTransferEntity[]; total: number; page: number; limit: number }> {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 50;
    const skip = (page - 1) * limit;

    let where: FindOptionsWhere<StockTransferEntity> | FindOptionsWhere<StockTransferEntity>[];

    if (filters?.branchId) {
      where = [
        {
          tenantId,
          sourceBranchId: filters.branchId,
          ...(filters.sourceBranchId ? { sourceBranchId: filters.sourceBranchId } : {}),
          ...(filters.destinationBranchId ? { destinationBranchId: filters.destinationBranchId } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        },
        {
          tenantId,
          destinationBranchId: filters.branchId,
          ...(filters.sourceBranchId ? { sourceBranchId: filters.sourceBranchId } : {}),
          ...(filters.destinationBranchId ? { destinationBranchId: filters.destinationBranchId } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        },
      ];
    } else {
      where = {
        tenantId,
        ...(filters?.sourceBranchId ? { sourceBranchId: filters.sourceBranchId } : {}),
        ...(filters?.destinationBranchId ? { destinationBranchId: filters.destinationBranchId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      };
    }

    const [data, total] = await this.transferRepo.findAndCount({
      where,
      relations: ['sourceBranch', 'destinationBranch', 'lines', 'lines.product'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getStockTransferById(tenantId: string, transferId: string): Promise<StockTransferEntity> {
    const transfer = await this.transferRepo.findOne({
      where: { id: transferId, tenantId },
      relations: ['sourceBranch', 'destinationBranch', 'lines', 'lines.product'],
    });
    if (!transfer) {
      throw new NotFoundException(`Stock transfer ${transferId} not found`);
    }
    return transfer;
  }
}
