import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Platform } from '@pos/shared-types';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'uuid-branch-id' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: 'POS-ANDROID-A1B2C3' })
  @IsString()
  @IsNotEmpty()
  deviceIdentifier!: string;

  @ApiProperty({ example: 'Counter 1 Tablet' })
  @IsString()
  @IsNotEmpty()
  deviceName!: string;

  @ApiProperty({ enum: Platform, default: Platform.ANDROID })
  @IsEnum(Platform)
  platform!: Platform;

  @ApiProperty({ example: '1.0.0', required: false })
  @IsString()
  @IsOptional()
  appVersion?: string;
}

export class RevokeDeviceDto {
  @ApiProperty({ example: 'Device decommissioned / lost' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
