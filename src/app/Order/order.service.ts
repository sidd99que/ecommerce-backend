// src/orders/order.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Order, OrderDocument } from '../../models/order.models';
import { Product, ProductDocument } from '../../models/product.model';
import { Cart, CartDocument } from '../../models/card.model';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

import { CustomerException } from '../../common/exceptions/custom.exception';
import { MailService } from '../mail/mail.service'; // ✅ ADD THIS

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private readonly mailService: MailService, // ✅ ADD THIS
  ) {}

  // ────────────────────────────────────────────────
  // 1️⃣ CREATE ORDER (USER)
  // ────────────────────────────────────────────────
  async createOrder(userId: string, dto: CreateOrderDto) {
    try {
      this.logger.log('═══════════════════════════════════');
      this.logger.log('🔵 SERVICE: Creating order');
      this.logger.log('═══════════════════════════════════');
      this.logger.log(`👤 User ID: ${userId}`);
      this.logger.log(`📧 Email: ${dto.userEmail}`);
      this.logger.log(`📦 Items count: ${dto.items?.length || 0}`);
      this.logger.log(`💰 Payment Method: ${dto.paymentMethod}`);

      if (!dto.items || dto.items.length === 0) {
        this.logger.error('❌ No items in order');
        throw new CustomerException('No items in order');
      }

      const orderItems: Array<{
        productId: any;
        name: string;
        image: string;
        price: number;
        quantity: number;
        color: any;
        size: any;
      }> = [];
      let calculatedSubtotal = 0;

      for (const item of dto.items) {
        this.logger.log(`🔍 Validating product: ${item.productId}`);

        const product = await this.productModel.findById(item.productId);

        if (!product) {
          this.logger.error(`❌ Product not found: ${item.productId}`);
          throw new CustomerException(`Product with ID ${item.productId} not found`);
        }

        this.logger.log(`✅ Product found: ${product.name} - $${product.price}`);

        orderItems.push({
          productId: product._id,
          name: product.name,
          image: item.image || product.variants?.[0]?.images?.[0] || '',
          price: product.price.current,
          quantity: item.quantity,
          color: item.color || null,
          size: item.size || null,
        });

        calculatedSubtotal += product.price.current * item.quantity;
      }

      this.logger.log(`💰 Calculated subtotal: $${calculatedSubtotal}`);

      const orderNumber = dto.orderNumber || `ORD-${new Date().getFullYear()}-${Math.random()
        .toString(36)
        .toUpperCase()
        .substring(2, 7)}`;

      this.logger.log(`🔢 Order number: ${orderNumber}`);

      const estimatedDelivery = dto.estimatedDelivery
        ? new Date(dto.estimatedDelivery)
        : (() => {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            return date;
          })();

      this.logger.log('💾 Saving order to database...');

      const order = await this.orderModel.create({
        userId,
        userEmail: dto.userEmail,
        orderNumber,
        items: orderItems,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod,
        paymentStatus: dto.paymentMethod === 'COD' ? 'pending' : 'awaiting_payment',
        status: 'pending',
        totals: {
          subtotal: calculatedSubtotal,
          shippingFee: dto.totals.shippingFee,
          total: calculatedSubtotal + dto.totals.shippingFee,
        },
        estimatedDelivery,
        stripeSessionId: dto.stripeSessionId || null,
      });

      this.logger.log(`✅ Order created successfully: ${order._id}`);

      // ✅ Clear cart for COD orders only
      if (dto.paymentMethod === 'COD') {
        this.logger.log('🧹 Clearing cart for COD order...');
        await this.cartModel.findOneAndUpdate(
          { userId },
          { $set: { items: [] } },
        );
      }

      // ✅ Send confirmation email
      this.logger.log('📧 Sending order confirmation email...');
      await this.mailService.sendOrderConfirmation(order);

      this.logger.log('═══════════════════════════════════');

      return order;

    } catch (error) {
      this.logger.error('═══════════════════════════════════');
      this.logger.error(`❌ Order creation failed: ${error instanceof Error ? error.message : String(error)}`);
      this.logger.error(`❌ Stack: ${error instanceof Error ? error.message : String(error)}`);
      this.logger.error('═══════════════════════════════════');
      throw error;
    }
  }

  // ────────────────────────────────────────────────
  // 2️⃣ GET USER ORDERS
  // ────────────────────────────────────────────────
  async getUserOrders(userId: string) {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 });
  }

  // ────────────────────────────────────────────────
  // 3️⃣ GET USER ORDER BY ID
  // ────────────────────────────────────────────────
  async getUserOrderById(userId: string, orderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new CustomerException('Order not found');
    if (order.userId.toString() !== userId.toString()) {
      throw new ForbiddenException('You cannot access this order');
    }
    return order;
  }

  // ────────────────────────────────────────────────
  // 4️⃣ ADMIN → GET ALL ORDERS
  // ────────────────────────────────────────────────
  async getAllOrders() {
    return this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
  }

  // ────────────────────────────────────────────────
  // 5️⃣ ADMIN → GET ORDER BY ID
  // ────────────────────────────────────────────────
  async getOrderById(userId: string, orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('userId', 'name email');
    if (!order) throw new CustomerException('Order not found');
    if (order.userId._id.toString() !== userId) {
      throw new ForbiddenException('You cannot access this order');
    }
    return order;
  }

  // ────────────────────────────────────────────────
  // 6️⃣ ADMIN → UPDATE STATUS
  // ────────────────────────────────────────────────
  async updateOrderStatus(
    orderId: string,
    dto?: UpdateOrderDto,
    status?: string,
    details?: { stripeSessionId?: string; paymentIntentId?: string; refundId?: string }
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new CustomerException('Order not found');

    if (dto) {
      if (dto.status) order.status = dto.status as any;
      if (dto.paymentStatus) order.paymentStatus = dto.paymentStatus;
      if (dto.trackingNumber) order.trackingNumber = dto.trackingNumber;
      if (dto.status === 'cancelled') {
        order.canceledAt = new Date();
        order.cancellationReason = dto.cancellationReason || 'No reason specified';
      }
    }

    if (status) {
      order.status = status as any;
      if (status === 'confirmed') order.paymentStatus = 'paid';
      if (status === 'cancelled') {
        order.canceledAt = new Date();
        order.cancellationReason = 'Refunded via Stripe';
      }
    }

    if (details) {
      if (details.stripeSessionId) order.stripeSessionId = details.stripeSessionId;
    }

    return order.save();
  }

  // ────────────────────────────────────────────────
  // 7️⃣ DELETE ORDER (ADMIN)
  // ────────────────────────────────────────────────
  async deleteOrder(orderId: string) {
    const order = await this.orderModel.findByIdAndDelete(orderId);
    if (!order) throw new CustomerException('Order not found');
    return { message: 'Order deleted successfully' };
  }
}