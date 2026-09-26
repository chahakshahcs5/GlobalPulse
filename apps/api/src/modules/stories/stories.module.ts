import { Module } from '@nestjs/common';
import { StoriesController } from './stories.controller';
import { StoriesResolver } from './stories.resolver';

@Module({
  controllers: [StoriesController],
  providers: [StoriesResolver],
  exports: [StoriesResolver],
})
export class StoriesModule {}
