import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as Joi from 'joi';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestContextService } from './common/services/request-context.service'; // ✅ add
import { AuthModule } from './app/auth/auth.module';
import { AdminModule } from './app/admin/admin.module';
import { ProductsModule } from './app/products/products.module';
import { CategoriesModule } from './app/categories/categories.module';
import { CartModule } from './app/CartModule/cart.module';
import { OrdersModule } from './app/Order/order.module';
import { PaymentsModule } from './app/payments/payments.module';
import stripeConfig from './config/stripe.config';
import { ReviewsModule } from '@/reviews/reviews.module';
import { SearchModule } from '@/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [stripeConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        PORT: Joi.number().default(5000),
        MONGO_URI: Joi.string().required(),
        AUTH_JWT_ACCESS_SECRET: Joi.string().required(),
        AUTH_JWT_REFRESH_SECRET: Joi.string().required(),
        STRIPE_SECRET_KEY: Joi.string().required(),
        STRIPE_WEBHOOK_SECRET: Joi.string().required(),
        VITE_FRONTEND_URL: Joi.string().required(),
      }),
    }),

    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 1000,
      },
    ]),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),

 JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('AUTH_JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('AUTH_JWT_EXPIRES_IN') as any },
      }),
    }),


    AuthModule,
    AdminModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    SearchModule,
  ],
  providers: [
    RequestContextService, // ✅ register here

    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [RequestContextService], // ✅ export so other modules can use it
})
export class AppModule {}