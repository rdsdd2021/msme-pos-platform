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
import { BillingService } from './billing.service';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { CreateSaleDto } from './dto/billing.dto';

@ApiTags('billing')
@Controller({ path: 'tenants/:tenantId/billing', version: '1' })
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth('access-token')
@ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('sales')
  @ApiOperation({ summary: 'Process POS sale, calculate GST, deduct stock & post invoice' })
  async createSale(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateSaleDto,
  ) {
    return this.billingService.createSale(tenantId, req.user.userId, dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List posted invoices for tenant' })
  @ApiQuery({ name: 'branchId', type: 'string', required: false })
  async getInvoices(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.billingService.getInvoices(tenantId, branchId);
  }

  @Get('invoices/:invoiceId')
  @ApiOperation({ summary: 'Get invoice details with line items' })
  @ApiParam({ name: 'invoiceId', type: 'string', format: 'uuid' })
  async getInvoice(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.billingService.getInvoiceById(tenantId, invoiceId);
  }
}

