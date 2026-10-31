import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('sync_ingested_operations')
@Index(['tenantId', 'deviceId', 'operationId'], { unique: true })
export class SyncIngestedOperationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  @Column({ name: 'operation_id', type: 'uuid' })
  operationId!: string;

  @Column({ name: 'operation_type', type: 'varchar', length: 64 })
  operationType!: string;

  @Column({ name: 'sequence', type: 'integer' })
  sequence!: number;

  @Column({ name: 'schema_version', type: 'integer', default: 1 })
  schemaVersion!: number;

  @Column({ type: 'varchar', length: 32, default: 'accepted' })
  status!: string;

  @Column({ name: 'server_entity_id', type: 'varchar', length: 128, nullable: true })
  serverEntityId!: string | null;

  @Column({ name: 'error_code', type: 'varchar', length: 64, nullable: true })
  errorCode!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'ingested_at', type: 'timestamptz' })
  ingestedAt!: Date;
}

