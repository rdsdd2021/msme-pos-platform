import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsString,
  IsNotEmpty,
  IsInt,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SyncOperationItemDto {
  @ApiProperty({ example: 'uuid-operation-id' })
  @IsUUID()
  operationId!: string;

  @ApiProperty({ example: 'uuid-device-id' })
  @IsUUID()
  deviceId!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  sequence!: number;

  @ApiProperty({ example: 'CREATE_SALE' })
  @IsString()
  @IsNotEmpty()
  operationType!: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  schemaVersion!: number;

  @ApiProperty({ example: '2026-10-31T11:55:00.000Z' })
  @IsString()
  occurredAt!: string;

  @ApiProperty()
  @IsObject()
  payload!: Record<string, unknown>;
}

export class PushSyncBatchDto {
  @ApiProperty({ example: 'uuid-device-id' })
  @IsUUID()
  deviceId!: string;

  @ApiProperty({ type: [SyncOperationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationItemDto)
  operations!: SyncOperationItemDto[];
}

export class AllocateInvoiceRangeDto {
  @ApiProperty({ example: 'uuid-branch-id' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: 'uuid-device-id' })
  @IsUUID()
  deviceId!: string;

  @ApiProperty({ example: 50, default: 50 })
  @IsInt()
  @Min(10)
  rangeSize!: number;
}

