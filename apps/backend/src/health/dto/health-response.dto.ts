import { ApiProperty } from '@nestjs/swagger';

export enum HealthStatus {
  OK = 'ok',
  ERROR = 'error',
  DEGRADED = 'degraded',
}

export class HealthResponseDto {
  @ApiProperty({ enum: HealthStatus, example: HealthStatus.OK })
  status!: HealthStatus;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '0.1.0' })
  version!: string;

  @ApiProperty({ example: 3600 })
  uptime!: number;

  @ApiProperty({ required: false, example: { database: 'ok' } })
  checks?: Record<string, string>;
}
