import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@pos/shared-types';

export class ReturnLineItemDto {
  @ApiProperty({ description: 'Original invoice line ID being returned', format: 'uuid' })
  @IsUUID()
  invoiceLineId!: string;

  @ApiProperty({
    description: 'Quantity in good, resellable condition returned to stock',
    example: '1.000',
  })
  @IsNotEmpty()
  @IsString()
  resellableQuantity!: string;

  @ApiProperty({
    description: 'Quantity damaged/expired not added back to salable stock',
    example: '0.000',
  })
  @IsNotEmpty()
  @IsString()
  damagedQuantity!: string;

  @ApiPropertyOptional({
    description: 'Specific line return reason',
    example: 'Customer ordered wrong variant',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateSalesReturnDto {
  @ApiProperty({
    description: 'Original invoice UUID against which return is processed',
    format: 'uuid',
  })
  @IsUUID()
  originalInvoiceId!: string;

  @ApiProperty({
    description: 'Client-generated idempotency key to prevent double returns',
    example: 'ret-uuid-1234',
  })
  @IsNotEmpty()
  @IsString()
  idempotencyKey!: string;

  @ApiProperty({ description: 'Overall return reason', example: 'Customer exchange / return' })
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Tender used to refund customer',
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  refundPaymentMethod!: PaymentMethod;

  @ApiPropertyOptional({
    description: 'External refund reference (e.g. UPI txn ID, card refund ARN)',
    example: 'UPI-REF-9988',
  })
  @IsOptional()
  @IsString()
  refundReference?: string;

  @ApiProperty({
    type: [ReturnLineItemDto],
    description: 'List of items and quantities being returned',
  })
  @ValidateNested({ each: true })
  @Type(() => ReturnLineItemDto)
  @ArrayMinSize(1)
  items!: ReturnLineItemDto[];
}

export class CreditNoteQueryDto {
  @ApiPropertyOptional({ description: 'Filter by branch ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by original invoice ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  originalInvoiceId?: string;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size limit', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
