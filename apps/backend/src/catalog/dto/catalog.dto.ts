import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  Max,
  Matches,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType, StockMovementType } from '@pos/shared-types';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries & Staples' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'CAT-GROC' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ example: 0, required: false })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Groceries & Staples', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'CAT-GROC', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ example: 0, required: false })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateUnitDto {
  @ApiProperty({ example: 'Kilogram' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'KG' })
  @IsString()
  @IsNotEmpty()
  symbol!: string;

  @ApiProperty({ example: 3, default: 0 })
  @IsInt()
  @Min(0)
  @Max(3)
  @IsOptional()
  decimalPlaces?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Aashirvaad Shudh Chakki Atta 5kg' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'GROC-001' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty({ example: '890103000001', required: false })
  @IsString()
  @IsOptional()
  barcodePrimary?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  baseUnitId?: string;

  @ApiProperty({ example: '210.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'purchaseCost must be a valid decimal string' })
  purchaseCost!: string;

  @ApiProperty({ example: '240.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'sellingPrice must be a valid decimal string' })
  sellingPrice!: string;

  @ApiProperty({ example: '250.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'mrp must be a valid decimal string' })
  mrp!: string;

  @ApiProperty({ example: '11010000', required: false })
  @IsString()
  @IsOptional()
  hsnCode?: string;

  @ApiProperty({ example: '5.00', default: '0.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'gstRatePercent must be a valid percentage decimal string',
  })
  @IsOptional()
  gstRatePercent?: string;

  @ApiProperty({ example: '5 kg', required: false })
  @IsString()
  @IsOptional()
  packageSize?: string;

  @ApiProperty({
    example: 'data:image/jpeg;base64,...',
    required: false,
    description: 'Product image URL or data URI',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ enum: ProductType, default: ProductType.STOCK })
  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  allowFractionalQuantity?: boolean;

  @ApiProperty({
    example: '50.000',
    required: false,
    description: 'Optional initial opening stock to record on creation',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,3})?$/, {
    message: 'openingStockQuantity must be a valid positive decimal quantity string',
  })
  @IsOptional()
  openingStockQuantity?: string;

  @ApiProperty({
    example: 'uuid-of-branch',
    required: false,
    description: 'Target branch for opening stock',
  })
  @IsUUID()
  @IsOptional()
  openingStockBranchId?: string;
}

export class UpdateProductDto {
  @ApiProperty({ example: 'Aashirvaad Shudh Chakki Atta 5kg', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'GROC-001', required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ example: '890103000001', required: false })
  @IsString()
  @IsOptional()
  barcodePrimary?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  baseUnitId?: string;

  @ApiProperty({ example: '210.00', required: false })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'purchaseCost must be a valid decimal string' })
  @IsOptional()
  purchaseCost?: string;

  @ApiProperty({ example: '240.00', required: false })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'sellingPrice must be a valid decimal string' })
  @IsOptional()
  sellingPrice?: string;

  @ApiProperty({ example: '250.00', required: false })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'mrp must be a valid decimal string' })
  @IsOptional()
  mrp?: string;

  @ApiProperty({ example: '11010000', required: false })
  @IsString()
  @IsOptional()
  hsnCode?: string;

  @ApiProperty({ example: '5.00', required: false })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'gstRatePercent must be a valid percentage decimal string',
  })
  @IsOptional()
  gstRatePercent?: string;

  @ApiProperty({ example: '5 kg', required: false })
  @IsString()
  @IsOptional()
  packageSize?: string;

  @ApiProperty({
    example: 'data:image/jpeg;base64,...',
    required: false,
    description: 'Product image URL or data URI',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ enum: ProductType, required: false })
  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  allowFractionalQuantity?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class RecordStockMovementDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ enum: StockMovementType, example: StockMovementType.OPENING })
  @IsEnum(StockMovementType)
  @IsOptional()
  movementType?: StockMovementType;

  @ApiProperty({
    example: '50.000',
    description: 'Positive delta increases stock, negative decreases',
  })
  @IsString()
  @Matches(/^-?\d+(\.\d{1,3})?$/, { message: 'quantityDelta must be a valid decimal string' })
  quantityDelta!: string;

  @ApiProperty({ example: '120.00', required: false })
  @IsString()
  @IsOptional()
  unitCost?: string;

  @ApiProperty({ example: 'purchase_order' })
  @IsString()
  @IsNotEmpty()
  sourceType!: string;

  @ApiProperty({ example: 'po-12345' })
  @IsString()
  @IsNotEmpty()
  sourceId!: string;

  @ApiProperty({ example: 'uuid-v4-idempotency-key' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @ApiProperty({ example: 'Physical stock count discrepancy', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateSupplierDto {
  @ApiProperty({ example: 'Hindustan Unilever Ltd' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Ramesh Sharma', required: false })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiProperty({ example: '+91 98765 43210', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'ramesh@hul-distributor.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '29ABCDE1234F1Z5', required: false })
  @IsString()
  @IsOptional()
  gstin?: string;
}

export class UpdateSupplierDto {
  @ApiProperty({ example: 'Hindustan Unilever Ltd', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Ramesh Sharma', required: false })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiProperty({ example: '+91 98765 43210', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'ramesh@hul-distributor.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '29ABCDE1234F1Z5', required: false })
  @IsString()
  @IsOptional()
  gstin?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreatePurchaseOrderLineDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '50.000' })
  @IsString()
  @Matches(/^\d+(\.\d{1,3})?$/, {
    message: 'quantityOrdered must be a valid positive decimal quantity string',
  })
  quantityOrdered!: string;

  @ApiProperty({ example: '180.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'unitCost must be a valid decimal string' })
  unitCost!: string;

  @ApiProperty({ example: '5.00', required: false })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'taxRatePercent must be a valid percentage decimal string',
  })
  @IsOptional()
  taxRatePercent?: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'branch-uuid' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: 'supplier-uuid' })
  @IsUUID()
  supplierId!: string;

  @ApiProperty({ example: 'PO-20261031-001', required: false })
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @ApiProperty({ example: '2026-11-05T00:00:00Z', required: false })
  @IsString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @ApiProperty({ example: 'Diwali stock replenishment', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreatePurchaseOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderLineDto)
  lines!: CreatePurchaseOrderLineDto[];
}

export class UpdatePurchaseOrderStatusDto {
  @ApiProperty({ enum: PurchaseOrderStatus })
  @IsEnum(PurchaseOrderStatus)
  status!: PurchaseOrderStatus;
}

export class ReceivePurchaseOrderItemDto {
  @ApiProperty({ example: 'po-line-uuid' })
  @IsUUID()
  lineId!: string;

  @ApiProperty({ example: '25.000' })
  @IsString()
  @Matches(/^\d+(\.\d{1,3})?$/, {
    message: 'quantityReceived must be a valid positive decimal quantity string',
  })
  quantityReceived!: string;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ type: [ReceivePurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseOrderItemDto)
  items!: ReceivePurchaseOrderItemDto[];

  @ApiProperty({ example: 'grn-idempotency-uuid', required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiProperty({ example: 'First partial delivery received at warehouse', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateStockTransferLineDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '25.000' })
  @IsString()
  @Matches(/^\d+(\.\d{1,3})?$/, {
    message: 'quantityRequested must be a valid positive decimal quantity string',
  })
  quantityRequested!: string;

  @ApiProperty({ example: '180.00', required: false })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'unitCost must be a valid decimal string' })
  @IsOptional()
  unitCost?: string;

  @ApiProperty({ example: 'Batch allocation', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateStockTransferDto {
  @ApiProperty({ example: 'source-branch-uuid' })
  @IsUUID()
  sourceBranchId!: string;

  @ApiProperty({ example: 'dest-branch-uuid' })
  @IsUUID()
  destinationBranchId!: string;

  @ApiProperty({ example: 'TRF-20261101-001', required: false })
  @IsString()
  @IsOptional()
  transferNumber?: string;

  @ApiProperty({ example: 'Inter-branch stock rebalancing', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  autoDispatch?: boolean;

  @ApiProperty({ type: [CreateStockTransferLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockTransferLineDto)
  lines!: CreateStockTransferLineDto[];
}

export class DispatchStockTransferDto {
  @ApiProperty({ example: 'dispatch-idempotency-key', required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiProperty({ example: 'Dispatched via delivery van #4', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReceiveStockTransferItemDto {
  @ApiProperty({ example: 'transfer-line-uuid' })
  @IsUUID()
  lineId!: string;

  @ApiProperty({ example: '25.000' })
  @IsString()
  @Matches(/^\d+(\.\d{1,3})?$/, {
    message: 'quantityReceived must be a valid positive decimal quantity string',
  })
  quantityReceived!: string;

  @ApiProperty({ example: 'Damaged in transit: 2 units leaking', required: false })
  @IsString()
  @IsOptional()
  discrepancyReason?: string;
}

export class ReceiveStockTransferDto {
  @ApiProperty({ type: [ReceiveStockTransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveStockTransferItemDto)
  items!: ReceiveStockTransferItemDto[];

  @ApiProperty({ example: 'receipt-idempotency-key', required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiProperty({ example: 'Received at receiving dock with minor carton damage', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: '2 packages damaged during transit', required: false })
  @IsString()
  @IsOptional()
  discrepancyReason?: string;
}

export class CancelStockTransferDto {
  @ApiProperty({
    example: 'Transfer cancelled by store manager due to demand spike at origin branch',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
