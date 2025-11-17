// src/models/product.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Category } from './category.model';

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, index: true }) // 🔥 search by name faster
  name: string;

  @Prop({ required: true, index: true }) // 🔥 filter + sort by price faster
  price: number;

  @Prop()
  description: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true, // 🔥 product filtering by category
  })
  category: Category;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: false, index: true }) // 🔥 get featured products fast
  featured: boolean;

  @Prop({
    type: [
      {
        color: { type: String, required: true, index: true }, // 🔥 search by color fast
        images: { type: [String], default: [] },
      },
    ],
    default: [],
  })
  variants: { color: string; images: string[] }[];
}

export type ProductDocument = Product & Document;
export const ProductSchema = SchemaFactory.createForClass(Product);

// Optional: Compound index for category + price sorting/filtering
ProductSchema.index({ category: 1, price: 1 });
