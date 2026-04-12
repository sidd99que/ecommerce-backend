// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersService } from './order.service';
import { OrdersController } from './order.controller';

import { Order, OrderSchema } from '../../models/order.models';
import { Product, ProductSchema } from '../../models/product.model';
import { Cart, CartSchema } from '../../models/card.model';

import { MailModule } from '../mail/mail.module'; // ✅ ADD THIS

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Cart.name, schema: CartSchema },
    ]),
    MailModule, // ✅ ADD THIS
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}