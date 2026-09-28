import { Module } from '@nestjs/common';
import { CollectionsController } from './collections.controller';
import { CollectionService } from '@ai-news/stories';
import { db } from '@ai-news/database';

@Module({
  controllers: [CollectionsController],
  providers: [
    {
      provide: CollectionService,
      useFactory: () => new CollectionService(db),
    },
  ],
  exports: [CollectionService],
})
export class CollectionsModule {}
