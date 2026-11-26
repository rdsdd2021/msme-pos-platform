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
  @IsBoolean()
  enableGst?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDiningTables?: boolean;

  @IsOptional()
  @IsString()
  defaultGstPercent?: string; // '5.00' | '18.00' | '0.00'

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

  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  storeTagline?: string;

  @IsOptional()
  @IsString()
  storePhone?: string;

  @IsOptional()
  @IsString()
  storeGstin?: string;

  @IsOptional()
  @IsString()
  storeFssai?: string;

  @IsOptional()
  @IsString()
  storeAddress?: string;

  @IsOptional()
  @IsString()
  receiptFooterLine1?: string;

  @IsOptional()
  @IsString()
  receiptFooterLine2?: string;

  @IsOptional()
  @IsString()
  upiId?: string;
}

export interface RestaurantSettingsResponse {
  floorSections: Array<{
    id: string;
    name: string;
    defaultCapacity: number;
    tableCount: number;
  }>;
  enableGst: boolean;
  hasDiningTables: boolean;
  defaultGstPercent: string;
  serviceChargePercent: string;
  packagingCharge: string;
  autoPrintKotOnFire: boolean;
  autoPrintBillOnSettle: boolean;
  defaultKitchenStation: string;
  storeName?: string;
  storeTagline?: string;
  storePhone?: string;
  storeGstin?: string;
  storeFssai?: string;
  storeAddress?: string;
  receiptFooterLine1?: string;
  receiptFooterLine2?: string;
  upiId?: string;
}
