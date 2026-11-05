import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockTransferStatus } from '@pos/shared-types';
import { BranchEntity } from '../../tenants/entities/branch.entity';
import { StockTransferLineEntity } from './stock-transfer-line.entity';

@Entity('stock_transfers')
@Index(['tenantId', 'transferNumber'], { unique: true })
@Index(['tenantId', 'sourceBranchId'])
@Index(['tenantId', 'destinationBranchId'])
@Index(['tenantId', 'status'])
export class StockTransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'transfer_number', type: 'varchar', length: 64 })
  transferNumber!: string;

  @Column({ name: 'source_branch_id', type: 'uuid' })
  sourceBranchId!: string;

  @Column({ name: 'destination_branch_id', type: 'uuid' })
  destinationBranchId!: string;

  @Column({
    type: 'enum',
    enum: StockTransferStatus,
    default: StockTransferStatus.DRAFT,
  })
  status!: StockTransferStatus;

  @Column({ name: 'dispatched_at', type: 'timestamptz', nullable: true })
  dispatchedAt!: Date | null;

  @Column({ name: 'dispatched_by', type: 'uuid', nullable: true })
  dispatchedBy!: string | null;

  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  receivedAt!: Date | null;

  @Column({ name: 'received_by', type: 'uuid', nullable: true })
  receivedBy!: string | null;

  @Column({ name: 'total_items_requested', type: 'numeric', precision: 12, scale: 3, default: 0 })
  totalItemsRequested!: string;

  @Column({ name: 'total_items_dispatched', type: 'numeric', precision: 12, scale: 3, default: 0 })
  totalItemsDispatched!: string;

  @Column({ name: 'total_items_received', type: 'numeric', precision: 12, scale: 3, default: 0 })
  totalItemsReceived!: string;

  @Column({ name: 'has_discrepancy', type: 'boolean', default: false })
  hasDiscrepancy!: boolean;

  @Column({ name: 'discrepancy_reason', type: 'text', nullable: true })
  discrepancyReason!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => BranchEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'source_branch_id' })
  sourceBranch?: BranchEntity;

  @ManyToOne(() => BranchEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destination_branch_id' })
  destinationBranch?: BranchEntity;

  @OneToMany(() => StockTransferLineEntity, (line) => line.stockTransfer, {
    cascade: true,
  })
  lines?: StockTransferLineEntity[];
}
