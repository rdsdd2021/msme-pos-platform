import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SubscriptionPlanCode, SubscriptionStatus } from '@pos/shared-types';

@Entity('tenant_subscriptions')
@Index(['tenantId', 'status'])
export class TenantSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid', unique: true })
  tenantId!: string;

  @Column({
    name: 'plan_code',
    type: 'enum',
    enum: SubscriptionPlanCode,
    default: SubscriptionPlanCode.BASIC_KIRANA,
  })
  planCode!: SubscriptionPlanCode;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  status!: SubscriptionStatus;

  @Column({ name: 'max_branches', type: 'integer', default: 1 })
  maxBranches!: number;

  @Column({ name: 'max_devices', type: 'integer', default: 2 })
  maxDevices!: number;

  @Column({ name: 'max_users', type: 'integer', default: 5 })
  maxUsers!: number;

  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  trialEndsAt!: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
