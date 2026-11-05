import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RestaurantService } from './restaurant.service';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { PermissionsGuard } from '../tenants/guards/permissions.guard';
import { RequirePermissions } from '../tenants/guards/require-permissions.decorator';
import {
  CreateTableDto,
  UpdateTableDto,
  CreateRestaurantOrderDto,
  DispatchKotDto,
  UpdateKotLineStatusDto,
  TransferTableDto,
  SettleRestaurantOrderDto,
} from './dto/restaurant.dto';
import { Permission, TenantContext, KitchenStation, AppModule } from '@pos/shared-types';
import { ModuleGuard, RequireModule } from '../auth/guards/module.guard';

@ApiTags('restaurant')
@Controller({ path: 'tenants/:tenantId/restaurant', version: '1' })
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard, ModuleGuard)
@RequireModule(AppModule.RESTAURANT)
@ApiBearerAuth('access-token')
@ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get('tables')
  @RequirePermissions(Permission.RESTAURANT_TABLES_READ)
  @ApiOperation({ summary: 'Get all restaurant tables and active orders for a branch' })
  @ApiQuery({ name: 'branchId', type: 'string', required: true })
  @ApiQuery({ name: 'section', type: 'string', required: false })
  async getTables(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Query('section') section?: string,
  ) {
    return this.restaurantService.getTables(tenantId, branchId, section);
  }

  @Post('tables')
  @RequirePermissions(Permission.RESTAURANT_TABLES_MANAGE)
  @ApiOperation({ summary: 'Create a new dining table' })
  @ApiQuery({ name: 'branchId', type: 'string', required: true })
  async createTable(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: CreateTableDto,
  ) {
    return this.restaurantService.createTable(tenantId, branchId, dto);
  }

  @Post('tables/seed-defaults')
  @RequirePermissions(Permission.RESTAURANT_TABLES_MANAGE)
  @ApiOperation({ summary: 'Seed standard default restaurant tables if branch has none' })
  @ApiQuery({ name: 'branchId', type: 'string', required: true })
  async seedDefaultTables(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
  ) {
    return this.restaurantService.seedDefaultTables(tenantId, branchId);
  }

  @Patch('tables/:tableId')
  @RequirePermissions(Permission.RESTAURANT_TABLES_MANAGE)
  @ApiOperation({ summary: 'Update table properties or status' })
  @ApiQuery({ name: 'branchId', type: 'string', required: true })
  async updateTable(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.restaurantService.updateTable(tenantId, branchId, tableId, dto);
  }

  @Get('orders/:orderId')
  @RequirePermissions(Permission.RESTAURANT_ORDERS_MANAGE)
  @ApiOperation({ summary: 'Get details of an active restaurant dining order' })
  async getOrder(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.restaurantService.getOrder(tenantId, orderId);
  }

  @Post('orders')
  @RequirePermissions(Permission.RESTAURANT_ORDERS_MANAGE)
  @ApiOperation({ summary: 'Open a dining order or seat guests at a table' })
  @ApiQuery({ name: 'branchId', type: 'string', required: true })
  async createOrder(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: CreateRestaurantOrderDto,
    @Request() req: { tenantContext: TenantContext; user?: any },
  ) {
    return this.restaurantService.createOrder(
      tenantId,
      branchId,
      dto,
      req.tenantContext?.userId,
      req.user?.name || req.user?.email,
    );
  }

  @Post('kots/dispatch')
  @RequirePermissions(Permission.RESTAURANT_KOT_DISPATCH)
  @ApiOperation({ summary: 'Fire items to kitchen and generate sequential KOT' })
  @ApiQuery({ name: 'branchId', type: 'string', required: true })
  async dispatchKot(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: DispatchKotDto,
    @Request() req: { user?: any },
  ) {
    return this.restaurantService.dispatchKot(
      tenantId,
      branchId,
      dto,
      req.user?.name || req.user?.email,
    );
  }

  @Get('kds')
  @RequirePermissions(Permission.RESTAURANT_KDS_VIEW)
  @ApiOperation({ summary: 'Get active KOT queue for Kitchen Display Screen (KDS)' })
  @ApiQuery({ name: 'branchId', type: 'string', required: true })
  @ApiQuery({ name: 'station', enum: KitchenStation, required: false })
  async getKdsQueue(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Query('station') station?: KitchenStation,
  ) {
    return this.restaurantService.getKdsQueue(tenantId, branchId, station);
  }

  @Patch('kots/:kotId/status')
  @RequirePermissions(Permission.RESTAURANT_KDS_VIEW)
  @ApiOperation({ summary: 'Update KOT prep status (start cooking, mark ready, served)' })
  @ApiQuery({ name: 'branchId', type: 'string', required: true })
  async updateKotStatus(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('kotId', ParseUUIDPipe) kotId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: UpdateKotLineStatusDto,
  ) {
    return this.restaurantService.updateKotStatus(tenantId, branchId, kotId, dto.status);
  }

  @Post('tables/transfer')
  @RequirePermissions(Permission.RESTAURANT_TABLES_MANAGE)
  @ApiOperation({ summary: 'Transfer active order to another vacant table' })
  @ApiQuery({ name: 'branchId', type: 'string', required: true })
  async transferTable(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: TransferTableDto,
  ) {
    return this.restaurantService.transferTable(tenantId, branchId, dto);
  }

  @Post('orders/settle')
  @RequirePermissions(Permission.BILLING_POS_CREATE)
  @ApiOperation({ summary: 'Settle restaurant order, post invoice to PostgreSQL, and free table' })
  @ApiQuery({ name: 'branchId', type: 'string', required: true })
  async settleOrder(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: SettleRestaurantOrderDto,
    @Request() req: { tenantContext: TenantContext },
  ) {
    return this.restaurantService.settleOrder(
      tenantId,
      branchId,
      req.tenantContext.userId,
      dto,
    );
  }
}

