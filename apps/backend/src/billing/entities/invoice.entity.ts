import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { InvoiceStatus, PaymentStatus } from '@pos/shared-types';
import { InvoiceLineEntity } from './invoice-line.entity';

@Entity('invoices')
@Index(['tenantId', 'branchId', 'invoiceNumber'], { unique: true })
@Index(['tenantId', 'idempotencyKey'], { unique: true })
@Index(['tenantId', 'createdAt'])
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'invoice_number', type: 'varchar', length: 64 })
  invoiceNumber!: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 128 })
  idempotencyKey!: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.POSTED,
  })
  status!: InvoiceStatus;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Column({ name: 'cashier_user_id', type: 'uuid', nullable: true })
  cashierUserId!: string | null;

  @Column({ name: 'currency', type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ name: 'subtotal', type: 'numeric', precision: 14, scale: 2 })
  subtotal!: string;

  @Column({ name: 'discount_total', type: 'numeric', precision: 14, scale: 2, default: 0 })
  discountTotal!: string;

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

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PAID,
  })
  paymentStatus!: PaymentStatus;

  @Column({ name: 'is_interstate', type: 'boolean', default: false })
  isInterstate!: boolean;

  @Column({ name: 'branch_snapshot', type: 'jsonb', nullable: true })
  branchSnapshot!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'posted_at', type: 'timestamptz', default: () => 'now()' })
  postedAt!: Date;

  @OneToMany(() => InvoiceLineEntity, (line) => line.invoice, { cascade: true })
  lines!: InvoiceLineEntity[];
}

