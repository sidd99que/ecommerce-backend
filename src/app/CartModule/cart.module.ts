// src/modules/cart/cart.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; 
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Cart, CartSchema } from '../../models/card.model'; 
import { Product, ProductSchema } from '../../models/product.model'; 

@Module({
  imports: [
    MongooseModule.forFeature([
      // 🎯 1. REGISTER CART MODEL (Fixes the dependency error)
      { name: Cart.name, schema: CartSchema }, 
      
      // 🎯 2. REGISTER PRODUCT MODEL (Required by CartService constructor)
      { name: Product.name, schema: ProductSchema }, 
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService], 
})
export class CartModule {}