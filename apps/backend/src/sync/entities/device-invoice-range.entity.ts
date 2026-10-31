import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('device_invoice_ranges')
@Index(['tenantId', 'branchId', 'deviceId'])
export class DeviceInvoiceRangeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  @Column({ name: 'series_prefix', type: 'varchar', length: 32, default: 'INV' })
  seriesPrefix!: string;

  @Column({ name: 'start_number', type: 'integer' })
  startNumber!: number;

  @Column({ name: 'end_number', type: 'integer' })
  endNumber!: number;

  @Column({ name: 'next_number', type: 'integer' })
  nextNumber!: number;

  @Column({ name: 'is_exhausted', type: 'boolean', default: false })
  isExhausted!: boolean;

  @CreateDateColumn({ name: 'allocated_at', type: 'timestamptz' })
  allocatedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

