import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { CustomerEntity } from './entities/customer.entity';
import { CustomerLedgerEntity } from './entities/customer-ledger.entity';
import { CashierShiftEntity } from './entities/cashier-shift.entity';
import { InvoiceEntity } from '../billing/entities/invoice.entity';
import { PaymentEntity } from '../billing/entities/payment.entity';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerEntity,
      CustomerLedgerEntity,
      CashierShiftEntity,
      InvoiceEntity,
      PaymentEntity,
    ]),
    TenantsModule,
  ],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}

