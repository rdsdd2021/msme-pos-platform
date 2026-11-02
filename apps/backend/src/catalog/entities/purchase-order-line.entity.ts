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
import { PurchaseOrderEntity } from './purchase-order.entity';
import { ProductEntity } from './product.entity';

@Entity('purchase_order_lines')
@Index(['purchaseOrderId'])
@Index(['productId'])
export class PurchaseOrderLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'purchase_order_id', type: 'uuid' })
  purchaseOrderId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'quantity_ordered', type: 'numeric', precision: 12, scale: 3 })
  quantityOrdered!: string;

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

  @Column({
    name: 'tax_rate_percent',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  taxRatePercent!: string;

  @Column({ name: 'line_total', type: 'numeric', precision: 14, scale: 2, default: 0 })
  lineTotal!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => PurchaseOrderEntity, (po) => po.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder?: PurchaseOrderEntity;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductEntity;
}

