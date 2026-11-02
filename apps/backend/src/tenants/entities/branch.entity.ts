import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';

@Entity('branches')
@Unique(['tenantId', 'code'])
export class BranchEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 64 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'address_line1', type: 'varchar', length: 255, nullable: true })
  addressLine1!: string | null;

  @Column({ name: 'address_line2', type: 'varchar', length: 255, nullable: true })
  addressLine2!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ name: 'state_code', type: 'varchar', length: 10, nullable: true })
  stateCode!: string | null;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ name: 'gst_registration_id', type: 'uuid', nullable: true })
  gstRegistrationId!: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  gstin!: string | null;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Kolkata' })
  timezone!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.branches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;
}

