import type { DatabaseService } from '@ai-news/database';
import type { Entity, IngestionItem, Topic } from '@ai-news/schemas';

/**
 * Ingestion enrichment (§37).
 *
 * The newsroom ingestion pipeline is:
 *
 *   Source → Fetcher → Normalizer → Deduplicator → Entity Extraction →
 *   Topic Classification → Story Clustering → Claim Extraction →
 *   Source Linking → Editorial Review → GlobalPulse
 *
 * The stages that need interpretation (entity extraction, topic
 * classification, claim extraction) are implemented here as **pluggable
 * providers**. The default provider is fully deterministic — no LLM is
 * required, and every signal it produces is explainable:
 *
 * - **Entity extraction** matches known entity names and aliases in the text.
 * - **Topic classification** scores known topics by token overlap.
 * - **Claim extraction** segments the text into candidate factual assertions.
 *
 * A future AI-backed provider can replace the default without touching the
 * pipeline: implement {@link IngestionEnrichmentProvider} and pass it to
 * {@link IngestionEnrichmentService}.
 */

/** The stages of the ingestion pipeline, in execution order. */
export const INGESTION_PIPELINE_STAGES = [
  'source',
  'fetch',
  'normalize',
  'deduplicate',
  'entity_extraction',
  'topic_classification',
  'story_clustering',
  'claim_extraction',
  'source_linking',
  'editorial_review',
  'published',
] as const;

export type IngestionPipelineStage = (typeof INGESTION_PIPELINE_STAGES)[number];

export interface EnrichmentContext {
  organizationId: string;
  entities: Entity[];
  topics: Topic[];
}

export interface EnrichmentResult {
  entityIds: string[];
  topicIds: string[];
  claimTexts: string[];
  /** Human-readable notes about how each signal was derived. */
  methodology: string[];
}

export interface IngestionEnrichmentProvider {
  readonly name: string;
  extractEntities(text: string, context: EnrichmentContext): Promise<string[]>;
  classifyTopics(text: string, context: EnrichmentContext): Promise<string[]>;
  extractClaims(text: string, context: EnrichmentContext): Promise<string[]>;
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'have',
  'has',
  'was',
  'were',
  'are',
  'been',
  'will',
  'would',
  'could',
  'should',
  'they',
  'their',
  'there',
  'here',
  'said',
  'says',
  'after',
  'before',
  'into',
  'over',
  'about',
  'also',
  'more',
  'than',
  'when',
  'while',
  'what',
  'which',
  'who',
  'how',
  'why',
  'not',
  'but',
  'its',
  'his',
  'her',
  'our',
  'out',
  'off',
  'all',
  'new',
  'one',
  'two',
  'may',
  'can',
  'per',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Deterministic, provider-neutral enrichment.
 *
 * Entity extraction is an exact name/alias match (case-insensitive).
 * Topic classification scores topics by how many of their significant tokens
 * appear in the text and keeps the ones above a threshold.
 * Claim extraction keeps sentences that read like factual assertions.
 */
export class DeterministicEnrichmentProvider implements IngestionEnrichmentProvider {
  readonly name = 'deterministic';

  async extractEntities(text: string, context: EnrichmentContext): Promise<string[]> {
    const haystack = ` ${text.toLowerCase()} `;
    const found = new Set<string>();

    for (const entity of context.entities) {
      const candidates = [entity.name, ...(entity.aliases ?? [])].filter(Boolean);
      for (const candidate of candidates) {
        const needle = candidate.toLowerCase().trim();
        if (needle.length < 3) continue;
        if (haystack.includes(` ${needle} `) || haystack.includes(needle)) {
          found.add(entity.id);
          break;
        }
      }
    }

    return Array.from(found);
  }

  async classifyTopics(text: string, context: EnrichmentContext): Promise<string[]> {
    const tokens = new Set(tokenize(text));
    if (tokens.size === 0) return [];

    const scored: Array<{ topicId: string; score: number }> = [];
    for (const topic of context.topics) {
      const topicTokens = new Set(
        tokenize([topic.name, ...(topic.aliases ?? []), topic.description ?? ''].join(' '))
      );
      if (topicTokens.size === 0) continue;
      let overlap = 0;
      for (const token of topicTokens) {
        if (tokens.has(token)) overlap += 1;
      }
      if (overlap === 0) continue;
      // Normalize by the smaller token set so long descriptions do not win.
      const score = overlap / Math.min(topicTokens.size, tokens.size);
      if (score >= 0.15) scored.push({ topicId: topic.id, score });
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry) => entry.topicId);
  }

  async extractClaims(text: string, _context: EnrichmentContext): Promise<string[]> {
    const sentences = text
      .split(/(?<=[.!?])\s+|\n+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 25 && sentence.length <= 400);

    const claims: string[] = [];
    for (const sentence of sentences) {
      // A candidate assertion mentions a concrete quantity, a proper noun, or a
      // named institution. Pure opinion fragments are skipped.
      const hasNumber = /\d/.test(sentence);
      const hasProperNoun = /\b[A-Z][a-zA-Z]{2,}\b/.test(sentence);
      const hasAttribution = /\b(said|reported|according|announced|confirmed|released)\b/i.test(
        sentence
      );
      if (hasNumber || hasProperNoun || hasAttribution) {
        claims.push(sentence);
      }
    }

    return claims.slice(0, 8);
  }
}

/**
 * Runs the enrichment stages over an ingested item and records the outcome on
 * the item's signals and claim list.
 */
export class IngestionEnrichmentService {
  private readonly provider: IngestionEnrichmentProvider;

  constructor(
    private readonly db: DatabaseService,
    provider: IngestionEnrichmentProvider = new DeterministicEnrichmentProvider()
  ) {
    this.provider = provider;
  }

  get providerName(): string {
    return this.provider.name;
  }

  /**
   * Enriches a stored item and persists the result.
   *
   * Signals already present (feed defaults, cluster matches) are preserved and
   * merged with the detected ones. The item must already exist — the pipeline
   * stores it first and enriches it in the same step.
   */
  async enrichItem(item: IngestionItem): Promise<IngestionItem> {
    const context = await this.buildContext(item.organizationId);
    const text = [item.title, item.summary ?? '', item.contentText ?? ''].join('\n');

    const [detectedEntities, detectedTopics, claims] = await Promise.all([
      this.provider.extractEntities(text, context),
      this.provider.classifyTopics(text, context),
      this.provider.extractClaims(text, context),
    ]);

    const entityIds = Array.from(new Set([...(item.signals.entityIds ?? []), ...detectedEntities]));
    const topicIds = Array.from(new Set([...(item.signals.topicIds ?? []), ...detectedTopics]));

    const enriched: IngestionItem = {
      ...item,
      signals: {
        ...item.signals,
        entityIds,
        topicIds,
      },
      claimTexts: claims.length > 0 ? claims : item.claimTexts,
      updatedAt: new Date().toISOString(),
    };

    return this.db.ingestion.updateItem(enriched);
  }

  private async buildContext(organizationId: string): Promise<EnrichmentContext> {
    let entities: Entity[] = [];
    let topics: Topic[] = [];

    try {
      entities = await this.db.entities.list(organizationId);
    } catch {
      // Enrichment must never break ingestion.
    }

    try {
      topics = await this.db.topics.list(organizationId);
    } catch {
      // Enrichment must never break ingestion.
    }

    return { organizationId, entities, topics };
  }
}
