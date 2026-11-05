import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GstReportQueryDto {
  @ApiProperty({ required: false, example: '2026-10-01', description: 'Start date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  from?: string;

  @ApiProperty({ required: false, example: '2026-10-31', description: 'End date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  to?: string;

  @ApiProperty({ required: false, example: 10, description: 'Month (1-12)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  @IsOptional()
  month?: number;

  @ApiProperty({ required: false, example: 2026, description: 'Year (YYYY)' })
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;

  @ApiProperty({
    required: false,
    description: 'Filter by specific branch UUID. If omitted, consolidates all branches.',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ required: false, enum: ['json', 'csv'], default: 'json' })
  @IsEnum(['json', 'csv'])
  @IsOptional()
  format?: 'json' | 'csv';
}

export class CreateSupplierInvoiceLineDto {
  @ApiProperty({ required: false, example: 'uuid-of-product' })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiProperty({ example: 'Fortune Sunlite Sunflower Oil 1L' })
  @IsString()
  description!: string;

  @ApiProperty({ required: false, example: '1512' })
  @IsString()
  @IsOptional()
  hsnCode?: string;

  @ApiProperty({ example: '10.000' })
  @IsString()
  @Matches(/^\d+(\.\d{1,3})?$/, { message: 'quantity must be a positive decimal string' })
  quantity!: string;

  @ApiProperty({ example: '110.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'unitCost must be a positive decimal string' })
  unitCost!: string;

  @ApiProperty({ example: '5.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'gstRatePercent must be a valid percentage string' })
  gstRatePercent!: string;
}

export class CreateSupplierInvoiceDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: 'uuid-of-supplier' })
  @IsUUID()
  supplierId!: string;

  @ApiProperty({ required: false, example: 'uuid-of-po' })
  @IsUUID()
  @IsOptional()
  purchaseOrderId?: string;

  @ApiProperty({ example: 'INV-VEN-2026-9812' })
  @IsString()
  supplierInvoiceNumber!: string;

  @ApiProperty({ example: '2026-10-15T00:00:00.000Z' })
  @IsString()
  supplierInvoiceDate!: string;

  @ApiProperty({
    default: true,
    description: 'True if eligible for Input Tax Credit (ITC) under Section 16(2)',
  })
  @IsBoolean()
  @IsOptional()
  isItcEligible?: boolean;

  @ApiProperty({ required: false, example: 'Section 17(5) motor vehicles or personal consumption' })
  @IsString()
  @IsOptional()
  ineligibilityReason?: string;

  @ApiProperty({
    default: false,
    description: 'True if supply is liable to reverse charge under Section 9(3)/9(4)',
  })
  @IsBoolean()
  @IsOptional()
  isReverseCharge?: boolean;

  @ApiProperty({ required: false, example: '27' })
  @IsString()
  @IsOptional()
  placeOfSupply?: string;

  @ApiProperty({ required: false, example: 'Monthly supply of cooking oils' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateSupplierInvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierInvoiceLineDto)
  items!: CreateSupplierInvoiceLineDto[];
}
