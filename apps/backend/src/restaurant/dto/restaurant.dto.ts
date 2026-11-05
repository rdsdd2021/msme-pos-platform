import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  Matches,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  TableStatus,
  RestaurantOrderType,
  KotStatus,
  KitchenStation,
  PaymentMethod,
} from '@pos/shared-types';

export class CreateTableDto {
  @ApiProperty({ example: 'T-01' })
  @IsString()
  @IsNotEmpty()
  tableNumber!: string;

  @ApiProperty({ example: 'Window Table 4', required: false })
  @IsString()
  @IsOptional()
  tableName?: string;

  @ApiProperty({ example: 'Main Dining', required: false })
  @IsString()
  @IsOptional()
  section?: string;

  @ApiProperty({ example: 4, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  seatingCapacity?: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateTableDto {
  @ApiProperty({ example: 'Window Table 4', required: false })
  @IsString()
  @IsOptional()
  tableName?: string;

  @ApiProperty({ example: 'AC Hall', required: false })
  @IsString()
  @IsOptional()
  section?: string;

  @ApiProperty({ example: 6, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  seatingCapacity?: number;

  @ApiProperty({ enum: TableStatus, example: TableStatus.VACANT, required: false })
  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @ApiProperty({ example: 0, required: false })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateRestaurantOrderDto {
  @ApiProperty({ example: 'uuid-of-table', required: false })
  @IsUUID()
  @IsOptional()
  tableId?: string;

  @ApiProperty({ enum: RestaurantOrderType, example: RestaurantOrderType.DINE_IN })
  @IsEnum(RestaurantOrderType)
  @IsOptional()
  orderType?: RestaurantOrderType;

  @ApiProperty({ example: 2, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  guestCount?: number;

  @ApiProperty({ example: 'uuid-of-customer', required: false })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'Less spicy, no peanuts', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class DispatchKotItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '2.000' })
  @IsString()
  @Matches(/^\d+(\.\d{1,3})?$/, { message: 'quantity must be a valid positive quantity string' })
  quantity!: string;

  @ApiProperty({ example: 'Extra crispy, less oil', required: false })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiProperty({ enum: KitchenStation, example: KitchenStation.MAIN_KITCHEN, required: false })
  @IsEnum(KitchenStation)
  @IsOptional()
  kitchenStation?: KitchenStation;
}

export class DispatchKotDto {
  @ApiProperty({ example: 'uuid-of-order' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ type: [DispatchKotItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispatchKotItemDto)
  items!: DispatchKotItemDto[];

  @ApiProperty({ enum: KitchenStation, example: KitchenStation.MAIN_KITCHEN, required: false })
  @IsEnum(KitchenStation)
  @IsOptional()
  kitchenStation?: KitchenStation;
}

export class UpdateKotLineStatusDto {
  @ApiProperty({ enum: KotStatus, example: KotStatus.READY })
  @IsEnum(KotStatus)
  status!: KotStatus;
}

export class TransferTableDto {
  @ApiProperty({ example: 'uuid-of-source-table' })
  @IsUUID()
  sourceTableId!: string;

  @ApiProperty({ example: 'uuid-of-target-table' })
  @IsUUID()
  targetTableId!: string;
}

export class RestaurantSplitPaymentDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({ example: '450.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'amount must be a valid decimal string' })
  amount!: string;

  @ApiProperty({ example: 'UPI-REF-12345', required: false })
  @IsString()
  @IsOptional()
  externalReference?: string;
}

export class SettleRestaurantOrderDto {
  @ApiProperty({ example: 'uuid-of-order' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isSplit?: boolean;

  @ApiProperty({ type: [RestaurantSplitPaymentDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestaurantSplitPaymentDto)
  @IsOptional()
  splitPayments?: RestaurantSplitPaymentDto[];

  @ApiProperty({ example: '1000.00', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'cashTendered must be a valid decimal string' })
  cashTendered?: string;

  @ApiProperty({ example: 'uuid-of-customer', required: false })
  @IsUUID()
  @IsOptional()
  customerId?: string;
}
