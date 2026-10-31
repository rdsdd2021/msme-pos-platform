import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InvoiceEntity } from './invoice.entity';

@Entity('invoice_lines')
@Index(['tenantId', 'invoiceId'])
export class InvoiceLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId!: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @Column({ name: 'product_name_snapshot', type: 'varchar', length: 255 })
  productNameSnapshot!: string;

  @Column({ name: 'sku_snapshot', type: 'varchar', length: 64 })
  skuSnapshot!: string;

  @Column({ name: 'hsn_snapshot', type: 'varchar', length: 16, nullable: true })
  hsnSnapshot!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  quantity!: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 14, scale: 2 })
  unitPrice!: string;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  discountAmount!: string;

  @Column({ name: 'taxable_value', type: 'numeric', precision: 14, scale: 2 })
  taxableValue!: string;

  @Column({ name: 'gst_rate_percent', type: 'numeric', precision: 5, scale: 2, default: 0 })
  gstRatePercent!: string;

  @Column({ name: 'cgst_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  cgstAmount!: string;

  @Column({ name: 'sgst_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  sgstAmount!: string;

  @Column({ name: 'igst_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  igstAmount!: string;

  @Column({ name: 'line_total', type: 'numeric', precision: 14, scale: 2 })
  lineTotal!: string;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice!: InvoiceEntity;
}

