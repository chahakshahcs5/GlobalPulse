import { Module } from '@nestjs/common';
import { SourcesController } from './sources.controller';
import { PublishersController } from './publishers.controller';

@Module({
  controllers: [SourcesController, PublishersController],
})
export class SourcesModule {}
