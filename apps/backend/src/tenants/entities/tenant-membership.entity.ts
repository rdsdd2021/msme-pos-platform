import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MembershipStatus, Role } from '@pos/shared-types';
import { TenantEntity } from './tenant.entity';
import { UserEntity } from './user.entity';
import { BranchEntity } from './branch.entity';

@Entity('tenant_memberships')
@Index(['tenantId', 'userId', 'branchId'], { unique: true })
@Index(['tenantId', 'branchId'])
export class TenantMembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId!: string | null;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.ACTIVE,
  })
  status!: MembershipStatus;

  @Column({ name: 'role', type: 'varchar', length: 64, default: Role.CASHIER })
  role!: Role | string;

  @Column({ name: 'roles', type: 'text', array: true, default: [Role.CASHIER] })
  roles!: Role[];

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @ManyToOne(() => UserEntity, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => BranchEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branch_id' })
  branch?: BranchEntity | null;
}


