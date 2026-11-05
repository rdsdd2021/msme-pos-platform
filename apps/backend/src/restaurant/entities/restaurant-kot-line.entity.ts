import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { KotStatus, KitchenStation } from '@pos/shared-types';
import { RestaurantKotEntity } from './restaurant-kot.entity';
import { RestaurantOrderEntity } from './restaurant-order.entity';

@Entity('restaurant_kot_lines')
@Index(['tenantId', 'kotId'])
@Index(['tenantId', 'orderId'])
export class RestaurantKotLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'kot_id', type: 'uuid' })
  kotId!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'product_name_snapshot', type: 'varchar', length: 255 })
  productNameSnapshot!: string;

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  quantity!: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 14, scale: 2 })
  unitPrice!: string;

  @Column({ name: 'line_total', type: 'numeric', precision: 14, scale: 2 })
  lineTotal!: string;

  @Column({
    name: 'kitchen_station',
    type: 'varchar',
    length: 64,
    default: KitchenStation.MAIN_KITCHEN,
  })
  kitchenStation!: KitchenStation;

  @Column({ name: 'special_instructions', type: 'varchar', length: 255, nullable: true })
  specialInstructions!: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: KotStatus.PENDING,
  })
  status!: KotStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => RestaurantKotEntity, (kot) => kot.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kot_id' })
  kot?: RestaurantKotEntity;

  @ManyToOne(() => RestaurantOrderEntity, (order) => order.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: RestaurantOrderEntity;
}
