import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { CustomerLedgerEntryType } from '@pos/shared-types';

@Entity('customer_ledger')
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'occurredAt'])
export class CustomerLedgerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({
    name: 'entry_type',
    type: 'enum',
    enum: CustomerLedgerEntryType,
  })
  entryType!: CustomerLedgerEntryType;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  debit!: string; // Increases receivable (e.g. credit purchase)

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  credit!: string; // Decreases receivable (e.g. payment received)

  @Column({ name: 'source_type', type: 'varchar', length: 64 })
  sourceType!: string;

  @Column({ name: 'source_id', type: 'varchar', length: 128 })
  sourceId!: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 128, nullable: true })
  idempotencyKey!: string | null;

  @Column({ name: 'payment_method', type: 'varchar', length: 32, nullable: true })
  paymentMethod!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'occurred_at', type: 'timestamptz', default: () => 'now()' })
  occurredAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

