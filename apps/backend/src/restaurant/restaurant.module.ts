import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { RestaurantTableEntity } from './entities/restaurant-table.entity';
import { RestaurantOrderEntity } from './entities/restaurant-order.entity';
import { RestaurantKotEntity } from './entities/restaurant-kot.entity';
import { RestaurantKotLineEntity } from './entities/restaurant-kot-line.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RestaurantTableEntity,
      RestaurantOrderEntity,
      RestaurantKotEntity,
      RestaurantKotLineEntity,
      ProductEntity,
    ]),
    TenantsModule,
    BillingModule,
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService],
})
export class RestaurantModule {}

