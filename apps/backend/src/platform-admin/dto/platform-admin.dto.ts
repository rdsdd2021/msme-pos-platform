import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BusinessType,
  TenantStatus,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '@pos/shared-types';

export class CreatePlatformTenantDto {
  @ApiProperty({ example: 'Shree Krishna Retailers' })
  @IsString()
  @IsNotEmpty()
  legalName!: string;

  @ApiProperty({ example: 'Krishna Supermart' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiPropertyOptional({ enum: BusinessType, default: BusinessType.GROCERY })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType = BusinessType.GROCERY;

  @ApiProperty({ example: 'owner@krishna.com' })
  @IsEmail()
  @IsNotEmpty()
  ownerEmail!: string;

  @ApiProperty({ example: 'Gopal Sharma' })
  @IsString()
  @IsNotEmpty()
  ownerName!: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(8)
  ownerPassword!: string;

  @ApiPropertyOptional({ enum: SubscriptionPlanCode, default: SubscriptionPlanCode.BASIC_KIRANA })
  @IsOptional()
  @IsEnum(SubscriptionPlanCode)
  planCode?: SubscriptionPlanCode = SubscriptionPlanCode.BASIC_KIRANA;
}

export class UpdateTenantStatusDto {
  @ApiProperty({ enum: TenantStatus })
  @IsEnum(TenantStatus)
  status!: TenantStatus;
}

export class UpdatePlatformSubscriptionDto {
  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ enum: SubscriptionPlanCode })
  @IsEnum(SubscriptionPlanCode)
  planCode!: SubscriptionPlanCode;

  @ApiProperty({ enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  status!: SubscriptionStatus;

  @ApiProperty({ default: 1 })
  @IsInt()
  @Min(1)
  maxBranches!: number;

  @ApiProperty({ default: 2 })
  @IsInt()
  @Min(1)
  maxDevices!: number;

  @ApiProperty({ default: 5 })
  @IsInt()
  @Min(1)
  maxUsers!: number;
}

export class RevokePlatformDeviceDto {
  @ApiProperty({ example: 'Device decommissioned or stolen' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
