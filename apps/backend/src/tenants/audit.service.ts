import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';

export interface CreateAuditLogEntry {
  tenantId: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * Persists an immutable audit log record for sensitive operations.
   */
  async log(entry: CreateAuditLogEntry): Promise<AuditLogEntity> {
    try {
      const record = this.auditRepository.create({
        tenantId: entry.tenantId,
        userId: entry.userId ?? null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        details: entry.details ?? null,
        ipAddress: entry.ipAddress ?? null,
      });

      const saved = await this.auditRepository.save(record);
      this.logger.debug(
        `[AUDIT] Action: ${entry.action} on ${entry.resourceType}:${entry.resourceId ?? 'N/A'} by user:${entry.userId ?? 'SYSTEM'}`,
      );
      return saved;
    } catch (err) {
      // In audit logging, record failures should be logged with high priority without masking
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }
  }

  /**
   * Queries audit records for a tenant.
   */
  async getTenantAuditLogs(
    tenantId: string,
    limit: number = 50,
  ): Promise<AuditLogEntity[]> {
    return this.auditRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
    });
  }
}

