// interfaces/cart-item.interface.ts
import { Types } from 'mongoose';

export interface CartItemDocument {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  selectedVariant?: string;
}