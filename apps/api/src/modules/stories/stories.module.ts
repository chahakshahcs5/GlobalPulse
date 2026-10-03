import { Module } from '@nestjs/common';
import { db } from '@ai-news/database';
import {
  StoryService,
  SchedulingService,
  PersonalizationService,
  ClusteringService,
  LiveblogService,
} from '@ai-news/stories';
import { SearchService } from '@ai-news/search';
import { SourceService } from '@ai-news/sources';
import { StoriesController } from './stories.controller';
import { StoriesResolver } from './stories.resolver';

@Module({
  controllers: [StoriesController],
  providers: [
    StoriesResolver,
    {
      provide: StoryService,
      useFactory: () => new StoryService(db),
    },
    {
      provide: SchedulingService,
      useFactory: () => new SchedulingService(db),
    },
    {
      provide: PersonalizationService,
      useFactory: () => new PersonalizationService(db),
    },
    {
      provide: ClusteringService,
      useFactory: () => new ClusteringService(db),
    },
    {
      provide: LiveblogService,
      useFactory: () => new LiveblogService(db),
    },
    {
      provide: SearchService,
      useFactory: () => new SearchService(db),
    },
    {
      provide: SourceService,
      useFactory: () => new SourceService(db),
    },
  ],
  exports: [
    StoriesResolver,
    StoryService,
    SchedulingService,
    PersonalizationService,
    ClusteringService,
    LiveblogService,
    SearchService,
    SourceService,
  ],
})
export class StoriesModule {}
