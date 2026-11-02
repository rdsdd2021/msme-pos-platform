import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { GstReportingService } from './gst-reporting.service';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceLineEntity } from './entities/invoice-line.entity';
import { PaymentEntity } from './entities/payment.entity';
import { CreditNoteEntity } from './entities/credit-note.entity';
import { CreditNoteLineEntity } from './entities/credit-note-line.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { CustomerEntity } from '../operations/entities/customer.entity';
import { CustomerLedgerEntity } from '../operations/entities/customer-ledger.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { SupplierEntity } from '../catalog/entities/supplier.entity';
import { SupplierInvoiceEntity } from '../catalog/entities/supplier-invoice.entity';
import { SupplierInvoiceLineEntity } from '../catalog/entities/supplier-invoice-line.entity';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvoiceEntity,
      InvoiceLineEntity,
      PaymentEntity,
      CreditNoteEntity,
      CreditNoteLineEntity,
      ProductEntity,
      CustomerEntity,
      CustomerLedgerEntity,
      BranchEntity,
      TenantEntity,
      SupplierEntity,
      SupplierInvoiceEntity,
      SupplierInvoiceLineEntity,
    ]),
    TenantsModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, GstReportingService],
  exports: [BillingService, GstReportingService],
})
export class BillingModule {}


