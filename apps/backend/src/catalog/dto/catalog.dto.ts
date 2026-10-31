import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType, StockMovementType } from '@pos/shared-types';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Beverages' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'BEV' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Fortune Sunflower Oil 1L' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'FORT-SUN-1L' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty({ example: '8901234567890', required: false })
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

  @ApiProperty({ example: '120.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'purchaseCost must be a valid decimal string' })
  purchaseCost!: string;

  @ApiProperty({ example: '145.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'sellingPrice must be a valid decimal string' })
  sellingPrice!: string;

  @ApiProperty({ example: '150.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'mrp must be a valid decimal string' })
  mrp!: string;

  @ApiProperty({ enum: ProductType, default: ProductType.STOCK })
  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;
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
  movementType!: StockMovementType;

  @ApiProperty({ example: '50.000', description: 'Positive delta increases stock, negative decreases' })
  @IsString()
  @Matches(/^-?\d+(\.\d{1,3})?$/, { message: 'quantityDelta must be a valid decimal string' })
  quantityDelta!: string;

  @ApiProperty({ example: '120.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'unitCost must be a valid decimal string' })
  unitCost!: string;

  @ApiProperty({ example: 'manual' })
  @IsString()
  sourceType!: string;

  @ApiProperty({ example: 'manual-initial' })
  @IsString()
  sourceId!: string;

  @ApiProperty({ example: 'uuid-idempotency-key' })
  @IsString()
  idempotencyKey!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

