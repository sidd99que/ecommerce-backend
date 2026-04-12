import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  _id!: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
  })
  username!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({
    required: function (this: any) {
      return !this.googleId;
    },
  })
  password?: string;

  @Prop({ default: 'user' })
  role!: string;

  @Prop()
  hashedRefreshToken?: string;

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop()
  picture?: string;

  @Prop({ default: null })          // 👈 Add this
  passwordResetToken?: string;

  @Prop({ default: null })          // 👈 Add this
  passwordResetExpires?: Date;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);