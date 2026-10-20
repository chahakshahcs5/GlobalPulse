import { createHash } from 'crypto';
import type {
  IngestionFeed,
  IngestionItem,
  IngestFeedResult,
  CreateIngestionFeedInput,
  PromoteIngestionItemInput,
  PromoteIngestionItemResult,
  BreakingNewsCandidate,
  Story,
  Source,
} from '@ai-news/schemas';
import { CreateIngestionFeedInputSchema, PromoteIngestionItemInputSchema } from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { ConflictError, generateId, NotFoundError, ValidationError } from '@ai-news/shared';
import { validateWebhookUrl } from './webhook.service';
import { StoryService } from './story.service';
import {
  IngestionEnrichmentProvider,
  IngestionEnrichmentService,
} from './ingestion-enrichment.service';
import type { IntelligenceContext } from './intelligence.service';

export interface RawFeedItem {
  externalId?: string;
  url: string;
  title: string;
  summary?: string;
  contentText?: string;
  author?: string;
  publishedAt?: string;
  raw?: Record<string, unknown>;
}

export interface IngestionOptions {
  /** Injectable fetch for tests and future proxy support. */
  fetchImpl?: typeof fetch;
  maxResponseBytes?: number;
  timeoutMs?: number;
  /** Pluggable enrichment provider (entity/topic/claim extraction). */
  enrichmentProvider?: IngestionEnrichmentProvider;
}

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 10_000;

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function firstTag(block: string, names: string[]): string | undefined {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
    if (match?.[1]) return decodeEntities(stripHtml(match[1]));
  }
  return undefined;
}

function atomLink(block: string): string | undefined {
  const alternate = block.match(
    /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i
  );
  if (alternate?.[1]) return decodeEntities(alternate[1]);
  const href = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (href?.[1]) return decodeEntities(href[1]);
  return firstTag(block, ['link']);
}

function parseRss(xml: string): RawFeedItem[] {
  const blocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  return blocks
    .map((block) => {
      const title = firstTag(block, ['title']);
      const url = firstTag(block, ['link', 'guid']);
      if (!title || !url) return null;
      return {
        externalId: firstTag(block, ['guid', 'link']),
        url,
        title,
        summary: firstTag(block, ['description']),
        contentText: firstTag(block, ['content:encoded']),
        author: firstTag(block, ['author', 'dc:creator']),
        publishedAt: firstTag(block, ['pubDate', 'published']),
      } satisfies RawFeedItem;
    })
    .filter((v): v is Exclude<typeof v, null> => v !== null);
}

function parseAtom(xml: string): RawFeedItem[] {
  const blocks = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  return blocks
    .map((block) => {
      const title = firstTag(block, ['title']);
      const url = atomLink(block);
      if (!title || !url) return null;
      return {
        externalId: firstTag(block, ['id']),
        url,
        title,
        summary: firstTag(block, ['summary']),
        contentText: firstTag(block, ['content']),
        author: firstTag(block, ['name', 'author']),
        publishedAt: firstTag(block, ['published', 'updated']),
      } satisfies RawFeedItem;
    })
    .filter((v): v is Exclude<typeof v, null> => v !== null);
}

function parseJsonFeed(body: string): RawFeedItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new ValidationError('Feed body is not valid JSON.');
  }
  const root = parsed as Record<string, unknown>;
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(root.items)
      ? root.items
      : Array.isArray(root.articles)
        ? root.articles
        : Array.isArray(root.data)
          ? root.data
          : [];
  return list
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const url = String(item.url ?? item.link ?? item.href ?? '');
      const title = String(item.title ?? item.headline ?? '');
      if (!url || !title) return null;
      return {
        externalId: item.id ? String(item.id) : undefined,
        url,
        title,
        summary: item.summary ? String(item.summary) : undefined,
        contentText: item.content ? String(item.content) : undefined,
        author:
          typeof item.author === 'string'
            ? item.author
            : item.author && typeof item.author === 'object'
              ? String((item.author as Record<string, unknown>).name ?? '')
              : undefined,
        publishedAt: item.publishedAt
          ? String(item.publishedAt)
          : item.published_at
            ? String(item.published_at)
            : undefined,
        raw: item,
      } satisfies RawFeedItem;
    })
    .filter((v): v is Exclude<typeof v, null> => v !== null);
}

export function parseFeedBody(
  body: string,
  type: IngestionFeed['type'],
  contentType?: string
): RawFeedItem[] {
  if (type === 'json_api' || (contentType || '').includes('json')) {
    return parseJsonFeed(body);
  }
  if (type === 'webhook') {
    return parseJsonFeed(body);
  }
  if (type === 'atom' || /<feed\b/i.test(body)) {
    return parseAtom(body);
  }
  return parseRss(body);
}

function canonicalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function dedupeHash(url: string, title: string): string {
  return createHash('sha256')
    .update(`${canonicalizeUrl(url)}\n${title.trim().toLowerCase()}`)
    .digest('hex');
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

function titleSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let overlap = 0;
  for (const token of setA) if (setB.has(token)) overlap++;
  return overlap / Math.min(setA.size, setB.size);
}

function normalizeDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * RSS/Atom/JSON ingestion with deterministic deduplication and breaking-news
 * candidate detection. No LLM is required: extraction is explicit and every
 * inference is expressed as structured signals plus a methodology string.
 */
export class IngestionService {
  private readonly fetchImpl: typeof fetch;
  private readonly maxResponseBytes: number;
  private readonly timeoutMs: number;
  private readonly storyService: StoryService;
  private readonly enrichment: IngestionEnrichmentService;

  constructor(
    private readonly db: DatabaseService,
    options: IngestionOptions = {}
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_BYTES;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.storyService = new StoryService(db);
    this.enrichment = new IngestionEnrichmentService(db, options.enrichmentProvider);
  }

  // --- Feeds ----------------------------------------------------------------

  async listFeeds(orgId: string): Promise<IngestionFeed[]> {
    return this.db.ingestion.listFeeds(orgId);
  }

  async getFeed(id: string, orgId: string): Promise<IngestionFeed> {
    const feed = await this.db.ingestion.findFeedById(id, orgId);
    if (!feed) throw new NotFoundError('IngestionFeed', id);
    return feed;
  }

  async createFeed(
    input: CreateIngestionFeedInput,
    ctx: IntelligenceContext
  ): Promise<IngestionFeed> {
    const validated = CreateIngestionFeedInputSchema.parse(input);
    this.assertSafeUrl(validated.url);
    if (await this.db.ingestion.findFeedByUrl(validated.url, ctx.organizationId)) {
      throw new ConflictError('An ingestion feed with this URL already exists.');
    }
    const now = new Date().toISOString();
    const feed: IngestionFeed = {
      id: generateId('fd'),
      organizationId: ctx.organizationId,
      name: validated.name,
      url: validated.url,
      type: validated.type,
      active: validated.active,
      defaultTopicIds: validated.defaultTopicIds,
      defaultEntityIds: validated.defaultEntityIds,
      defaultSourceType: validated.defaultSourceType,
      fetchIntervalMinutes: validated.fetchIntervalMinutes,
      createdBy: ctx.actorId,
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.db.ingestion.createFeed(feed);
    await this.audit(ctx, 'create_ingestion_feed', created.id, { url: created.url });
    return created;
  }

  async updateFeed(
    id: string,
    input: Partial<CreateIngestionFeedInput> & { active?: boolean },
    ctx: IntelligenceContext
  ): Promise<IngestionFeed> {
    const existing = await this.getFeed(id, ctx.organizationId);
    if (input.url && input.url !== existing.url) this.assertSafeUrl(input.url);
    const updated: IngestionFeed = {
      ...existing,
      name: input.name ?? existing.name,
      url: input.url ?? existing.url,
      type: input.type ?? existing.type,
      active: input.active ?? existing.active,
      defaultTopicIds: input.defaultTopicIds ?? existing.defaultTopicIds,
      defaultEntityIds: input.defaultEntityIds ?? existing.defaultEntityIds,
      defaultSourceType: input.defaultSourceType ?? existing.defaultSourceType,
      fetchIntervalMinutes: input.fetchIntervalMinutes ?? existing.fetchIntervalMinutes,
      updatedAt: new Date().toISOString(),
    };
    const saved = await this.db.ingestion.updateFeed(updated);
    await this.audit(ctx, 'update_ingestion_feed', saved.id);
    return saved;
  }

  async deleteFeed(id: string, ctx: IntelligenceContext): Promise<void> {
    await this.getFeed(id, ctx.organizationId);
    await this.db.ingestion.deleteFeed(id, ctx.organizationId);
    await this.audit(ctx, 'delete_ingestion_feed', id);
  }

  private assertSafeUrl(rawUrl: string): void {
    const check = validateWebhookUrl(rawUrl);
    if (!check.valid) {
      throw new ValidationError(
        `Unsafe feed URL: ${check.reason ?? 'destination is not allowed'}.`
      );
    }
  }

  // --- Items ----------------------------------------------------------------

  async listItems(
    orgId: string,
    filter?: { feedId?: string; status?: string; query?: string; limit?: number; offset?: number }
  ): Promise<IngestionItem[]> {
    return this.db.ingestion.listItems(orgId, filter);
  }

  async getItem(id: string, orgId: string): Promise<IngestionItem> {
    const item = await this.db.ingestion.findItemById(id, orgId);
    if (!item) throw new NotFoundError('IngestionItem', id);
    return item;
  }

  async ingestFeed(feedId: string, ctx: IntelligenceContext): Promise<IngestFeedResult> {
    const feed = await this.getFeed(feedId, ctx.organizationId);
    if (!feed.active) {
      throw new ConflictError('Ingestion feed is inactive.');
    }
    this.assertSafeUrl(feed.url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let body: string;
    let contentType: string;
    try {
      const response = await this.fetchImpl(feed.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'GlobalPulse-Intelligence/1.0 (+https://globalpulse.example/feeds)',
          Accept:
            'application/rss+xml, application/atom+xml, application/json, application/xml, text/xml, */*',
          ...(feed.etag ? { 'If-None-Match': feed.etag } : {}),
          ...(feed.lastModified ? { 'If-Modified-Since': feed.lastModified } : {}),
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      if (response.status === 304) {
        const existing = await this.db.ingestion.listItems(ctx.organizationId, {
          feedId: feed.id,
          limit: 50,
        });
        return {
          feedId: feed.id,
          fetchedAt: new Date().toISOString(),
          fetched: 0,
          created: 0,
          duplicates: 0,
          clustered: 0,
          items: existing,
        };
      }
      if (!response.ok) {
        throw new ValidationError(`Feed fetch failed with HTTP ${response.status}.`);
      }
      const raw = await response.text();
      if (Buffer.byteLength(raw, 'utf8') > this.maxResponseBytes) {
        throw new ValidationError('Feed response exceeded the maximum allowed size.');
      }
      body = raw;
      contentType = response.headers.get('content-type') ?? '';
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      const failed: IngestionFeed = {
        ...feed,
        lastFetchedAt: new Date().toISOString(),
        lastStatus: `failed: ${message.slice(0, 200)}`,
        updatedAt: new Date().toISOString(),
      };
      await this.db.ingestion.updateFeed(failed);
      throw new ValidationError(`Unable to fetch feed: ${message}`);
    } finally {
      clearTimeout(timeout);
    }

    const rawItems = parseFeedBody(body, feed.type, contentType);
    const now = new Date().toISOString();
    const created: IngestionItem[] = [];
    let duplicates = 0;
    let clustered = 0;

    const existingStories = await this.db.stories.list({ limit: 200 }, ctx.organizationId);

    for (const raw of rawItems.slice(0, 200)) {
      const hash = dedupeHash(raw.url, raw.title);
      const existing = await this.db.ingestion.findItemByDedupeHash(ctx.organizationId, hash);
      if (existing) {
        duplicates++;
        continue;
      }

      const matched = this.matchStory(raw.title, existingStories);
      const signals = {
        entityIds: feed.defaultEntityIds,
        topicIds: feed.defaultTopicIds,
        similarityScore: matched?.score,
        matchedStoryId: matched?.story.id,
        matchedClusterId: undefined,
        independentSourceCount: 1,
        officialSource: /\.(gov|mil|int)(\/|$)/i.test(raw.url),
      };

      const item: IngestionItem = {
        id: generateId('ing'),
        organizationId: ctx.organizationId,
        feedId: feed.id,
        externalId: raw.externalId,
        url: raw.url,
        title: raw.title.slice(0, 500),
        summary: raw.summary?.slice(0, 10000),
        contentText: raw.contentText?.slice(0, 100000),
        author: raw.author?.slice(0, 300),
        publishedAt: normalizeDate(raw.publishedAt),
        retrievedAt: now,
        dedupeHash: hash,
        status: matched ? 'CLUSTERED' : 'NEW',
        signals,
        claimTexts: [],
        raw: raw.raw,
        createdAt: now,
        updatedAt: now,
      };
      const saved = await this.db.ingestion.createItem(item);
      // Enrichment stages: entity extraction, topic classification, and claim
      // extraction run on every new item (see INGESTION_PIPELINE_STAGES).
      const enriched = await this.enrichment.enrichItem(saved);
      created.push(enriched);
      if (matched) clustered++;
    }

    const updatedFeed: IngestionFeed = {
      ...feed,
      lastFetchedAt: now,
      lastStatus: `ok: ${created.length} new, ${duplicates} duplicates`,
      updatedAt: now,
    };
    await this.db.ingestion.updateFeed(updatedFeed);

    await this.audit(ctx, 'ingest_feed', feed.id, {
      fetched: rawItems.length,
      created: created.length,
      duplicates,
      clustered,
    });

    return {
      feedId: feed.id,
      fetchedAt: now,
      fetched: rawItems.length,
      created: created.length,
      duplicates,
      clustered,
      items: created,
    };
  }

  async ingestAll(ctx: IntelligenceContext): Promise<IngestFeedResult[]> {
    const feeds = await this.db.ingestion.listFeeds(ctx.organizationId, true);
    const results: IngestFeedResult[] = [];
    for (const feed of feeds) {
      try {
        results.push(await this.ingestFeed(feed.id, ctx));
      } catch {
        // A single failing feed must not stop the rest of the sweep.
      }
    }
    return results;
  }

  private matchStory(title: string, stories: Story[]): { story: Story; score: number } | null {
    let best: { story: Story; score: number } | null = null;
    for (const story of stories) {
      const score = titleSimilarity(title, story.title);
      if (score >= 0.6 && (!best || score > best.score)) {
        best = { story, score: Number(score.toFixed(3)) };
      }
    }
    return best;
  }

  /**
   * Promote an ingestion item into a registered source and, optionally, a draft
   * story. Promotion is idempotent because sources are keyed by URL.
   */
  async promoteItem(
    itemId: string,
    input: Omit<PromoteIngestionItemInput, 'itemId'>,
    ctx: IntelligenceContext
  ): Promise<PromoteIngestionItemResult> {
    const validated = PromoteIngestionItemInputSchema.parse({ ...input, itemId });
    const item = await this.getItem(itemId, ctx.organizationId);

    const domain = (() => {
      try {
        return new URL(item.url).hostname.replace(/^www\./, '');
      } catch {
        return 'unknown';
      }
    })();

    let source = await this.db.sources.findByUrl(item.url, ctx.organizationId);
    if (!source) {
      const now = new Date().toISOString();
      const newSource: Source = {
        id: generateId('src'),
        organizationId: ctx.organizationId,
        url: item.url,
        canonicalUrl: canonicalizeUrl(item.url),
        title: item.title,
        publisher: item.author || domain,
        domain,
        author: item.author,
        publishedAt: item.publishedAt,
        retrievedAt: item.retrievedAt,
        language: 'en',
        sourceType: 'NEWS_ARTICLE',
        createdAt: now,
        updatedAt: now,
      };
      source = await this.db.sources.create(newSource);
    }

    const promoted: IngestionItem = {
      ...item,
      status: 'PROMOTED',
      signals: {
        ...item.signals,
        topicIds: validated.topicIds.length ? validated.topicIds : item.signals.topicIds,
        entityIds: validated.entityIds.length ? validated.entityIds : item.signals.entityIds,
      },
      updatedAt: new Date().toISOString(),
    };
    const savedItem = await this.db.ingestion.updateItem(promoted);

    let story: Story | undefined;
    if (validated.createDraftStory) {
      try {
        story = await this.storyService.createStory(
          {
            title: item.title.slice(0, 300),
            summary: (item.summary || item.title).slice(0, 2000),
            articleType: 'developing_story',
            topicIds: savedItem.signals.topicIds,
            entityIds: savedItem.signals.entityIds,
            sourceIds: [source.id],
            blocks: [
              {
                id: generateId('blk'),
                blockType: 'paragraph',
                sortOrder: 0,
                data: {
                  text: (item.contentText || item.summary || item.title).slice(0, 40000),
                },
              },
            ],
            idempotencyKey: `ingestion:${item.id}`,
          },
          {
            organizationId: ctx.organizationId,
            authorId: ctx.actorId,
            clientType: ctx.clientType,
            createdVia: 'api',
            requestId: ctx.requestId,
          }
        );
      } catch {
        // Source promotion remains valid even if draft creation fails.
      }
    }

    await this.audit(ctx, 'promote_ingestion_item', item.id, {
      sourceId: source.id,
      storyId: story?.id,
    });

    return {
      item: savedItem,
      sourceId: source.id,
      storyId: story?.id,
      storySlug: story?.slug,
    };
  }

  // --- Breaking-news candidates --------------------------------------------

  /**
   * Detect candidate breaking stories using explicit, auditable signals:
   * shared event/entity, number of independent sources, and story velocity in
   * the lookback window. This is intentionally not an LLM judgment.
   */
  async detectBreakingCandidates(
    orgId: string,
    options: {
      windowHours?: number;
      minIndependentSources?: number;
      minStoryVelocity?: number;
      limit?: number;
    } = {}
  ): Promise<BreakingNewsCandidate[]> {
    const windowHours = Math.max(1, Math.min(168, options.windowHours ?? 6));
    const minSources = Math.max(1, options.minIndependentSources ?? 2);
    const minVelocity = Math.max(1, options.minStoryVelocity ?? 2);
    const since = Date.now() - windowHours * 3600_000;

    const stories = (await this.db.stories.list({ limit: 500 }, orgId)).filter(
      (story) => new Date(story.updatedAt).getTime() >= since
    );

    const groups = new Map<string, Story[]>();
    for (const story of stories) {
      const key = story.eventId
        ? `event:${story.eventId}`
        : story.entityIds.length > 0
          ? `entity:${story.entityIds[0]}`
          : undefined;
      if (!key) continue;
      const group = groups.get(key) ?? [];
      group.push(story);
      groups.set(key, group);
    }

    const candidates: BreakingNewsCandidate[] = [];
    for (const [key, group] of groups) {
      const sourceIds = Array.from(new Set(group.flatMap((s) => s.sourceIds)));
      const entityIds = Array.from(new Set(group.flatMap((s) => s.entityIds)));
      const independentSourceCount = sourceIds.length;
      const storyVelocity = group.length;
      if (independentSourceCount < minSources && storyVelocity < minVelocity) continue;

      const latest = group.reduce(
        (max, story) => (story.updatedAt > max ? story.updatedAt : max),
        group[0].updatedAt
      );
      const parent = group[0];
      const severity =
        independentSourceCount >= 4 || storyVelocity >= 4
          ? 'CRITICAL'
          : independentSourceCount >= 3 || storyVelocity >= 3
            ? 'MAJOR'
            : 'MODERATE';

      candidates.push({
        id: generateId('brk'),
        organizationId: orgId,
        title: parent.title,
        summary: parent.summary,
        eventId: parent.eventId,
        storyIds: group.map((s) => s.id),
        sourceIds,
        independentSourceCount,
        storyVelocity,
        entityIds,
        severity,
        lastUpdatedAt: latest,
        confidenceMethodology: `Within ${windowHours}h: ${storyVelocity} related stories, ${independentSourceCount} independent registered sources grouped by ${key}.`,
        reviewStatus: 'CANDIDATE',
      });
    }

    return candidates
      .sort(
        (a, b) =>
          severityRank(b.severity) - severityRank(a.severity) || b.storyVelocity - a.storyVelocity
      )
      .slice(0, options.limit ?? 20);
  }

  private async audit(
    ctx: IntelligenceContext,
    action: string,
    resourceId: string,
    payloadSummary?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.db.audit.log({
        id: generateId('aud'),
        organizationId: ctx.organizationId,
        userId: ctx.actorId,
        clientType: ctx.clientType,
        action: `${ctx.clientType}.${action}`,
        resourceType: 'ingestion',
        resourceId,
        payloadSummary,
        requestId: ctx.requestId,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
    } catch {
      // non-blocking
    }
  }
}

function severityRank(value: string): number {
  switch (value.toUpperCase()) {
    case 'CRITICAL':
      return 4;
    case 'MAJOR':
    case 'HIGH':
    case 'URGENT':
      return 3;
    case 'MODERATE':
    case 'MEDIUM':
      return 2;
    default:
      return 1;
  }
}
