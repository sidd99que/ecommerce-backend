import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { OrdersModule } from '../Order/order.module'; // ✅ Import your OrdersModule

@Module({
  imports: [
    ConfigModule, 
    OrdersModule // ✅ Required to access OrderService
  ], 
  controllers: [PaymentsController, WebhookController],
  providers: [PaymentsService, WebhookService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
