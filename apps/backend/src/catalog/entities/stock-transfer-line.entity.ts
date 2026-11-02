import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockTransferEntity } from './stock-transfer.entity';
import { ProductEntity } from './product.entity';

@Entity('stock_transfer_lines')
@Index(['transferId'])
@Index(['productId'])
export class StockTransferLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'transfer_id', type: 'uuid' })
  transferId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'quantity_requested', type: 'numeric', precision: 12, scale: 3 })
  quantityRequested!: string;

  @Column({
    name: 'quantity_dispatched',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
  })
  quantityDispatched!: string;

  @Column({
    name: 'quantity_received',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
  })
  quantityReceived!: string;

  @Column({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 2, default: 0 })
  unitCost!: string;

  @Column({ name: 'has_discrepancy', type: 'boolean', default: false })
  hasDiscrepancy!: boolean;

  @Column({
    name: 'discrepancy_quantity',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
  })
  discrepancyQuantity!: string;

  @Column({ name: 'discrepancy_reason', type: 'text', nullable: true })
  discrepancyReason!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => StockTransferEntity, (st) => st.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transfer_id' })
  stockTransfer?: StockTransferEntity;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductEntity;
}

