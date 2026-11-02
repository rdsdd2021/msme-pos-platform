import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupplierInvoiceEntity } from './supplier-invoice.entity';
import { ProductEntity } from './product.entity';

@Entity('supplier_invoice_lines')
@Index(['supplierInvoiceId'])
export class SupplierInvoiceLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'supplier_invoice_id', type: 'uuid' })
  supplierInvoiceId!: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ name: 'hsn_code', type: 'varchar', length: 16, nullable: true })
  hsnCode!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 1 })
  quantity!: string;

  @Column({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 2, default: 0 })
  unitCost!: string;

  @Column({ name: 'taxable_value', type: 'numeric', precision: 14, scale: 2, default: 0 })
  taxableValue!: string;

  @Column({ name: 'gst_rate_percent', type: 'numeric', precision: 5, scale: 2, default: 0 })
  gstRatePercent!: string;

  @Column({ name: 'cgst_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  cgstAmount!: string;

  @Column({ name: 'sgst_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  sgstAmount!: string;

  @Column({ name: 'igst_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  igstAmount!: string;

  @Column({ name: 'line_total', type: 'numeric', precision: 14, scale: 2, default: 0 })
  lineTotal!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => SupplierInvoiceEntity, (inv) => inv.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_invoice_id' })
  supplierInvoice!: SupplierInvoiceEntity;

  @ManyToOne(() => ProductEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product!: ProductEntity | null;
}

