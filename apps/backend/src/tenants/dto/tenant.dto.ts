import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MaxLength,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessType, MembershipStatus, Role } from '@pos/shared-types';

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

  @ApiProperty({ example: '27AABCK1234F1Z5', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid 15-character GSTIN format',
  })
  gstin?: string;
}

export class UpdateBranchDto {
  @ApiProperty({ example: 'Main Branch', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ example: '27AABCK1234F1Z5', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid 15-character GSTIN format',
  })
  gstin?: string;

  @ApiProperty({ example: '27', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  stateCode?: string;

  @ApiProperty({ example: '123 Market Street', required: false })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiProperty({ example: 'Suite 400', required: false })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'Mumbai', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: '400001', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AddMemberDto {
  @ApiProperty({ example: 'a4ee55c4-3acf-4ad1-9861-87258ec529be' })
  @IsUUID('4')
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: Role, isArray: true, example: [Role.CASHIER] })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true })
  roles!: Role[];

  @ApiProperty({ example: '2ca7e728-18fc-4b5c-80db-a86309b16b77', required: false, nullable: true })
  @IsUUID('4')
  @IsOptional()
  branchId?: string | null;
}

export class UpdateMemberDto {
  @ApiProperty({ enum: Role, isArray: true, example: [Role.BRANCH_MANAGER], required: false })
  @IsArray()
  @IsOptional()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @ApiProperty({ example: '2ca7e728-18fc-4b5c-80db-a86309b16b77', required: false, nullable: true })
  @IsUUID('4')
  @IsOptional()
  branchId?: string | null;

  @ApiProperty({ enum: MembershipStatus, example: MembershipStatus.ACTIVE, required: false })
  @IsEnum(MembershipStatus)
  @IsOptional()
  status?: MembershipStatus;
}
