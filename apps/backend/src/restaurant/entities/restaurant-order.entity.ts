import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RestaurantOrderType, RestaurantOrderStatus } from '@pos/shared-types';
import { RestaurantKotEntity } from './restaurant-kot.entity';
import { RestaurantKotLineEntity } from './restaurant-kot-line.entity';

@Entity('restaurant_orders')
@Index(['tenantId', 'branchId', 'status'])
@Index(['tenantId', 'tableId'])
export class RestaurantOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'order_number', type: 'varchar', length: 64 })
  orderNumber!: string;

  @Column({
    name: 'order_type',
    type: 'varchar',
    length: 32,
    default: RestaurantOrderType.DINE_IN,
  })
  orderType!: RestaurantOrderType;

  @Column({ name: 'table_id', type: 'uuid', nullable: true })
  tableId!: string | null;

  @Column({ name: 'table_number_snapshot', type: 'varchar', length: 32, nullable: true })
  tableNumberSnapshot!: string | null;

  @Column({ name: 'section_snapshot', type: 'varchar', length: 64, nullable: true })
  sectionSnapshot!: string | null;

  @Column({ name: 'guest_count', type: 'int', default: 1 })
  guestCount!: number;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Column({ name: 'customer_name_snapshot', type: 'varchar', length: 255, nullable: true })
  customerNameSnapshot!: string | null;

  @Column({ name: 'customer_phone_snapshot', type: 'varchar', length: 32, nullable: true })
  customerPhoneSnapshot!: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: RestaurantOrderStatus.OPEN,
  })
  status!: RestaurantOrderStatus;

  @Column({ name: 'captain_user_id', type: 'uuid', nullable: true })
  captainUserId!: string | null;

  @Column({ name: 'captain_name_snapshot', type: 'varchar', length: 255, nullable: true })
  captainNameSnapshot!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: '0.00' })
  subtotal!: string;

  @Column({ name: 'tax_total', type: 'numeric', precision: 14, scale: 2, default: '0.00' })
  taxTotal!: string;

  @Column({ name: 'discount_total', type: 'numeric', precision: 14, scale: 2, default: '0.00' })
  discountTotal!: string;

  @Column({ name: 'grand_total', type: 'numeric', precision: 14, scale: 2, default: '0.00' })
  grandTotal!: string;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoiceId!: string | null;

  @CreateDateColumn({ name: 'opened_at', type: 'timestamptz' })
  openedAt!: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => RestaurantKotEntity, (kot) => kot.order)
  kots?: RestaurantKotEntity[];

  @OneToMany(() => RestaurantKotLineEntity, (line) => line.order)
  lines?: RestaurantKotLineEntity[];
}

