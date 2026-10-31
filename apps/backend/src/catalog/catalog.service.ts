import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';
import { UnitEntity } from './entities/unit.entity';
import { SupplierEntity } from './entities/supplier.entity';
import { StockLedgerEntity } from './entities/stock-ledger.entity';
import { StockBalanceEntity } from './entities/stock-balance.entity';
import {
  CreateCategoryDto,
  CreateProductDto,
  RecordStockMovementDto,
} from './dto/catalog.dto';

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
    @InjectRepository(StockLedgerEntity)
    private readonly stockLedgerRepo: Repository<StockLedgerEntity>,
    @InjectRepository(StockBalanceEntity)
    private readonly stockBalanceRepo: Repository<StockBalanceEntity>,
    private readonly dataSource: DataSource,
  ) {}

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
    });
    return this.categoryRepo.save(category);
  }

  async getCategories(tenantId: string): Promise<CategoryEntity[]> {
    return this.categoryRepo.find({
      where: { tenantId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async createProduct(tenantId: string, dto: CreateProductDto): Promise<ProductEntity> {
    const existingSku = await this.productRepo.findOne({
      where: { tenantId, sku: dto.sku.toUpperCase() },
    });
    if (existingSku) {
      throw new ConflictException(`Product SKU ${dto.sku} already exists`);
    }

    const product = this.productRepo.create({
      tenantId,
      sku: dto.sku.toUpperCase(),
      name: dto.name,
      barcodePrimary: dto.barcodePrimary ?? null,
      categoryId: dto.categoryId ?? null,
      baseUnitId: dto.baseUnitId ?? null,
      purchaseCost: dto.purchaseCost,
      sellingPrice: dto.sellingPrice,
      mrp: dto.mrp,
      productType: dto.productType,
      trackInventory: dto.trackInventory ?? true,
    });

    return this.productRepo.save(product);
  }

  async getProducts(tenantId: string): Promise<ProductEntity[]> {
    return this.productRepo.find({
      where: { tenantId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async searchProductByBarcodeOrSku(tenantId: string, query: string): Promise<ProductEntity | null> {
    return this.productRepo.findOne({
      where: [
        { tenantId, barcodePrimary: query, isActive: true },
        { tenantId, sku: query.toUpperCase(), isActive: true },
      ],
    });
  }

  /**
   * Records an immutable stock movement and updates the projected stock balance in one transaction.
   * Enforces idempotency via the unique idempotency key per tenant.
   */
  async recordStockMovement(
    tenantId: string,
    userId: string,
    dto: RecordStockMovementDto,
  ): Promise<{ ledger: StockLedgerEntity; balance: StockBalanceEntity }> {
    return this.dataSource.transaction(async (manager) => {
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
        movementType: dto.movementType,
        quantityDelta: dto.quantityDelta,
        unitCost: dto.unitCost,
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

      return {
        ledger: savedLedger,
        balance: savedBalance,
      };
    });
  }

  async getLowStockProducts(tenantId: string, branchId: string): Promise<StockBalanceEntity[]> {
    return this.stockBalanceRepo
      .createQueryBuilder('sb')
      .where('sb.tenant_id = :tenantId', { tenantId })
      .andWhere('sb.branch_id = :branchId', { branchId })
      .andWhere('sb.quantity_on_hand <= sb.low_stock_threshold')
      .getMany();
  }
}

