// models/user.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;  // 👈 explicitly define the type of MongoDB ID

  @Prop({ required: true})
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user' }) // roles: 'user', 'admin'
  role: string;

   @Prop()
  hashedRefreshToken?: string; // ✅ add the missing field
}

// 👇 Now UserDocument has _id: Types.ObjectId instead of unknown
export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
