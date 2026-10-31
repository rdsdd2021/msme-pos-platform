import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';
import { UnitEntity } from './entities/unit.entity';
import { SupplierEntity } from './entities/supplier.entity';
import { StockLedgerEntity } from './entities/stock-ledger.entity';
import { StockBalanceEntity } from './entities/stock-balance.entity';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryEntity,
      ProductEntity,
      UnitEntity,
      SupplierEntity,
      StockLedgerEntity,
      StockBalanceEntity,
    ]),
    TenantsModule,
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}

