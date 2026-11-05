import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InvoiceEntity } from './invoice.entity';
import { CreditNoteLineEntity } from './credit-note-line.entity';

@Entity('credit_notes')
@Index(['tenantId', 'creditNoteNumber'], { unique: true })
@Index(['tenantId', 'idempotencyKey'], { unique: true })
@Index(['tenantId', 'originalInvoiceId'])
@Index(['tenantId', 'createdAt'])
export class CreditNoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'credit_note_number', type: 'varchar', length: 64 })
  creditNoteNumber!: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 128 })
  idempotencyKey!: string;

  @Column({ name: 'original_invoice_id', type: 'uuid' })
  originalInvoiceId!: string;

  @Column({ name: 'original_invoice_number', type: 'varchar', length: 64 })
  originalInvoiceNumber!: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Column({ name: 'customer_gstin_snapshot', type: 'varchar', length: 32, nullable: true })
  customerGstinSnapshot!: string | null;

  @Column({ name: 'place_of_supply', type: 'varchar', length: 10, nullable: true })
  placeOfSupply!: string | null;

  @Column({ name: 'is_interstate', type: 'boolean', default: false })
  isInterstate!: boolean;

  @Column({ name: 'issued_by_user_id', type: 'uuid' })
  issuedByUserId!: string;

  @Column({ name: 'reason', type: 'varchar', length: 255 })
  reason!: string;

  @Column({ name: 'subtotal', type: 'numeric', precision: 14, scale: 2 })
  subtotal!: string;

  @Column({ name: 'taxable_total', type: 'numeric', precision: 14, scale: 2 })
  taxableTotal!: string;

  @Column({ name: 'cgst_total', type: 'numeric', precision: 14, scale: 2, default: 0 })
  cgstTotal!: string;

  @Column({ name: 'sgst_total', type: 'numeric', precision: 14, scale: 2, default: 0 })
  sgstTotal!: string;

  @Column({ name: 'igst_total', type: 'numeric', precision: 14, scale: 2, default: 0 })
  igstTotal!: string;

  @Column({ name: 'grand_total', type: 'numeric', precision: 14, scale: 2 })
  grandTotal!: string;

  @Column({ name: 'rounding_adjustment', type: 'numeric', precision: 6, scale: 2, default: 0 })
  roundingAdjustment!: string;

  @Column({ name: 'refund_payment_method', type: 'varchar', length: 32 })
  refundPaymentMethod!: string;

  @Column({ name: 'refund_reference', type: 'varchar', length: 128, nullable: true })
  refundReference!: string | null;

  @Column({ name: 'status', type: 'varchar', length: 32, default: 'issued' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => InvoiceEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'original_invoice_id' })
  originalInvoice?: InvoiceEntity;

  @OneToMany(() => CreditNoteLineEntity, (line) => line.creditNote, { cascade: true })
  lines!: CreditNoteLineEntity[];
}
