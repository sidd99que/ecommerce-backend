import { IsArray, IsNotEmpty, IsNumber, IsString, IsUrl, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CheckoutItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional() // ✅ Add this to prevent "Non-Whitelisted" error
  @IsString()
  productId?: string;
}

export class CreateCheckoutSessionDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @IsUrl(
    { require_tld: false }, // ✅ allow localhost for dev
    { message: 'successUrl must be a valid URL' }
  )
  successUrl: string;

  @IsUrl(
    { require_tld: false }, // ✅ allow localhost for dev
    { message: 'cancelUrl must be a valid URL' }
  )
  cancelUrl: string;
}
