

import {
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';
;

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

  @IsOptional()
  @IsEnum(['pending', 'paid', 'failed'])
  paymentStatus?: 'pending' | 'paid' | 'failed';

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsDateString()
  canceledAt?: string; // ISO date string for cancellation

  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string; // Update delivery date if needed
}