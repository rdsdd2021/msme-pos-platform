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
import { GstReportingService } from './gst-reporting.service';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { PermissionsGuard } from '../tenants/guards/permissions.guard';
import { RequirePermissions } from '../tenants/guards/require-permissions.decorator';
import { CreateSaleDto } from './dto/billing.dto';
import { GstReportQueryDto, CreateSupplierInvoiceDto } from './dto/gst-reports.dto';
import { CreateSalesReturnDto, CreditNoteQueryDto } from './dto/returns.dto';
import { Permission, TenantContext } from '@pos/shared-types';

@ApiTags('billing')
@Controller({ path: 'tenants/:tenantId/billing', version: '1' })
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly gstReportingService: GstReportingService,
  ) {}

  @Post('sales')
  @RequirePermissions(Permission.BILLING_POS_CREATE)
  @ApiOperation({ summary: 'Process POS sale, calculate GST, deduct stock & post invoice' })
  async createSale(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string }; tenantContext: TenantContext },
    @Body() dto: CreateSaleDto,
  ) {
    return this.billingService.createSale(tenantId, req.user.userId, dto);
  }

  @Get('invoices')
  @RequirePermissions(Permission.BILLING_INVOICE_READ)
  @ApiOperation({ summary: 'List posted invoices for tenant' })
  @ApiQuery({ name: 'branchId', type: 'string', required: false })
  async getInvoices(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.billingService.getInvoices(tenantId, branchId);
  }

  @Get('invoices/:invoiceId')
  @RequirePermissions(Permission.BILLING_INVOICE_READ)
  @ApiOperation({ summary: 'Get invoice details with line items' })
  @ApiParam({ name: 'invoiceId', type: 'string', format: 'uuid' })
  async getInvoice(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.billingService.getInvoiceById(tenantId, invoiceId);
  }

  // --- SALES RETURNS & CREDIT NOTES ---

  @Post('returns')
  @RequirePermissions(Permission.BILLING_INVOICE_RETURN)
  @ApiOperation({ summary: 'Process sales return, issue credit note, restore inventory & refund' })
  async createReturn(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string }; tenantContext: TenantContext },
    @Body() dto: CreateSalesReturnDto,
  ) {
    return this.billingService.createReturn(tenantId, req.user.userId, dto);
  }

  @Get('credit-notes')
  @RequirePermissions(Permission.BILLING_INVOICE_READ)
  @ApiOperation({ summary: 'List statutory credit notes for tenant' })
  async getCreditNotes(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: CreditNoteQueryDto,
  ) {
    return this.billingService.getCreditNotes(tenantId, query);
  }

  @Get('credit-notes/:creditNoteId')
  @RequirePermissions(Permission.BILLING_INVOICE_READ)
  @ApiOperation({ summary: 'Get credit note details with line items and refund breakdown' })
  @ApiParam({ name: 'creditNoteId', type: 'string', format: 'uuid' })
  async getCreditNote(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('creditNoteId', ParseUUIDPipe) creditNoteId: string,
  ) {
    return this.billingService.getCreditNoteById(tenantId, creditNoteId);
  }

  // --- SUB-PHASE 3D: GST REPORTING & GSTR-1 / GSTR-3B PREPARATION ---

  @Get('reports/gst/gstr-1')
  @RequirePermissions(Permission.REPORTS_GST_EXPORT)
  @ApiOperation({ summary: 'Prepare statutory GSTR-1 outward supplies return summary and tables' })
  async getGstr1Report(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: GstReportQueryDto,
  ) {
    return this.gstReportingService.getGstr1Report(tenantId, query);
  }

  @Get('reports/gst/gstr-3b')
  @RequirePermissions(Permission.REPORTS_GST_EXPORT)
  @ApiOperation({
    summary: 'Prepare statutory GSTR-3B summary return with ITC and net tax liability',
  })
  async getGstr3bReport(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: GstReportQueryDto,
  ) {
    return this.gstReportingService.getGstr3bReport(tenantId, query);
  }

  @Get('reports/gst/sales-register')
  @RequirePermissions(Permission.REPORTS_FINANCIAL_READ)
  @ApiOperation({ summary: 'Invoice-by-invoice sales and tax register' })
  async getSalesRegister(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: GstReportQueryDto,
  ) {
    return this.gstReportingService.getSalesRegister(tenantId, query);
  }

  // --- SUB-PHASE 3D: PURCHASE GST & INPUT TAX CREDIT (ITC) VENDOR INVOICES ---

  @Post('supplier-invoices')
  @RequirePermissions(Permission.STOCK_MOVEMENT_RECORD)
  @ApiOperation({
    summary: 'Record vendor tax invoice with line items for statutory ITC verification',
  })
  async recordSupplierInvoice(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateSupplierInvoiceDto,
  ) {
    return this.gstReportingService.recordSupplierInvoice(tenantId, req.user.userId, dto);
  }

  @Get('supplier-invoices')
  @RequirePermissions(Permission.STOCK_READ)
  @ApiOperation({ summary: 'List recorded vendor tax invoices with ITC eligibility status' })
  @ApiQuery({ name: 'branchId', type: 'string', required: false })
  async getSupplierInvoices(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.gstReportingService.getSupplierInvoices(tenantId, branchId);
  }
}
