import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { IngestionService, parseFeedBody, StoryService } from '@ai-news/stories';
import { ValidationError } from '@ai-news/shared';

const ORG = 'org_ingest_test';
const OTHER_ORG = 'org_ingest_other';

const RSS_BODY = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Example Wire</title>
  <item>
    <title>Central bank holds rates steady</title>
    <link>https://news.example.com/markets/rates-held</link>
    <guid>ex-1</guid>
    <description>The policy committee voted to hold rates.</description>
    <pubDate>Mon, 20 Oct 2026 09:00:00 GMT</pubDate>
  </item>
</channel></rss>`;

const ATOM_BODY = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Regulator opens consultation</title>
    <link rel="alternate" href="https://news.example.com/policy/consultation" />
    <id>ex-2</id>
    <summary>Public consultation opens today.</summary>
    <updated>2026-10-20T10:00:00Z</updated>
  </entry>
</feed>`;

const JSON_BODY = JSON.stringify({
  items: [
    {
      id: 'ex-3',
      url: 'https://api.example.com/story/1',
      title: 'Rail strike halts services',
      summary: 'Services suspended on key routes.',
      published_at: '2026-10-20T11:00:00Z',
    },
  ],
});

function jsonResponse(body: string, contentType = 'application/json'): Response {
  return {
    ok: true,
    status: 200,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null),
    },
    text: async () => body,
  } as unknown as Response;
}

describe('Ingestion Service (feeds, dedupe, promotion, breaking news)', () => {
  let db: DatabaseService;
  let stories: StoryService;

  const ctx = {
    organizationId: ORG,
    actorId: 'usr_ingest',
    clientType: 'custom_mcp' as const,
  };

  beforeEach(() => {
    db = new DatabaseService();
    stories = new StoryService(db);
  });

  describe('feed parsing', () => {
    it('parses RSS items', () => {
      const items = parseFeedBody(RSS_BODY, 'rss');
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Central bank holds rates steady');
      expect(items[0].url).toBe('https://news.example.com/markets/rates-held');
      expect(items[0].summary).toContain('policy committee');
    });

    it('parses Atom entries', () => {
      const items = parseFeedBody(ATOM_BODY, 'atom');
      expect(items).toHaveLength(1);
      expect(items[0].url).toBe('https://news.example.com/policy/consultation');
      expect(items[0].title).toBe('Regulator opens consultation');
    });

    it('parses JSON feeds', () => {
      const items = parseFeedBody(JSON_BODY, 'json_api');
      expect(items).toHaveLength(1);
      expect(items[0].url).toBe('https://api.example.com/story/1');
      expect(items[0].title).toBe('Rail strike halts services');
    });

    it('rejects malformed JSON feeds', () => {
      expect(() => parseFeedBody('{not json', 'json_api')).toThrow(ValidationError);
    });
  });

  describe('feed registration', () => {
    it('rejects unsafe feed URLs (SSRF guard)', async () => {
      const service = new IngestionService(db);
      await expect(
        service.createFeed({ name: 'Local', url: 'http://127.0.0.1:8080/feed.xml' }, ctx)
      ).rejects.toBeInstanceOf(ValidationError);

      await expect(
        service.createFeed({ name: 'Localhost', url: 'http://localhost:3000/feed.json' }, ctx)
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('registers a feed and rejects duplicate URLs', async () => {
      const service = new IngestionService(db);
      const feed = await service.createFeed(
        { name: 'Example Wire', url: 'https://news.example.com/rss' },
        ctx
      );

      expect(feed.id).toMatch(/^fd_/);
      expect(feed.type).toBe('rss');
      expect(feed.fetchIntervalMinutes).toBe(15);
      expect(await service.listFeeds(ORG)).toHaveLength(1);
      expect(await service.listFeeds(OTHER_ORG)).toHaveLength(0);

      await expect(
        service.createFeed({ name: 'Duplicate', url: 'https://news.example.com/rss' }, ctx)
      ).rejects.toThrow();
    });
  });

  describe('ingestion', () => {
    it('fetches, stores and deduplicates feed items', async () => {
      const service = new IngestionService(db, {
        fetchImpl: async () => jsonResponse(RSS_BODY, 'application/rss+xml'),
      });
      const feed = await service.createFeed(
        { name: 'Example Wire', url: 'https://news.example.com/rss' },
        ctx
      );

      const first = await service.ingestFeed(feed.id, ctx);
      expect(first.fetched).toBe(1);
      expect(first.created).toBe(1);
      expect(first.duplicates).toBe(0);
      expect(first.items[0].title).toBe('Central bank holds rates steady');
      expect(first.items[0].status).toBe('NEW');

      const second = await service.ingestFeed(feed.id, ctx);
      expect(second.fetched).toBe(1);
      expect(second.created).toBe(0);
      expect(second.duplicates).toBe(1);

      const items = await service.listItems(ORG, { feedId: feed.id });
      expect(items).toHaveLength(1);
    });

    it('clusters items that match an existing story', async () => {
      await stories.createStory(
        {
          title: 'Central bank holds rates steady',
          summary: 'The policy committee voted to hold rates steady today.',
        },
        {
          organizationId: ORG,
          authorId: 'usr_reporter',
          clientType: 'human_web',
          createdVia: 'api',
        }
      );

      const service = new IngestionService(db, {
        fetchImpl: async () => jsonResponse(RSS_BODY, 'application/rss+xml'),
      });
      const feed = await service.createFeed(
        { name: 'Example Wire', url: 'https://news.example.com/rss' },
        ctx
      );

      const result = await service.ingestFeed(feed.id, ctx);
      expect(result.clustered).toBe(1);
      expect(result.items[0].status).toBe('CLUSTERED');
      expect(result.items[0].signals.matchedStoryId).toBeTruthy();
      expect(result.items[0].signals.similarityScore).toBeGreaterThan(0);
    });

    it('rejects oversized feed responses', async () => {
      const service = new IngestionService(db, {
        fetchImpl: async () => jsonResponse('x'.repeat(5000)),
        maxResponseBytes: 100,
      });
      const feed = await service.createFeed(
        { name: 'Big', url: 'https://news.example.com/big' },
        ctx
      );

      await expect(service.ingestFeed(feed.id, ctx)).rejects.toBeInstanceOf(ValidationError);
    });

    it('surfaces HTTP failures without storing items', async () => {
      const service = new IngestionService(db, {
        fetchImpl: async () =>
          ({
            ok: false,
            status: 500,
            headers: { get: () => 'text/plain' },
            text: async () => 'boom',
          }) as unknown as Response,
      });
      const feed = await service.createFeed(
        { name: 'Broken', url: 'https://news.example.com/broken' },
        ctx
      );

      await expect(service.ingestFeed(feed.id, ctx)).rejects.toBeInstanceOf(ValidationError);
      expect(await service.listItems(ORG)).toHaveLength(0);
    });
  });

  describe('promotion', () => {
    it('promotes an item into a source and an optional draft story', async () => {
      const service = new IngestionService(db, {
        fetchImpl: async () => jsonResponse(RSS_BODY, 'application/rss+xml'),
      });
      const feed = await service.createFeed(
        { name: 'Example Wire', url: 'https://news.example.com/rss' },
        ctx
      );
      const result = await service.ingestFeed(feed.id, ctx);
      const item = result.items[0];

      const promoted = await service.promoteItem(
        item.id,
        { createDraftStory: true, topicIds: ['top_markets'] },
        ctx
      );

      expect(promoted.item.status).toBe('PROMOTED');
      expect(promoted.sourceId).toBeTruthy();
      expect(promoted.storyId).toBeTruthy();
      expect(promoted.item.signals.topicIds).toEqual(['top_markets']);

      const source = await db.sources.findById(promoted.sourceId, ORG);
      expect(source?.url).toBe('https://news.example.com/markets/rates-held');

      const story = await db.stories.findById(promoted.storyId!, ORG);
      expect(story?.status).toBe('DRAFT');
      expect(story?.sourceIds).toContain(promoted.sourceId);
    });

    it('is idempotent across repeated promotions', async () => {
      const service = new IngestionService(db, {
        fetchImpl: async () => jsonResponse(RSS_BODY, 'application/rss+xml'),
      });
      const feed = await service.createFeed(
        { name: 'Example Wire', url: 'https://news.example.com/rss' },
        ctx
      );
      const result = await service.ingestFeed(feed.id, ctx);
      const item = result.items[0];

      const first = await service.promoteItem(item.id, {}, ctx);
      const second = await service.promoteItem(item.id, {}, ctx);

      expect(second.sourceId).toBe(first.sourceId);
      const sources = await db.sources.list(ORG);
      expect(sources).toHaveLength(1);
    });
  });

  describe('breaking news candidates', () => {
    it('reports candidates that share an event and have multiple sources', async () => {
      const sharedEvent = 'evt_shared';
      for (const index of [1, 2]) {
        const source = await db.sources.create({
          id: `src_${index}`,
          organizationId: ORG,
          url: `https://news.example.com/story/${index}`,
          title: `Story ${index}`,
          publisher: 'Example Wire',
          retrievedAt: new Date().toISOString(),
          language: 'en',
          sourceType: 'NEWS_ARTICLE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await stories.createStory(
          {
            title: `Breaking development ${index}`,
            summary: 'A developing story.',
            eventId: sharedEvent,
            sourceIds: [source.id],
          },
          {
            organizationId: ORG,
            authorId: 'usr_reporter',
            clientType: 'human_web',
            createdVia: 'api',
          }
        );
      }

      const service = new IngestionService(db);
      const candidates = await service.detectBreakingCandidates(ORG, {
        minIndependentSources: 2,
        minStoryVelocity: 2,
      });

      expect(candidates.length).toBeGreaterThanOrEqual(1);
      const candidate = candidates[0];
      expect(candidate.eventId).toBe(sharedEvent);
      expect(candidate.storyIds.length).toBe(2);
      expect(candidate.independentSourceCount).toBe(2);
      expect(candidate.confidenceMethodology).toBeTruthy();
      expect(candidate.reviewStatus).toBe('CANDIDATE');
    });
  });
});
