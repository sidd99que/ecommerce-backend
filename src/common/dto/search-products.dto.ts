// src/common/dto/search-products.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProductsDto {
  // Text search query
  @IsOptional()
  @IsString()
  q?: string; // Search keywords (e.g., "apple phone")

  // Filters
  @IsOptional()
  @IsString()
  category?: string; // Category ID or name

  @IsOptional()
  @IsString()
  brand?: string; // Brand ID or name

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  inStock?: boolean; // Only show in-stock products

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  featured?: boolean; // Only featured products

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  onSale?: boolean; // Only discounted products

  // Sorting
  @IsOptional()
  @IsEnum(['price-asc', 'price-desc', 'newest', 'popular', 'relevance'])
  sort?: 'price-asc' | 'price-desc' | 'newest' | 'popular' | 'relevance';

  // Pagination
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
  includeFacets: any;
  query: string | undefined;
}