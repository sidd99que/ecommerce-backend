// src/order/types/order.types.ts
import { Types } from 'mongoose';

// Snapshot of each product inside the order
export interface OrderItemSnapshot {
  productId: Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

// Shipping address structure
export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  phone: string;
}

// Totals structure
export interface OrderTotals {
  subtotal: number;
  shippingFee: number;
  total: number;
}
