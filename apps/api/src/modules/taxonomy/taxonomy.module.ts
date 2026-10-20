import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller';
import { DesksController } from './desks.controller';
import { TaxonomyResolver } from './taxonomy.resolver';

@Module({
  controllers: [TopicsController, DesksController],
  providers: [TaxonomyResolver],
  exports: [TaxonomyResolver],
})
export class TaxonomyModule {}
