import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCartItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  selectedVariant?: string; // e.g., color, size, etc.
}
