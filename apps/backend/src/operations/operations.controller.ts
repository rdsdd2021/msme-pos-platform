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
import { OperationsService } from './operations.service';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import {
  CreateCustomerDto,
  RecordCustomerPaymentDto,
  OpenShiftDto,
  CloseShiftDto,
} from './dto/operations.dto';

@ApiTags('operations')
@Controller({ path: 'tenants/:tenantId/operations', version: '1' })
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth('access-token')
@ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
export class OperationsController {
  constructor(private readonly opsService: OperationsService) {}

  @Post('customers')
  @ApiOperation({ summary: 'Create a customer record' })
  async createCustomer(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.opsService.createCustomer(tenantId, dto);
  }

  @Get('customers')
  @ApiOperation({ summary: 'List customers for tenant' })
  async getCustomers(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.opsService.getCustomers(tenantId);
  }

  @Get('customers/:customerId/ledger')
  @ApiOperation({ summary: 'Get Khata credit ledger entries for customer' })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  async getCustomerLedger(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.opsService.getCustomerLedger(tenantId, customerId);
  }

  @Post('customers/:customerId/payments')
  @ApiOperation({ summary: 'Record Khata debt repayment from customer' })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  async recordPayment(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: RecordCustomerPaymentDto,
  ) {
    return this.opsService.recordCustomerPayment(tenantId, customerId, dto);
  }

  @Post('shifts/open')
  @ApiOperation({ summary: 'Open a cashier shift with opening cash float' })
  async openShift(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: OpenShiftDto,
  ) {
    return this.opsService.openShift(tenantId, req.user.userId, dto);
  }

  @Post('shifts/:shiftId/close')
  @ApiOperation({ summary: 'Close a cashier shift and reconcile counted cash against sales' })
  @ApiParam({ name: 'shiftId', type: 'string', format: 'uuid' })
  async closeShift(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Body() dto: CloseShiftDto,
  ) {
    return this.opsService.closeShift(tenantId, shiftId, dto);
  }

  @Get('reports/daily-sales')
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

