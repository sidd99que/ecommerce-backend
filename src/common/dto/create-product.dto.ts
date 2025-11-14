// src/common/dto/create-product.dto.ts
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @IsString() 
  name: string;

  @IsNumber() 
  price: number;

  @IsString() 
  category: string; // Subcategory ID (T-Shirts, Shoes, etc.)

  @IsOptional() 
  @IsString() 
  description?: string;

  @IsOptional() 
  @IsString() 
  image?: string;

  @IsOptional() 
  @IsNumber() 
  stock?: number;

  @IsOptional() 
  @IsBoolean() 
  featured?: boolean;
}