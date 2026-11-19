import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ParseMenuImageDto {
  @IsString()
  @IsNotEmpty()
  imageBase64!: string;

  @IsOptional()
  @IsString()
  mimeType?: string; // 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'
}

export class ParsedMenuDishItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  price!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsOptional()
  @IsString()
  foodType?: string; // 'veg' | 'non_veg' | 'egg'

  @IsOptional()
  @IsString()
  kitchenStation?: string; // 'kitchen' | 'bar' | 'desserts' | 'tandoor'

  @IsOptional()
  @IsString()
  hsnCode?: string;
}

export class ImportMenuDishesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParsedMenuDishItemDto)
  dishes!: ParsedMenuDishItemDto[];

  @IsOptional()
  @IsString()
  branchId?: string;
}

export interface ParseMenuResponse {
  dishes: Array<{
    name: string;
    price: string;
    category: string;
    foodType: 'veg' | 'non_veg' | 'egg';
    kitchenStation: string;
    hsnCode: string;
    confidence: number;
  }>;
  totalExtracted: number;
  provider: 'gemini-vision' | 'gemini' | 'mock-fallback';
}
