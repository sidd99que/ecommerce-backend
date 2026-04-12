import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Order Item ────────────────────────────────────────────────────────────────

class OrderItemDto {
  @IsNotEmpty()
  @IsString()
  productId!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  image!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  size?: string;
}

// ── Shipping Address ──────────────────────────────────────────────────────────

class ShippingAddressDto {
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsNotEmpty()
  @IsString()
  address!: string;

  @IsNotEmpty()
  @IsString()
  city!: string;

  @IsNotEmpty()
  @IsString()
  country!: string;
}

// ── Totals ────────────────────────────────────────────────────────────────────

class TotalsDto {
  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsNumber()
  @Min(0)
  shippingFee!: number;

  @IsNumber()
  @Min(0)
  total!: number;
}

// ── Create Order ──────────────────────────────────────────────────────────────

export class CreateOrderDto {
  @IsNotEmpty()
  @IsEmail()
  userEmail!: string;

  @IsOptional()
  @IsString()
  orderNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @ValidateNested()
  @Type(() => TotalsDto)
  totals!: TotalsDto;

  @IsEnum(['COD', 'STRIPE'])
  paymentMethod!: 'COD' | 'STRIPE';

  @IsOptional()
  @IsString()
  stripeSessionId?: string | null;

  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string;
}