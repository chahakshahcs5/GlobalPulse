import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller';
import { TaxonomyResolver } from './taxonomy.resolver';

@Module({
  controllers: [TopicsController],
  providers: [TaxonomyResolver],
  exports: [TaxonomyResolver],
})
export class TaxonomyModule {}
