import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class GenerateContentDto {
  @IsString()
  productName: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  features: string[];
}