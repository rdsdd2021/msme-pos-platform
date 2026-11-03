import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { KotStatus, KitchenStation } from '@pos/shared-types';
import { RestaurantOrderEntity } from './restaurant-order.entity';
import { RestaurantKotLineEntity } from './restaurant-kot-line.entity';

@Entity('restaurant_kots')
@Index(['tenantId', 'branchId', 'status'])
@Index(['tenantId', 'orderId'])
export class RestaurantKotEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'kot_number', type: 'varchar', length: 64 })
  kotNumber!: string;

  @Column({ name: 'table_number', type: 'varchar', length: 32 })
  tableNumber!: string;

  @Column({
    name: 'kitchen_station',
    type: 'varchar',
    length: 64,
    default: KitchenStation.MAIN_KITCHEN,
  })
  kitchenStation!: KitchenStation;

  @Column({
    type: 'varchar',
    length: 32,
    default: KotStatus.PENDING,
  })
  status!: KotStatus;

  @Column({ name: 'captain_name', type: 'varchar', length: 255, nullable: true })
  captainName!: string | null;

  @CreateDateColumn({ name: 'dispatched_at', type: 'timestamptz' })
  dispatchedAt!: Date;

  @Column({ name: 'ready_at', type: 'timestamptz', nullable: true })
  readyAt!: Date | null;

  @Column({ name: 'served_at', type: 'timestamptz', nullable: true })
  servedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => RestaurantOrderEntity, (order) => order.kots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: RestaurantOrderEntity;

  @OneToMany(() => RestaurantKotLineEntity, (line) => line.kot, { cascade: true })
  lines?: RestaurantKotLineEntity[];
}

