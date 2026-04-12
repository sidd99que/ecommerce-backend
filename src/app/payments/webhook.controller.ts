import { Controller, Post, Req } from '@nestjs/common';
import express from 'express';
import { WebhookService } from './webhook.service';
import { Public } from '@common/decorator/public.decorator';

@Controller('payments/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Public()
  @Post()
  handleWebhook(@Req() req: express.Request) {
    return this.webhookService.handle(req as any);
  }
}
