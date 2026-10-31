import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthResponseDto, HealthStatus } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  check(): HealthResponseDto {
    return {
      status: HealthStatus.OK,
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '0.1.0',
      uptime: Math.floor(process.uptime()),
    };
  }

  async readiness(): Promise<HealthResponseDto> {
    const checks: Record<string, string> = {};

    // Database connectivity check
    try {
      await this.dataSource.query('SELECT 1');
      checks['database'] = 'ok';
    } catch (error) {
      this.logger.error('Database health check failed', error);
      checks['database'] = 'error';
      throw new ServiceUnavailableException({
        status: HealthStatus.ERROR,
        timestamp: new Date().toISOString(),
        checks,
        message: 'Database unavailable',
      });
    }

    return {
      status: HealthStatus.OK,
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '0.1.0',
      uptime: Math.floor(process.uptime()),
      checks,
    };
  }
}
