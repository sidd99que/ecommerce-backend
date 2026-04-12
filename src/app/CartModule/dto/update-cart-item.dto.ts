import { IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  selectedVariant?: string;
}
