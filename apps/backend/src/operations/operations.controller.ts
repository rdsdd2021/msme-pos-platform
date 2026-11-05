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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OperationsService } from './operations.service';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { PermissionsGuard } from '../tenants/guards/permissions.guard';
import { RequirePermissions } from '../tenants/guards/require-permissions.decorator';
import {
  CreateCustomerDto,
  MergeCustomerDto,
  RecordCustomerPaymentDto,
  UpdateCustomerCreditLimitDto,
  CustomerAdjustmentDto,
  CustomerStatementQueryDto,
  OpenShiftDto,
  CloseShiftDto,
} from './dto/operations.dto';
import { Permission, TenantContext } from '@pos/shared-types';

@ApiTags('operations')
@Controller({ path: 'tenants/:tenantId/operations', version: '1' })
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
export class OperationsController {
  constructor(private readonly opsService: OperationsService) {}

  @Post('customers')
  @RequirePermissions(Permission.KHATA_CREATE)
  @ApiOperation({ summary: 'Create a customer record' })
  async createCustomer(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.opsService.createCustomer(tenantId, dto);
  }

  @Get('customers')
  @RequirePermissions(Permission.KHATA_READ)
  @ApiOperation({ summary: 'List customers for tenant' })
  async getCustomers(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.opsService.getCustomers(tenantId);
  }

  @Get('customers/search')
  @RequirePermissions(Permission.KHATA_READ)
  @ApiOperation({ summary: 'Search customers by name, phone, or customer ID' })
  @ApiQuery({ name: 'q', type: 'string', required: false })
  async searchCustomers(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('q') query?: string,
  ) {
    return this.opsService.searchCustomers(tenantId, query || '');
  }

  @Get('customers/:customerId/history')
  @RequirePermissions(Permission.KHATA_READ)
  @ApiOperation({ summary: 'Get lifetime purchase, invoice, and repayment history for customer' })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  async getCustomerHistory(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.opsService.getCustomerHistory(tenantId, customerId);
  }

  @Post('customers/:customerId/merge')
  @RequirePermissions(Permission.KHATA_LIMIT_MANAGE)
  @ApiOperation({
    summary: 'Merge source customer records and ledger atomically into target customer',
  })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  async mergeCustomers(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: MergeCustomerDto,
  ) {
    return this.opsService.mergeCustomers(tenantId, req.user?.userId, customerId, dto);
  }

  @Post('customers/cleanup-dev-test-data')
  @RequirePermissions(Permission.KHATA_LIMIT_MANAGE)
  @ApiOperation({
    summary: 'Clean non-financial development test customer records (strictly non-production)',
  })
  async cleanupDevTestCustomers(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string } },
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Development test data cleanup is disabled in production environments',
      );
    }
    return this.opsService.cleanupDevTestCustomers(tenantId, req.user?.userId);
  }

  @Get('customers/:customerId/ledger')
  @RequirePermissions(Permission.KHATA_READ)
  @ApiOperation({ summary: 'Get Khata credit ledger entries for customer' })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  async getCustomerLedger(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.opsService.getCustomerLedger(tenantId, customerId);
  }

  @Patch('customers/:customerId/credit-limit')
  @RequirePermissions(Permission.KHATA_LIMIT_MANAGE)
  @ApiOperation({ summary: 'Update customer credit limit with audit logging' })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  async updateCustomerCreditLimit(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateCustomerCreditLimitDto,
  ) {
    return this.opsService.updateCustomerCreditLimit(tenantId, req.user?.userId, customerId, dto);
  }

  @Post('customers/:customerId/payments')
  @RequirePermissions(Permission.KHATA_PAYMENT_RECORD)
  @ApiOperation({ summary: 'Record Khata debt repayment from customer' })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  async recordPayment(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: RecordCustomerPaymentDto,
  ) {
    return this.opsService.recordCustomerPayment(tenantId, req.user?.userId, customerId, dto);
  }

  @Post('customers/:customerId/adjustments')
  @RequirePermissions(Permission.KHATA_LIMIT_MANAGE)
  @ApiOperation({ summary: 'Record manual credit or debit adjustment on customer Khata' })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  async recordCustomerAdjustment(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: CustomerAdjustmentDto,
  ) {
    return this.opsService.recordCustomerAdjustment(tenantId, req.user?.userId, customerId, dto);
  }

  @Get('customers/:customerId/statement')
  @RequirePermissions(Permission.KHATA_READ)
  @ApiOperation({
    summary: 'Get detailed customer statement with running balance and ageing analysis',
  })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  async getCustomerStatement(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query() query: CustomerStatementQueryDto,
  ) {
    return this.opsService.getCustomerStatement(tenantId, customerId, query);
  }

  @Post('shifts/open')
  @RequirePermissions(Permission.SHIFT_OPEN)
  @ApiOperation({ summary: 'Open a cashier shift with opening cash float' })
  async openShift(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string }; tenantContext: TenantContext },
    @Body() dto: OpenShiftDto,
  ) {
    return this.opsService.openShift(tenantId, req.user.userId, dto);
  }

  @Post('shifts/:shiftId/close')
  @RequirePermissions(Permission.SHIFT_CLOSE_SELF)
  @ApiOperation({ summary: 'Close a cashier shift and reconcile counted cash against sales' })
  @ApiParam({ name: 'shiftId', type: 'string', format: 'uuid' })
  async closeShift(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Body() dto: CloseShiftDto,
  ) {
    return this.opsService.closeShift(tenantId, shiftId, dto);
  }

  @Get('shifts')
  @RequirePermissions(Permission.SHIFT_REPORT_READ)
  @ApiOperation({ summary: 'List cashier shifts for tenant / branch' })
  @ApiQuery({ name: 'branchId', type: 'string', required: false })
  async getShifts(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.opsService.getShifts(tenantId, branchId);
  }

  @Get('shifts/current')
  @RequirePermissions(Permission.SHIFT_OPEN)
  @ApiOperation({ summary: 'Get current open shift for authenticated cashier in branch' })
  @ApiQuery({ name: 'branchId', type: 'string', required: false })
  async getCurrentShift(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string } },
    @Query('branchId') branchId?: string,
  ) {
    return this.opsService.getCurrentShift(tenantId, req.user.userId, branchId);
  }

  @Get('reports/daily-sales')
  @RequirePermissions(Permission.REPORTS_DAILY_READ)
  @ApiOperation({ summary: 'Get daily sales, GST tax totals & payment breakdown report' })
  @ApiQuery({ name: 'branchId', type: 'string' })
  @ApiQuery({ name: 'date', type: 'string', example: '2026-10-31' })
  async getDailySalesReport(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Query('date') date: string,
  ) {
    return this.opsService.getDailySalesReport(tenantId, branchId, date);
  }
}
