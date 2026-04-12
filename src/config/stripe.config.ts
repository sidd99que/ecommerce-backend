
//common/congfig/stripe.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  // We use || '' to ensure TypeScript sees this as a string, not undefined
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // Use the latest stable version from your Stripe Dashboard
  apiVersion: '2024-06-20' as any, 
  
  // Default currency for the app
  currency: process.env.STRIPE_CURRENCY || 'usd',
}));