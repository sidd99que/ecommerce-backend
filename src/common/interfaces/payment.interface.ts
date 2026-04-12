export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'succeeded' 
  | 'failed' 
  | 'refunded' 
  | 'requires_action';

export interface IPayment {
  id: string;
  orderId: string;
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  amount: number; // Keep in cents
  currency: string;
  status: PaymentStatus;
  paymentMethodType?: string;
  receiptUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}