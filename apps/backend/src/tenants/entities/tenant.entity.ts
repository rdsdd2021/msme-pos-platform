import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BusinessType, TenantStatus, Currency } from '@pos/shared-types';
import { TenantMembershipEntity } from './tenant-membership.entity';
import { BranchEntity } from './branch.entity';

@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 255 })
  legalName!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName!: string;

  @Column({
    name: 'business_type',
    type: 'enum',
    enum: BusinessType,
    default: BusinessType.GROCERY,
  })
  businessType!: BusinessType;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.TRIAL,
  })
  status!: TenantStatus;

  @Column({
    name: 'default_currency',
    type: 'varchar',
    length: 10,
    default: Currency.INR,
  })
  defaultCurrency!: string;

  @Column({
    name: 'default_timezone',
    type: 'varchar',
    length: 64,
    default: 'Asia/Kolkata',
  })
  defaultTimezone!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => TenantMembershipEntity, (membership) => membership.tenant)
  memberships!: TenantMembershipEntity[];

  @OneToMany(() => BranchEntity, (branch) => branch.tenant)
  branches!: BranchEntity[];
}

