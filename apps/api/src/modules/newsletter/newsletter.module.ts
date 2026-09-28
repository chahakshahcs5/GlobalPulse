import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from '@ai-news/stories';
import { db } from '@ai-news/database';

@Module({
  controllers: [NewsletterController],
  providers: [
    {
      provide: NewsletterService,
      useFactory: () => new NewsletterService(db),
    },
  ],
  exports: [NewsletterService],
})
export class NewsletterModule {}
