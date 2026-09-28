import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhookService } from '@ai-news/stories';
import { db } from '@ai-news/database';

@Module({
  controllers: [WebhooksController],
  providers: [
    {
      provide: WebhookService,
      useFactory: () => new WebhookService(db),
    },
  ],
  exports: [WebhookService],
})
export class WebhooksModule {}
