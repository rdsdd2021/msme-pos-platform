import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
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

  @ApiProperty({ example: '5000.00', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'creditLimit must be a valid decimal string' })
  creditLimit?: string;
}

export class RecordCustomerPaymentDto {
  @ApiProperty({ example: 'uuid-branch-id' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: '500.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'amount must be a valid decimal string' })
  amount!: string;

  @ApiProperty({ example: 'khata-settlement-101' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
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

