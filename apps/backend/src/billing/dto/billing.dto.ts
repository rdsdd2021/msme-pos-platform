import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  Matches,
  ArrayMinSize,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@pos/shared-types';

export class CartLineItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '2.000' })
  @IsString()
  @Matches(/^\d+(\.\d{1,3})?$/, { message: 'quantity must be a valid positive quantity string' })
  quantity!: string;

  @ApiProperty({ example: '0.00', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'discountAmount must be a valid decimal string' })
  discountAmount?: string;

  @ApiProperty({ example: '5.00', description: 'GST rate percentage (e.g. 0, 5, 12, 18, 28)' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'gstRatePercent must be a valid percentage string' })
  gstRatePercent!: string;
}

export class PaymentSplitDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({ example: '200.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'amount must be a valid decimal string' })
  amount!: string;

  @ApiProperty({ example: 'UPI-TXN-98765', required: false })
  @IsString()
  @IsOptional()
  externalReference?: string;
}

export class CreateSaleDto {
  @ApiProperty({ example: 'uuid-of-branch' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: 'uuid-idempotency-key' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @ApiProperty({
    example: false,
    default: false,
    description: 'True for IGST interstate sale, false for intra-state CGST+SGST',
  })
  @IsBoolean()
  @IsOptional()
  isInterstate?: boolean;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    required: false,
    example: '27AAAAA0000A1Z5',
    description: 'Customer GSTIN for B2B tax invoice',
  })
  @IsString()
  @IsOptional()
  customerGstin?: string;

  @ApiProperty({
    required: false,
    example: '27',
    description: '2-digit state code for Place of Supply',
  })
  @IsString()
  @IsOptional()
  placeOfSupply?: string;

  @ApiProperty({ type: [CartLineItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartLineItemDto)
  items!: CartLineItemDto[];

  @ApiProperty({ type: [PaymentSplitDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentSplitDto)
  payments!: PaymentSplitDto[];
}
