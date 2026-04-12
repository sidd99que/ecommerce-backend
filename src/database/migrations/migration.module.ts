// src/database/migrations/migration.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UpdateProductsSchema } from './update-products-schema';

@Module({
  imports: [MongooseModule.forRoot(process.env.MONGODB_URI || '')],
  providers: [UpdateProductsSchema],
  exports: [UpdateProductsSchema],
})
export class MigrationModule {}