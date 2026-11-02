import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CatalogService } from './catalog.service';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { PermissionsGuard } from '../tenants/guards/permissions.guard';
import { RequirePermissions } from '../tenants/guards/require-permissions.decorator';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateUnitDto,
  CreateProductDto,
  UpdateProductDto,
  RecordStockMovementDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
  ReceivePurchaseOrderDto,
  CreateStockTransferDto,
  DispatchStockTransferDto,
  ReceiveStockTransferDto,
  CancelStockTransferDto,
} from './dto/catalog.dto';
import { PurchaseOrderStatus } from './entities/purchase-order.entity';
import { Permission, StockTransferStatus, TenantContext } from '@pos/shared-types';

@ApiTags('catalog')
@Controller({ path: 'tenants/:tenantId/catalog', version: '1' })
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // --- Category Endpoints ---

  @Post('categories')
  @RequirePermissions(Permission.CATALOG_CREATE)
  @ApiOperation({ summary: 'Create a new product category' })
  async createCategory(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.catalogService.createCategory(tenantId, dto);
  }

  @Get('categories')
  @RequirePermissions(Permission.CATALOG_READ)
  @ApiOperation({ summary: 'List all categories for tenant' })
  async getCategories(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.catalogService.getCategories(tenantId);
  }

  @Put('categories/:id')
  @RequirePermissions(Permission.CATALOG_UPDATE)
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updateCategory(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalogService.updateCategory(tenantId, id, dto);
  }

  @Delete('categories/:id')
  @RequirePermissions(Permission.CATALOG_DELETE)
  @ApiOperation({ summary: 'Deactivate a category' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async deleteCategory(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalogService.deleteCategory(tenantId, id);
  }

  // --- Unit of Measure Endpoints ---

  @Get('units')
  @RequirePermissions(Permission.CATALOG_READ)
  @ApiOperation({ summary: 'List standard and custom units of measurement' })
  async getUnits(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.catalogService.getUnits(tenantId);
  }

  @Post('units')
  @RequirePermissions(Permission.CATALOG_CREATE)
  @ApiOperation({ summary: 'Create a new unit of measurement' })
  async createUnit(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateUnitDto,
  ) {
    return this.catalogService.createUnit(tenantId, dto);
  }

  // --- Product & SKU Endpoints ---

  @Post('products')
  @RequirePermissions(Permission.CATALOG_CREATE)
  @ApiOperation({ summary: 'Create a new product with SKU, barcode, HSN, and optional opening stock' })
  async createProduct(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.catalogService.createProduct(tenantId, dto);
  }

  @Get('products')
  @RequirePermissions(Permission.CATALOG_READ)
  @ApiOperation({ summary: 'List all active products' })
  async getProducts(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.catalogService.getProducts(tenantId);
  }

  @Get('products/search')
  @RequirePermissions(Permission.CATALOG_READ)
  @ApiOperation({ summary: 'Search product by primary barcode or SKU' })
  @ApiQuery({ name: 'q', type: 'string' })
  async searchProduct(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('q') query: string,
  ) {
    return this.catalogService.searchProductByBarcodeOrSku(tenantId, query);
  }

  @Get('products/:id')
  @RequirePermissions(Permission.CATALOG_READ)
  @ApiOperation({ summary: 'Get product details by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getProductById(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalogService.getProductById(tenantId, id);
  }

  @Put('products/:id')
  @RequirePermissions(Permission.CATALOG_UPDATE)
  @ApiOperation({ summary: 'Update product information, pricing, or tax details' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updateProduct(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(tenantId, id, dto);
  }

  @Delete('products/:id')
  @RequirePermissions(Permission.CATALOG_DELETE)
  @ApiOperation({ summary: 'Archive/soft-delete a product' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async deleteProduct(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalogService.deleteProduct(tenantId, id);
  }

  // --- Inventory & Stock Endpoints ---

  @Post('stock/movements')
  @RequirePermissions(Permission.STOCK_MOVEMENT_RECORD)
  @ApiOperation({ summary: 'Record an immutable stock ledger movement (opening stock, purchase, adjustment)' })
  async recordStockMovement(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string }; tenantContext: TenantContext },
    @Body() dto: RecordStockMovementDto,
  ) {
    return this.catalogService.recordStockMovement(tenantId, req.user.userId, dto, req.tenantContext);
  }

  @Get('branches/:branchId/low-stock')
  @RequirePermissions(Permission.STOCK_READ)
  @ApiOperation({ summary: 'Get products below low stock threshold for a branch' })
  @ApiParam({ name: 'branchId', type: 'string', format: 'uuid' })
  async getLowStock(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
  ) {
    return this.catalogService.getLowStockProducts(tenantId, branchId);
  }

  @Get('stock-balances')
  @RequirePermissions(Permission.STOCK_READ)
  @ApiOperation({ summary: 'Get stock balances for tenant, optionally filtered by branch' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  async getStockBalances(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.catalogService.getStockBalances(tenantId, branchId);
  }

  // --- Supplier Endpoints ---

  @Post('suppliers')
  @RequirePermissions(Permission.CATALOG_CREATE)
  @ApiOperation({ summary: 'Create a new supplier' })
  async createSupplier(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.catalogService.createSupplier(tenantId, dto);
  }

  @Get('suppliers')
  @RequirePermissions(Permission.CATALOG_READ)
  @ApiOperation({ summary: 'List all active suppliers' })
  async getSuppliers(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.catalogService.getSuppliers(tenantId);
  }

  @Get('suppliers/:id')
  @RequirePermissions(Permission.CATALOG_READ)
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getSupplierById(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalogService.getSupplierById(tenantId, id);
  }

  @Put('suppliers/:id')
  @RequirePermissions(Permission.CATALOG_UPDATE)
  @ApiOperation({ summary: 'Update an existing supplier' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updateSupplier(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.catalogService.updateSupplier(tenantId, id, dto);
  }

  @Delete('suppliers/:id')
  @RequirePermissions(Permission.CATALOG_DELETE)
  @ApiOperation({ summary: 'Archive/soft-delete a supplier' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async deleteSupplier(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalogService.deleteSupplier(tenantId, id);
  }

  // --- Purchase Order & GRN Endpoints ---

  @Post('purchases/orders')
  @RequirePermissions(Permission.STOCK_MOVEMENT_RECORD)
  @ApiOperation({ summary: 'Create a new purchase order with lines' })
  async createPurchaseOrder(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.catalogService.createPurchaseOrder(tenantId, req.user.userId, dto);
  }

  @Get('purchases/orders')
  @RequirePermissions(Permission.STOCK_READ)
  @ApiOperation({ summary: 'List purchase orders' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'supplierId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseOrderStatus })
  async getPurchaseOrders(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId') branchId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: PurchaseOrderStatus,
  ) {
    return this.catalogService.getPurchaseOrders(tenantId, branchId, supplierId, status);
  }

  @Get('purchases/orders/:id')
  @RequirePermissions(Permission.STOCK_READ)
  @ApiOperation({ summary: 'Get purchase order with lines and supplier' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getPurchaseOrderById(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalogService.getPurchaseOrderById(tenantId, id);
  }

  @Patch('purchases/orders/:id/status')
  @RequirePermissions(Permission.STOCK_MOVEMENT_RECORD)
  @ApiOperation({ summary: 'Update purchase order status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updatePurchaseOrderStatus(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
  ) {
    return this.catalogService.updatePurchaseOrderStatus(tenantId, id, dto.status);
  }

  @Post('purchases/orders/:id/receive')
  @RequirePermissions(Permission.STOCK_MOVEMENT_RECORD)
  @ApiOperation({ summary: 'Receive goods against purchase order (GRN inward to stock ledger)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async receiveGoods(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    return this.catalogService.receiveGoods(tenantId, req.user.userId, id, dto);
  }

  // --- Multi-Branch Stock Transfer Endpoints ---

  @Post('transfers')
  @RequirePermissions(Permission.STOCK_TRANSFER)
  @ApiOperation({ summary: 'Create a new inter-branch stock transfer' })
  async createStockTransfer(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string }; tenantContext?: TenantContext },
    @Body() dto: CreateStockTransferDto,
  ) {
    return this.catalogService.createStockTransfer(tenantId, req.user.userId, dto, req.tenantContext);
  }

  @Get('transfers')
  @RequirePermissions(Permission.STOCK_READ)
  @ApiOperation({ summary: 'List inter-branch stock transfers with filters' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'sourceBranchId', required: false })
  @ApiQuery({ name: 'destinationBranchId', required: false })
  @ApiQuery({ name: 'status', enum: StockTransferStatus, required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getStockTransfers(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('branchId') branchId?: string,
    @Query('sourceBranchId') sourceBranchId?: string,
    @Query('destinationBranchId') destinationBranchId?: string,
    @Query('status') status?: StockTransferStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.getStockTransfers(tenantId, {
      branchId,
      sourceBranchId,
      destinationBranchId,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('transfers/:id')
  @RequirePermissions(Permission.STOCK_READ)
  @ApiOperation({ summary: 'Get stock transfer details with lines and product info' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getStockTransferById(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalogService.getStockTransferById(tenantId, id);
  }

  @Post('transfers/:id/dispatch')
  @RequirePermissions(Permission.STOCK_TRANSFER)
  @ApiOperation({ summary: 'Dispatch an inter-branch stock transfer (deducts stock from source branch)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async dispatchStockTransfer(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { userId: string }; tenantContext?: TenantContext },
    @Body() dto: DispatchStockTransferDto,
  ) {
    return this.catalogService.dispatchStockTransfer(tenantId, req.user.userId, id, dto, req.tenantContext);
  }

  @Post('transfers/:id/receive')
  @RequirePermissions(Permission.STOCK_TRANSFER)
  @ApiOperation({ summary: 'Receive and reconcile an inter-branch stock transfer (increments destination branch stock)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async receiveStockTransfer(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { userId: string }; tenantContext?: TenantContext },
    @Body() dto: ReceiveStockTransferDto,
  ) {
    return this.catalogService.receiveStockTransfer(tenantId, req.user.userId, id, dto, req.tenantContext);
  }

  @Post('transfers/:id/cancel')
  @RequirePermissions(Permission.STOCK_TRANSFER)
  @ApiOperation({ summary: 'Cancel a stock transfer (reverses stock movement if already dispatched)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async cancelStockTransfer(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { userId: string }; tenantContext?: TenantContext },
    @Body() dto: CancelStockTransferDto,
  ) {
    return this.catalogService.cancelStockTransfer(tenantId, req.user.userId, id, dto, req.tenantContext);
  }
}
