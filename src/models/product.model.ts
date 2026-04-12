import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { number } from 'joi';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

// ── Subdocuments ──────────────────────────────────────────────────────────────

class BrandInfo {
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;
}

class CategoryInfo {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;
}

class PriceInfo {
  @Prop({ required: true })
  current: number;

  @Prop({ required: true })
  original: number;

  @Prop({ default: 'PKR' })
  currency: string;
}

class ProductMetrics {
  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  salesCount: number;

  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 0, min: 0, max: 1 })
  popularityScore: number;
}

// 🔥 NEW: Color subdocument with name + hex
class ColorInfo {
  @Prop({ default: '' })
  name: string;      // e.g. "Brown", "Navy Blue"

  @Prop({ default: '' })
  hex: string;       // e.g. "#4a3728", "#1a1a2e"
}

// ── Main Schema ───────────────────────────────────────────────────────────────

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ type: PriceInfo, required: true })
  price: PriceInfo;

  @Prop()
  description: string;

  @Prop({ type: CategoryInfo, required: true })
  category: CategoryInfo;

  @Prop({ required: true, index: true })
  subCategory: string;

  @Prop({ type: BrandInfo })
  brand: BrandInfo;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: false, index: true })
  featured: boolean;

  @Prop({
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'active',
    index: true,
  })
  status: string;

  @Prop({ default: false, index: true })
  isDiscounted: boolean;

  @Prop({ min: 0, max: 100, default: 0 })
  discountPercentage: number;

  @Prop({ type: Date, default: Date.now, index: true })
  arrivalDate: Date;

  @Prop({ type: [String], default: [] })
  searchKeywords: string[];

  @Prop({ type: ProductMetrics, default: () => ({}) })
  metrics: ProductMetrics;

  // 🔥 UPDATED: variants now has color object + sizes array + images
  @Prop({
    type: [
      {
        color: {
          name: { type: String, default: '' },
          hex: { type: String, default: '' },
        },
        sizes: { type: [String], default: [] },  // e.g. ["S", "M", "L", "XL"]
        images: { type: [String], default: [] },
      },
    ],
    default: [],
  })
  variants: {
    color?: { name: string; hex: string };
    sizes: string[];
    images: string[];
  }[];

  // keep top-level images as fallback
  @Prop({ type: [String], default: [] })
  images: string[];


  @Prop({ type: [Number], default: [] })
embedding: number[];
}

export type ProductDocument = Product & Document;
export const ProductSchema = SchemaFactory.createForClass(Product);

// ── Indexes ───────────────────────────────────────────────────────────────────

ProductSchema.index(
  {
    name: 'text',
    description: 'text',
    searchKeywords: 'text',
    'brand.name': 'text',
  },
  {
    weights: {
      name: 10,
      searchKeywords: 5,
      'brand.name': 3,
      description: 1,
    },
  },
);

ProductSchema.index({
  status: 1,
  'category._id': 1,
  'price.current': 1,
  arrivalDate: -1,
});

ProductSchema.index({
  status: 1,
  'brand._id': 1,
  'price.current': 1,
});

ProductSchema.index({
  status: 1,
  featured: 1,
  'metrics.popularityScore': -1,
});

ProductSchema.index({
  status: 1,
  isDiscounted: 1,
  discountPercentage: -1,
});


ProductSchema.index({ slug: 1 });
ProductSchema.index({ 'price.current': 1 });
ProductSchema.index({ stock: 1 });