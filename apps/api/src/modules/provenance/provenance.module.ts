import { Module } from '@nestjs/common';
import { ProvenanceController } from './provenance.controller';
import { ProvenanceService } from '@ai-news/stories';
import { db } from '@ai-news/database';

@Module({
  controllers: [ProvenanceController],
  providers: [
    {
      provide: ProvenanceService,
      useFactory: () => new ProvenanceService(db),
    },
  ],
  exports: [ProvenanceService],
})
export class ProvenanceModule {}
