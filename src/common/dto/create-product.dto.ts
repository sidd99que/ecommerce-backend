// src/common/dto/create-product.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
  IsDateString,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

class BrandDto {
  @IsMongoId()
  @IsOptional()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}

class CategoryDto {
  @IsMongoId()
  @IsOptional()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}

class PriceDto {
  @IsNumber()
  @Min(0)
  current: number;

  @IsNumber()
  @Min(0)
  original: number;

  @IsString()
  @IsOptional()
  currency?: string = 'PKR';
}

// 🔥 NEW: Color DTO
class ColorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  hex?: string;
}

// 🔥 UPDATED: Variant DTO
class ProductVariantDto {
  @ValidateNested()
  @Type(() => ColorDto)
  @IsOptional()
  color?: ColorDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @ValidateNested()
  @Type(() => PriceDto)
  price: PriceDto;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @Type(() => CategoryDto)
  category: CategoryDto;

  @IsString()
  @IsNotEmpty()
  subCategory: string;

  @ValidateNested()
  @Type(() => BrandDto)
  @IsOptional()
  brand?: BrandDto;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number = 0;

  @IsBoolean()
  @IsOptional()
  featured?: boolean = false;

  @IsEnum(['active', 'draft', 'archived'])
  @IsOptional()
  status?: string = 'active';

  @IsBoolean()
  @IsOptional()
  isDiscounted?: boolean = false;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercentage?: number = 0;

  @IsDateString()
  @IsOptional()
  arrivalDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  searchKeywords?: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[] = [];
}