import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceLineEntity } from './entities/invoice-line.entity';
import { PaymentEntity } from './entities/payment.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvoiceEntity,
      InvoiceLineEntity,
      PaymentEntity,
      ProductEntity,
    ]),
    TenantsModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

