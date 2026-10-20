import { Module } from '@nestjs/common';
import { StoryIntelligenceController, BlockRegistryController } from './intelligence.controller';
import { AlertsController } from './alerts.controller';
import { IngestionController } from './ingestion.controller';
import { KnowledgeGraphController } from './knowledge-graph.controller';
import { SourceIntelligenceController } from './source-intelligence.controller';
import { IntelligenceResolver, ClaimEvidenceResolver } from './intelligence.resolver';
import { EvidenceChainController } from './evidence-chain.controller';

/**
 * Story intelligence, claims & evidence, timelines, perspectives, alerts,
 * ingestion, knowledge graph and source intelligence REST + GraphQL surface.
 *
 * Services are constructed from the shared `db` singleton (matching the
 * convention used by the other feature modules), so controllers can be
 * registered without additional providers.
 */
@Module({
  controllers: [
    StoryIntelligenceController,
    BlockRegistryController,
    AlertsController,
    IngestionController,
    KnowledgeGraphController,
    SourceIntelligenceController,
    EvidenceChainController,
  ],
  providers: [IntelligenceResolver, ClaimEvidenceResolver],
  exports: [IntelligenceResolver],
})
export class IntelligenceModule {}
