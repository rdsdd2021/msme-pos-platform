import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessType } from '@pos/shared-types';

export class CreateTenantDto {
  @ApiProperty({ example: 'Kirana Store Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  legalName!: string;

  @ApiProperty({ example: 'Gupta General Store' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName!: string;

  @ApiProperty({ enum: BusinessType, example: BusinessType.GROCERY })
  @IsEnum(BusinessType)
  businessType!: BusinessType;

  @ApiProperty({ example: 'Asia/Kolkata', required: false })
  @IsString()
  @IsOptional()
  defaultTimezone?: string;
}

export class CreateBranchDto {
  @ApiProperty({ example: 'MAIN' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Main Branch' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: '123 Market Street', required: false })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiProperty({ example: 'Kolkata', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'WB', required: false })
  @IsString()
  @IsOptional()
  stateCode?: string;

  @ApiProperty({ example: '700001', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;
}

