// src/common/dto/create-category.dto.ts
import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  parentCategory?: string; // ID of parent category (null for main categories)

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}