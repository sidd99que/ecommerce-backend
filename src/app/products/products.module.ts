import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductDescriptionService } from '@/services/product-description.service'; // ✅ Import
import { Product, ProductSchema } from 'src/models/product.model';
import { Category, CategorySchema } from '../../models/category.model';
import {  SearchModule } from '../search/search.module'; // 🔥 ADD THIS

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
  
    ]),
         SearchModule, 
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductDescriptionService, 
  ],
  exports: [ProductsService],
})
export class ProductsModule {}