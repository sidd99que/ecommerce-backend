import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private configService: ConfigService) {
    // Try the direct env variable name first as a fallback
    const secretKey = this.configService.get<string>('stripe.secretKey') || 
                     this.configService.get<string>('STRIPE_SECRET_KEY');
                     
    const apiVersion = this.configService.get<string>('stripe.apiVersion') || '2024-12-18.acacia';

    if (!secretKey) {
      this.logger.error('Stripe Secret Key is missing! Check your .env file for STRIPE_SECRET_KEY');
      throw new Error('STRIPE_SECRET_KEY missing');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: apiVersion as any,
    });
  }
  async createCheckoutSession(dto: CreateCheckoutSessionDto, userId: string) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        // ✅ 2. Optional: In 2025, Stripe recommends enabling payment methods in the Dashboard 
        // instead of hardcoding 'card' here.
        payment_method_types: ['card'],
        line_items: dto.items.map(item => {
          // ✅ 3. Prevent floating point math errors
          const unitAmount = Math.round(Number(item.price) * 100);
          
          if (unitAmount <= 0) {
            throw new BadRequestException(`Invalid price for item: ${item.name}`);
          }

          return {
            price_data: {
              currency: this.configService.get<string>('stripe.currency') || 'usd',
              product_data: {
                name: item.name,
                images: item.image ? [item.image] : [],
              },
              unit_amount: unitAmount,
            },
            quantity: item.quantity,
          };
        }),
        success_url: dto.successUrl,
        cancel_url: dto.cancelUrl,
        metadata: {
          orderId: dto.orderId,
          userId,
        },
      });

      // ✅ 4. Return the URL. The frontend should use: window.location.href = session.url
      return { 
        sessionId: session.id, 
        url: session.url 
      };
    } catch (err) {
      // ✅ 5. Log the actual error for debugging but provide a clean message to user
      this.logger.error(`Failed to create Stripe session: ${err.message}`);
      
      if (err instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(err.message);
      }
      
      throw new InternalServerErrorException('Payment gateway communication failed');
    }
  }
}
