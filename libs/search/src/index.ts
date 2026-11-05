import type {
  SearchStoriesInput,
  StorySearchResultItem,
  FindSimilarStoriesInput,
  Event,
  Topic,
  Entity,
  Source,
} from '@ai-news/schemas';
import { CANONICAL_CATEGORIES } from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import type { PaginatedResult } from '@ai-news/shared';
import { cosineSimilarity, generateSemanticEmbedding, tokenizeForEmbedding } from '@ai-news/shared';

export interface SearchSuggestionItem {
  text: string;
  type: 'story' | 'topic' | 'entity' | 'category';
  id?: string;
  score: number;
}

export class SearchService {
  constructor(private readonly db: DatabaseService) {}

  async searchStories(
    params: SearchStoriesInput,
    orgId: string
  ): Promise<PaginatedResult<StorySearchResultItem>> {
    return this.db.stories.search(params, orgId);
  }

  async findSimilarStories(
    params: FindSimilarStoriesInput,
    orgId: string
  ): Promise<StorySearchResultItem[]> {
    /*
     * Prefer persisted embeddings: they are generated once per story version
     * by the indexing worker, so a similarity query does not have to re-embed
     * the whole corpus. Fall back to the repository's lexical matcher when no
     * story has been indexed yet.
     */
    const stored = await this.db.storyEmbeddings.listByOrganization(orgId);
    if (stored.length > 0) {
      const latestByStory = new Map<string, (typeof stored)[number]>();
      for (const record of stored) {
        const current = latestByStory.get(record.storyId);
        if (!current || current.versionNumber < record.versionNumber) {
          latestByStory.set(record.storyId, record);
        }
      }

      const queryTokens = tokenizeForEmbedding(`${params.title} ${params.summary || ''}`);
      const queryEmbedding = generateSemanticEmbedding(queryTokens);
      const threshold = Math.min(params.threshold ?? 0.7, 0.2);

      const scored: Array<{ storyId: string; score: number }> = [];
      for (const record of latestByStory.values()) {
        const score = cosineSimilarity(queryEmbedding, record.embedding);
        if (score >= threshold) scored.push({ storyId: record.storyId, score });
      }
      scored.sort((a, b) => b.score - a.score);

      const results: StorySearchResultItem[] = [];
      for (const { storyId, score } of scored.slice(0, (params.limit || 5) * 2)) {
        const story = await this.db.stories.findById(storyId, orgId);
        if (!story || story.status !== 'PUBLISHED') continue;
        results.push({
          storyId: story.id,
          title: story.title,
          summary: story.summary,
          status: story.status,
          articleType: story.articleType,
          currentVersionNumber: story.currentVersionNumber,
          publishedAt: story.publishedAt,
          updatedAt: story.updatedAt,
          topicIds: story.topicIds || [],
          entityIds: story.entityIds || [],
          sourceCount: (story.sourceIds || []).length,
          similarityScore: score,
        });
        if (results.length >= (params.limit || 5)) break;
      }

      if (results.length > 0) return results;
    }

    return this.db.stories.findSimilar(params, orgId);
  }

  async searchEvents(query: string, orgId: string): Promise<Event[]> {
    return this.db.events.search(query, orgId);
  }

  async searchTopics(query: string, orgId: string): Promise<Topic[]> {
    return this.db.topics.search(query, orgId);
  }

  async searchEntities(query: string, orgId: string): Promise<Entity[]> {
    return this.db.entities.search(query, orgId);
  }

  async searchSources(query: string, orgId: string): Promise<Source[]> {
    return this.db.sources.search(query, orgId);
  }

  /**
   * F3: Full-Text Search Autocomplete & Instant Suggestions
   * Aggregates matching categories, topics, entities, and headlines.
   */
  async getSuggestions(
    query: string,
    orgId: string = 'org_default',
    limit: number = 8
  ): Promise<SearchSuggestionItem[]> {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];

    const suggestions: SearchSuggestionItem[] = [];
    const seenTexts = new Set<string>();

    const addSuggestion = (item: SearchSuggestionItem) => {
      const key = `${item.type}:${item.text.toLowerCase()}`;
      if (!seenTexts.has(key)) {
        seenTexts.add(key);
        suggestions.push(item);
      }
    };

    // 1. Categories
    for (const cat of CANONICAL_CATEGORIES) {
      if (cat.name.toLowerCase().startsWith(q)) {
        addSuggestion({ text: cat.name, type: 'category', id: cat.slug, score: 100 });
      } else if (cat.name.toLowerCase().includes(q)) {
        addSuggestion({ text: cat.name, type: 'category', id: cat.slug, score: 80 });
      }
    }

    // 2. Topics, Entities, and Stories via parallel DB queries (resilient with Promise.allSettled)
    const [topicsRes, entitiesRes, storiesRes] = await Promise.allSettled([
      this.db.topics.search(q, orgId),
      this.db.entities.search(q, orgId),
      this.db.stories.search({ query: q, status: 'PUBLISHED', limit: 10 }, orgId),
    ]);

    const topics = topicsRes.status === 'fulfilled' ? topicsRes.value : [];
    const entities = entitiesRes.status === 'fulfilled' ? entitiesRes.value : [];
    const storyResults = storiesRes.status === 'fulfilled' ? storiesRes.value : { items: [] };

    for (const t of topics) {
      const isPrefix = t.name.toLowerCase().startsWith(q);
      addSuggestion({
        text: t.name,
        type: 'topic',
        id: t.id,
        score: isPrefix ? 95 : 75,
      });
    }

    for (const e of entities) {
      const isPrefix = e.name.toLowerCase().startsWith(q);
      addSuggestion({
        text: e.name,
        type: 'entity',
        id: e.id,
        score: isPrefix ? 90 : 70,
      });
    }

    for (const s of storyResults.items) {
      const isPrefix = s.title.toLowerCase().startsWith(q);
      addSuggestion({
        text: s.title,
        type: 'story',
        id: s.storyId,
        score: isPrefix ? 85 : 65,
      });
    }

    // Sort by score descending
    suggestions.sort((a, b) => b.score - a.score);

    return suggestions.slice(0, limit);
  }
}
