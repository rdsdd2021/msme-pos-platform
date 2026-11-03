import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TableStatus } from '@pos/shared-types';

@Entity('restaurant_tables')
@Index(['tenantId', 'branchId'])
@Index(['tenantId', 'status'])
export class RestaurantTableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'table_number', type: 'varchar', length: 32 })
  tableNumber!: string;

  @Column({ name: 'table_name', type: 'varchar', length: 128, nullable: true })
  tableName!: string | null;

  @Column({ name: 'section', type: 'varchar', length: 64, default: 'Main Dining' })
  section!: string;

  @Column({ name: 'seating_capacity', type: 'int', default: 4 })
  seatingCapacity!: number;

  @Column({
    type: 'varchar',
    length: 32,
    default: TableStatus.VACANT,
  })
  status!: TableStatus;

  @Column({ name: 'current_guest_count', type: 'int', default: 0 })
  currentGuestCount!: number;

  @Column({ name: 'occupied_at', type: 'timestamptz', nullable: true })
  occupiedAt!: Date | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

