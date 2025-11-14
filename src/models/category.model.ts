import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string; // Example: Men, Women, Kids

  @Prop()
  description?: string;

  // 🧩 Optional: to create subcategories under main categories
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null })
  parentCategory?: Category | null;

  @Prop({ default: true })
  isActive: boolean;
}

// 👇 Create a type that combines both Category and Document
export type CategoryDocument = Category & Document;

// 👇 Generate the Schema
export const CategorySchema = SchemaFactory.createForClass(Category);
