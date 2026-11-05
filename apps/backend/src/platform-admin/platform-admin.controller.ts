import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { PlatformAdminService } from './platform-admin.service';
import {
  CreatePlatformTenantDto,
  UpdateTenantStatusDto,
  UpdatePlatformSubscriptionDto,
  RevokePlatformDeviceDto,
} from './dto/platform-admin.dto';

@ApiTags('Platform Super Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('platform-admin')
export class PlatformAdminController {
  constructor(private readonly adminService: PlatformAdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Platform-wide SaaS analytics & operational metrics' })
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('tenants')
  @ApiOperation({ summary: 'List all onboarded tenant businesses on the platform' })
  async getTenants() {
    return this.adminService.getTenants();
  }

  @Post('tenants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Onboard a new tenant organization with store owner and subscription' })
  async createTenant(@Body() dto: CreatePlatformTenantDto, @Req() req: any) {
    const adminUserId = req.user.userId;
    const adminIp = req.ip;
    return this.adminService.createTenant(dto, adminUserId, adminIp);
  }

  @Patch('tenants/:id/status')
  @ApiOperation({ summary: 'Suspend or activate a tenant business' })
  async updateTenantStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantStatusDto,
    @Req() req: any,
  ) {
    const adminUserId = req.user.userId;
    const adminIp = req.ip;
    return this.adminService.updateTenantStatus(id, dto, adminUserId, adminIp);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List all commercial subscription plans and entitlement limits' })
  getPlans() {
    return this.adminService.getPlans();
  }

  @Post('subscriptions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign or modify a tenant subscription tier and limits' })
  async updateSubscription(@Body() dto: UpdatePlatformSubscriptionDto, @Req() req: any) {
    const adminUserId = req.user.userId;
    const adminIp = req.ip;
    return this.adminService.updateSubscription(dto, adminUserId, adminIp);
  }

  @Get('devices')
  @ApiOperation({
    summary: 'Fleet monitor of all registered POS hardware devices across all stores',
  })
  async getDevices() {
    return this.adminService.getDevices();
  }

  @Post('devices/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke compromised or stolen device token immediately' })
  async revokeDevice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokePlatformDeviceDto,
    @Req() req: any,
  ) {
    const adminUserId = req.user.userId;
    const adminIp = req.ip;
    return this.adminService.revokeDevice(id, dto, adminUserId, adminIp);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Platform security and administrative audit trail' })
  async getAuditLogs(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.adminService.getAuditLogs(
      limit ? parseInt(String(limit), 10) : 50,
      offset ? parseInt(String(offset), 10) : 0,
    );
  }
}
