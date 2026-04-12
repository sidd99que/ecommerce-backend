import { IsMongoId, IsNumber, IsString, Max, Min, MinLength, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment: string;
}