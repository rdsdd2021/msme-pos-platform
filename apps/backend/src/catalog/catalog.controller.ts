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
import { CatalogService } from './catalog.service';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import {
  CreateCategoryDto,
  CreateProductDto,
  RecordStockMovementDto,
} from './dto/catalog.dto';

@ApiTags('catalog')
@Controller({ path: 'tenants/:tenantId/catalog', version: '1' })
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth('access-token')
@ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('categories')
  @ApiOperation({ summary: 'Create a new product category' })
  async createCategory(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.catalogService.createCategory(tenantId, dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all categories for tenant' })
  async getCategories(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.catalogService.getCategories(tenantId);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a new product with SKU and pricing' })
  async createProduct(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.catalogService.createProduct(tenantId, dto);
  }

  @Get('products')
  @ApiOperation({ summary: 'List all products' })
  async getProducts(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.catalogService.getProducts(tenantId);
  }

  @Get('products/search')
  @ApiOperation({ summary: 'Search product by primary barcode or SKU' })
  @ApiQuery({ name: 'q', type: 'string' })
  async searchProduct(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('q') query: string,
  ) {
    return this.catalogService.searchProductByBarcodeOrSku(tenantId, query);
  }

  @Post('stock/movements')
  @ApiOperation({ summary: 'Record an immutable stock ledger movement (opening stock, purchase, adjustment)' })
  async recordStockMovement(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: RecordStockMovementDto,
  ) {
    return this.catalogService.recordStockMovement(tenantId, req.user.userId, dto);
  }

  @Get('branches/:branchId/low-stock')
  @ApiOperation({ summary: 'Get products below low stock threshold for a branch' })
  @ApiParam({ name: 'branchId', type: 'string', format: 'uuid' })
  async getLowStock(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
  ) {
    return this.catalogService.getLowStockProducts(tenantId, branchId);
  }
}

