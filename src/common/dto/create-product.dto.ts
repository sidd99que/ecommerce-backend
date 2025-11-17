// src/common/dto/create-product.dto.ts
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductVariantDto {
  @IsString()
  color: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];
}

export class CreateProductDto {
  @IsString() 
  name: string;

  @IsNumber() 
  price: number;

  @IsString() 
  category: string;

  @IsOptional() 
  @IsString() 
  description?: string;

  @IsOptional() 
  @IsNumber() 
  stock?: number;

  @IsOptional() 
  @IsBoolean() 
  featured?: boolean;

@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => ProductVariantDto)
variants: ProductVariantDto[] = [];

}
