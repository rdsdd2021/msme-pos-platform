import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CommercialService } from './commercial.service';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { RegisterDeviceDto, RevokeDeviceDto } from './dto/commercial.dto';

@ApiTags('commercial')
@Controller({ path: 'tenants/:tenantId/commercial', version: '1' })
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth('access-token')
@ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
export class CommercialController {
  constructor(private readonly commercialService: CommercialService) {}

  @Post('devices')
  @ApiOperation({ summary: 'Register a new POS terminal device subject to subscription limit' })
  async registerDevice(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.commercialService.registerDevice(tenantId, dto);
  }

  @Post('devices/:deviceId/revoke')
  @ApiOperation({ summary: 'Revoke and deactivate a lost or decommissioned device' })
  @ApiParam({ name: 'deviceId', type: 'string', format: 'uuid' })
  async revokeDevice(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() dto: RevokeDeviceDto,
  ) {
    return this.commercialService.revokeDevice(tenantId, deviceId, dto);
  }

  @Get('devices')
  @ApiOperation({ summary: 'List all registered devices and terminals for tenant' })
  async getDevices(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.commercialService.getDevices(tenantId);
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Get current tenant subscription plan and branch/device entitlements' })
  async getSubscription(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.commercialService.getOrCreateSubscription(tenantId);
  }
}

