import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SyncService } from './sync.service';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { PermissionsGuard } from '../tenants/guards/permissions.guard';
import { RequirePermissions } from '../tenants/guards/require-permissions.decorator';
import { PushSyncBatchDto, AllocateInvoiceRangeDto } from './dto/sync.dto';
import { Permission, TenantContext } from '@pos/shared-types';

@ApiTags('sync')
@Controller({ path: 'tenants/:tenantId/sync', version: '1' })
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @RequirePermissions(Permission.BILLING_POS_CREATE)
  @ApiOperation({ summary: 'Ingest a batch of offline operations from device with idempotency' })
  async pushBatch(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string }; tenantContext: TenantContext },
    @Body() dto: PushSyncBatchDto,
  ) {
    return this.syncService.ingestBatch(tenantId, req.user.userId, dto);
  }

  @Get('pull')
  @RequirePermissions(Permission.CATALOG_READ)
  @ApiOperation({ summary: 'Pull delta updates for catalog & reference data after cursor' })
  @ApiQuery({ name: 'cursor', type: 'string', required: false, description: 'ISO timestamp cursor' })
  async pullDeltas(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.syncService.pullDeltas(tenantId, cursor);
  }

  @Post('invoice-ranges/allocate')
  @RequirePermissions(Permission.BILLING_POS_CREATE)
  @ApiOperation({ summary: 'Reserve an invoice number range for an offline device' })
  async allocateRange(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: AllocateInvoiceRangeDto,
  ) {
    return this.syncService.allocateInvoiceRange(tenantId, dto);
  }
}
