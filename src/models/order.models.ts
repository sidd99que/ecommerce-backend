import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING         = 'pending',
  CONFIRMED       = 'confirmed',
  SHIPPED         = 'shipped',
  DELIVERED       = 'delivered',
  CANCELLED       = 'cancelled',
  AWAITING_PAYMENT = 'awaiting_payment',
}

export enum PaymentMethod {
  COD    = 'COD',
  STRIPE = 'STRIPE',
}

export enum PaymentStatus {
  PENDING          = 'pending',
  PAID             = 'paid',
  FAILED           = 'failed',
  AWAITING_PAYMENT = 'awaiting_payment',
}

// ── Sub-schemas ───────────────────────────────────────────────────────────────

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  image!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  quantity!: number;

  @Prop()
  color?: string;

  @Prop()
  size?: string;
}

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  address!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  country!: string;
}

@Schema({ _id: false })
export class Totals {
  @Prop({ required: true })
  subtotal!: number;

  @Prop({ required: true })
  shippingFee!: number;

  @Prop({ required: true })
  total!: number;
}

// ── Main Order Schema ─────────────────────────────────────────────────────────

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  userEmail!: string;

  @Prop({ required: true, unique: true })
  orderNumber!: string;

  @Prop({ type: [OrderItem], required: true })
  items!: OrderItem[];

  @Prop({ type: ShippingAddress, required: true })
  shippingAddress!: ShippingAddress;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  status!: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
  })
  paymentMethod!: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: string;

  @Prop({ type: Totals, required: true })
  totals!: Totals;

  @Prop()
  estimatedDelivery?: Date;

  @Prop({ default: null })
  trackingNumber?: string;

  @Prop({ default: null })
  canceledAt?: Date;

  @Prop({ default: null })
  cancellationReason?: string;

  @Prop({ type: String, default: null })
  stripeSessionId?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);