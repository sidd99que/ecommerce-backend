// src/cart/cart.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from '../../models/card.model';
import { Product, ProductDocument } from '../../models/product.model';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CreateCartItemDto } from './dto/add-to-cart.dto';
import type { CartItemDocument } from '../../common/interfaces/cart-item.interface';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  // ============================================================
  // HELPER — Validate MongoDB ObjectId
  // ============================================================
  private validateObjectId(id: string, label = 'ID'): void {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(`Invalid ${label}`);
  }

  // ============================================================
  // HELPER — Check if guest ID
  // ============================================================
  private isGuestId(id: string): boolean {
    return id.startsWith('guest_');
  }

  // ============================================================
  // 1. ADD ITEM TO CART
  // ✅ FIX: Check if product already exists → increment qty
  //         instead of always pushing a new row
  // ============================================================
  async addItemToCart(userId: string, dto: CreateCartItemDto) {
    try {
      this.validateObjectId(dto.productId, 'product ID');

      // Check product exists and is in stock
      const product = await this.productModel.findById(dto.productId);
      if (!product) throw new NotFoundException('Product not found');
      if (product.stock <= 0) throw new BadRequestException('Product is out of stock');

      const productObjectId = new Types.ObjectId(dto.productId);

      // ✅ First check if this product already exists in the cart
      const existingCart = await this.cartModel.findOne({
        userId,
        'items.productId': productObjectId,
        // also match variant if provided
        ...(dto.selectedVariant
          ? { 'items.selectedVariant': dto.selectedVariant }
          : {}),
      });

      let updatedCart;

      if (existingCart) {
        // ✅ Product already in cart — just increment quantity
        updatedCart = await this.cartModel.findOneAndUpdate(
          {
            userId,
            'items.productId': productObjectId,
          },
          {
            $inc: { 'items.$.quantity': dto.quantity },
          },
          { new: true }
        ).populate('items.productId');
      } else {
        // ✅ Product not in cart — add new item
        const newItem: Partial<CartItemDocument> = {
          productId: productObjectId,
          quantity: dto.quantity,
          selectedVariant: dto.selectedVariant,
        };

        updatedCart = await this.cartModel.findOneAndUpdate(
          { userId },
          { $push: { items: newItem } },
          { upsert: true, new: true }
        ).populate('items.productId');
      }

      return updatedCart ?? { items: [] };

    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) throw error;

      throw new InternalServerErrorException('Failed to add item to cart');
    }
  }

  // ============================================================
  // 2. UPDATE ITEM QUANTITY
  // ============================================================
  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    try {
      if (this.isGuestId(itemId)) return { items: [] };

      this.validateObjectId(itemId, 'item ID');

      if (dto.quantity < 1)
        throw new BadRequestException('Quantity must be at least 1');

      const updatedCart = await this.cartModel.findOneAndUpdate(
        { userId, 'items._id': itemId },
        { $set: { 'items.$.quantity': dto.quantity } },
        { new: true }
      ).populate('items.productId');

      if (!updatedCart) throw new NotFoundException('Cart item not found');

      return updatedCart;

    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) throw error;

      throw new InternalServerErrorException('Failed to update cart item');
    }
  }

  // ============================================================
  // 3. REMOVE ITEM
  // ============================================================
  async removeItem(userId: string, itemId: string) {
    try {
      if (this.isGuestId(itemId)) return { items: [] };

      this.validateObjectId(itemId, 'item ID');

      const updatedCart = await this.cartModel.findOneAndUpdate(
        { userId },
        { $pull: { items: { _id: itemId } } },
        { new: true }
      ).populate('items.productId');

      if (!updatedCart) throw new NotFoundException('Cart not found');

      return updatedCart;

    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) throw error;

      throw new InternalServerErrorException('Failed to remove cart item');
    }
  }

  // ============================================================
  // 4. GET CART (POPULATED)
  // ============================================================
  async getCart(userId: string) {
    try {
      const cart = await this.cartModel
        .findOne({ userId })
        .populate('items.productId')
        .lean();

      return cart ?? { items: [] };

    } catch {
      throw new InternalServerErrorException('Failed to fetch cart');
    }
  }

  // ============================================================
  // 5. CLEAR CART
  // ============================================================
  async clearCart(userId: string) {
    try {
      await this.cartModel.deleteOne({ userId });
      return { message: 'Cart cleared successfully' };

    } catch {
      throw new InternalServerErrorException('Failed to clear cart');
    }
  }
}