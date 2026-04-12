import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeRequest } from '../../common/interfaces/stripe-request.interface';
import { OrdersService } from '../Order/order.service'; 

@Injectable()
export class WebhookService {
  private stripe: Stripe;
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private configService: ConfigService,
    private readonly orderService: OrdersService, 
  ) {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is missing in environment variables');
    }

    this.stripe = new Stripe(key, {
      apiVersion: '2024-12-18.acacia' as any, 
    });
  }

  async handle(req: StripeRequest) {
    const sig = req.headers['stripe-signature'];
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!sig || !secret) {
      this.logger.error('Webhook Error: Missing signature or secret');
      throw new BadRequestException('Webhook configuration error');
    }

    if (!req.rawBody) {
      this.logger.error('Webhook Error: Raw body missing. Check main.ts');
      throw new BadRequestException('Internal Server Error: Raw body missing');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        sig as string,
        secret,
      );
    } catch (err) {
      const errorMessage = (err as Error).message;
      this.logger.warn(`Webhook Signature Verification Failed: ${errorMessage}`);
      throw new BadRequestException(`Webhook Error: ${errorMessage}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      this.logger.error(`Error processing event ${event.type}: ${(err as Error).message}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.orderId;
    this.logger.log(`Checkout completed for Order: ${orderId}`);

    if (orderId) {
      // ✅ Use 'undefined' for the 2nd arg (DTO) to match your OrderService
      await this.orderService.updateOrderStatus(
        orderId, 
        undefined, 
        'confirmed', 
        {
          stripeSessionId: session.id,
          paymentIntentId: session.payment_intent as string,
        }
      );
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    const orderId = charge.metadata?.orderId;
    if (orderId) {
      // ✅ Use 'undefined' for the 2nd arg (DTO)
      await this.orderService.updateOrderStatus(
        orderId, 
        undefined, 
         'cancelled',
        { refundId: charge.id }
      );
    }
  }
}
