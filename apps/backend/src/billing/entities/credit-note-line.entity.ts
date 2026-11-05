import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CreditNoteEntity } from './credit-note.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { InvoiceLineEntity } from './invoice-line.entity';

@Entity('credit_note_lines')
@Index(['tenantId', 'creditNoteId'])
@Index(['tenantId', 'productId'])
export class CreditNoteLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'credit_note_id', type: 'uuid' })
  creditNoteId!: string;

  @Column({ name: 'original_invoice_line_id', type: 'uuid', nullable: true })
  originalInvoiceLineId!: string | null;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'product_name_snapshot', type: 'varchar', length: 255 })
  productNameSnapshot!: string;

  @Column({ name: 'sku_snapshot', type: 'varchar', length: 64 })
  skuSnapshot!: string;

  @Column({ name: 'hsn_snapshot', type: 'varchar', length: 16, nullable: true })
  hsnSnapshot!: string | null;

  @Column({ name: 'quantity_returned', type: 'numeric', precision: 12, scale: 3 })
  quantityReturned!: string;

  @Column({ name: 'resellable_quantity', type: 'numeric', precision: 12, scale: 3, default: 0 })
  resellableQuantity!: string;

  @Column({ name: 'damaged_quantity', type: 'numeric', precision: 12, scale: 3, default: 0 })
  damagedQuantity!: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 14, scale: 2 })
  unitPrice!: string;

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

  @Column({ name: 'return_reason', type: 'varchar', length: 255, nullable: true })
  returnReason!: string | null;

  @ManyToOne(() => CreditNoteEntity, (cn) => cn.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'credit_note_id' })
  creditNote?: CreditNoteEntity;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductEntity;

  @ManyToOne(() => InvoiceLineEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'original_invoice_line_id' })
  originalInvoiceLine?: InvoiceLineEntity;
}
