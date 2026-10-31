import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ShiftStatus } from '@pos/shared-types';

@Entity('cashier_shifts')
@Index(['tenantId', 'branchId', 'status'])
export class CashierShiftEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'device_id', type: 'uuid', nullable: true })
  deviceId!: string | null;

  @Column({ name: 'cashier_user_id', type: 'uuid' })
  cashierUserId!: string;

  @Column({
    type: 'enum',
    enum: ShiftStatus,
    default: ShiftStatus.OPEN,
  })
  status!: ShiftStatus;

  @Column({ name: 'opening_cash', type: 'numeric', precision: 14, scale: 2 })
  openingCash!: string;

  @Column({ name: 'closing_cash', type: 'numeric', precision: 14, scale: 2, nullable: true })
  closingCash!: string | null;

  @Column({ name: 'expected_cash', type: 'numeric', precision: 14, scale: 2, nullable: true })
  expectedCash!: string | null;

  @Column({ name: 'variance', type: 'numeric', precision: 14, scale: 2, nullable: true })
  variance!: string | null;

  @CreateDateColumn({ name: 'opened_at', type: 'timestamptz' })
  openedAt!: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;
}

