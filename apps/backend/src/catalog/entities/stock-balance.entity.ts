import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stock_balances')
export class StockBalanceEntity {
  @PrimaryColumn({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @PrimaryColumn({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'quantity_on_hand', type: 'numeric', precision: 12, scale: 3, default: 0 })
  quantityOnHand!: string;

  @Column({ name: 'low_stock_threshold', type: 'numeric', precision: 12, scale: 3, default: 5 })
  lowStockThreshold!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

