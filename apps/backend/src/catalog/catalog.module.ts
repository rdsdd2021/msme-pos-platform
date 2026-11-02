import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';
import { UnitEntity } from './entities/unit.entity';
import { SupplierEntity } from './entities/supplier.entity';
import { PurchaseOrderEntity } from './entities/purchase-order.entity';
import { PurchaseOrderLineEntity } from './entities/purchase-order-line.entity';
import { StockLedgerEntity } from './entities/stock-ledger.entity';
import { StockBalanceEntity } from './entities/stock-balance.entity';
import { SupplierInvoiceEntity } from './entities/supplier-invoice.entity';
import { SupplierInvoiceLineEntity } from './entities/supplier-invoice-line.entity';
import { StockTransferEntity } from './entities/stock-transfer.entity';
import { StockTransferLineEntity } from './entities/stock-transfer-line.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryEntity,
      ProductEntity,
      UnitEntity,
      SupplierEntity,
      PurchaseOrderEntity,
      PurchaseOrderLineEntity,
      StockLedgerEntity,
      StockBalanceEntity,
      SupplierInvoiceEntity,
      SupplierInvoiceLineEntity,
      StockTransferEntity,
      StockTransferLineEntity,
      BranchEntity,
    ]),
    TenantsModule,
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}

