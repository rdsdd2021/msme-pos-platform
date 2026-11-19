import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FloorSectionConfigDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsNumber()
  defaultCapacity!: number;

  @IsNumber()
  tableCount!: number;
}

export class UpdateRestaurantSettingsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FloorSectionConfigDto)
  floorSections?: FloorSectionConfigDto[];

  @IsOptional()
  @IsString()
  defaultGstPercent?: string; // '5.00' | '18.00'

  @IsOptional()
  @IsString()
  serviceChargePercent?: string; // '0.00' to '10.00'

  @IsOptional()
  @IsString()
  packagingCharge?: string;

  @IsOptional()
  @IsBoolean()
  autoPrintKotOnFire?: boolean;

  @IsOptional()
  @IsBoolean()
  autoPrintBillOnSettle?: boolean;

  @IsOptional()
  @IsString()
  defaultKitchenStation?: string;
}

export interface RestaurantSettingsResponse {
  floorSections: Array<{
    id: string;
    name: string;
    defaultCapacity: number;
    tableCount: number;
  }>;
  defaultGstPercent: string;
  serviceChargePercent: string;
  packagingCharge: string;
  autoPrintKotOnFire: boolean;
  autoPrintBillOnSettle: boolean;
  defaultKitchenStation: string;
}
