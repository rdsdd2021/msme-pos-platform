import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Ramesh Patel' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'ramesh@example.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '29ABCDE1234F1Z5', required: false })
  @IsString()
  @IsOptional()
  gstin?: string;

  @ApiProperty({ example: '5000.00', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'creditLimit must be a valid decimal string' })
  creditLimit?: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Bypass duplicate phone warning and force creation',
  })
  @IsBoolean()
  @IsOptional()
  confirmDuplicate?: boolean;
}

export class MergeCustomerDto {
  @ApiProperty({
    example: 'a4ee55c4-3acf-4ad1-9861-87258ec529be',
    description: 'Target customer ID to receive merged records',
  })
  @IsUUID('4')
  @IsNotEmpty()
  targetCustomerId!: string;

  @ApiProperty({
    example: 'Consolidating duplicate profile created with alternate phone formatting',
    description: 'Audit reason for merge',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class UpdateCustomerCreditLimitDto {
  @ApiProperty({ example: '7500.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'creditLimit must be a valid decimal string' })
  creditLimit!: string;

  @ApiProperty({ example: 'Increased limit after timely repayments', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class RecordCustomerPaymentDto {
  @ApiProperty({ example: 'uuid-branch-id' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: '500.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'amount must be a valid decimal string' })
  amount!: string;

  @ApiProperty({
    example: 'cash',
    enum: ['cash', 'upi', 'card', 'bank_transfer'],
    default: 'cash',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ example: 'khata-settlement-101' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CustomerAdjustmentDto {
  @ApiProperty({ example: 'uuid-branch-id' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: 'credit', enum: ['debit', 'credit'] })
  @IsEnum(['debit', 'credit'])
  type!: 'debit' | 'credit';

  @ApiProperty({ example: '50.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'amount must be a valid decimal string' })
  amount!: string;

  @ApiProperty({ example: 'Disputed charge settlement' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: 'adj-uuid-key' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}

export class CustomerStatementQueryDto {
  @ApiProperty({ example: '2026-10-01T00:00:00Z', required: false })
  @IsString()
  @IsOptional()
  from?: string;

  @ApiProperty({ example: '2026-10-31T23:59:59Z', required: false })
  @IsString()
  @IsOptional()
  to?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: 50, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiProperty({ example: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}

export class OpenShiftDto {
  @ApiProperty({ example: 'uuid-branch-id' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: '1000.00', description: 'Opening float cash in drawer' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'openingCash must be a valid decimal string' })
  openingCash!: string;
}

export class CloseShiftDto {
  @ApiProperty({ example: '5420.00', description: 'Physical cash counted at shift end' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'closingCash must be a valid decimal string' })
  closingCash!: string;
}
