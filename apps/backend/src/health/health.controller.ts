import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Application health check' })
  @ApiOkResponse({ type: HealthResponseDto, description: 'Service is healthy' })
  check(): HealthResponseDto {
    return this.healthService.check();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness check - includes database connectivity' })
  @ApiOkResponse({ type: HealthResponseDto, description: 'Service is ready' })
  async ready(): Promise<HealthResponseDto> {
    return this.healthService.readiness();
  }
}
