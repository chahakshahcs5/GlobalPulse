import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { db } from '@ai-news/database';

/**
 * Integration tests for the syndication surface previously lacking coverage:
 * the root RSS 2.0 feed, per-category and per-topic RSS feeds, and sitemap.xml.
 * (The Atom feed is covered by tests/unit/discovery/syndication-and-reading-metrics.)
 */
describe('Feed Generation — RSS Feeds & Sitemap Integration', () => {
  let app: FastifyInstance;

  const now = new Date().toISOString();

  const seedStory = (overrides: Partial<Record<string, unknown>> = {}) =>
    db.stories.create({
      id: `sty_feed_${Math.random().toString(36).slice(2, 8)}`,
      organizationId: 'org_default',
      slug: 'tech-dispatch-feed-test',
      title: 'Technology Dispatch <Encodes> & "Quotes"',
      summary: 'Summary with special characters — em dash, ümlaut, and %signs.',
      status: 'PUBLISHED',
      articleType: 'analysis',
      authorId: 'usr_editor',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      topicIds: ['top_technology'],
      entityIds: [],
      sourceIds: [],
      blocks: [],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    } as never);

  beforeEach(async () => {
    db.clear();
    app = buildServer({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the root RSS 2.0 feed with items, media enclosures, and escaped XML', async () => {
    await seedStory({
      slug: 'hero-story',
      title: 'Hero Story & Special <Characters>',
      heroImageUrl: 'https://cdn.example.com/hero.jpg',
    });
    await seedStory({ slug: 'plain-story', heroImageUrl: undefined });

    const res = await app.inject({ method: 'GET', url: '/api/feeds/rss' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/rss+xml');

    const xml = res.body;
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<item>');
    expect(xml).toContain('Hero Story &amp; Special &lt;Characters&gt;');
    expect(xml).toContain('/stories/hero-story');
    expect(xml).toContain('<enclosure url="https://cdn.example.com/hero.jpg"');
    expect(xml).toContain('<guid isPermaLink="true">');
    expect(xml).toContain('<language>en-us</language>');
    // Special characters must never appear raw in XML
    expect(xml).not.toContain('Special <Characters>');
  });

  it('serves the category RSS feed filtered by article type or topic', async () => {
    await seedStory({ slug: 'tech-analysis', topicIds: ['top_technology'] });
    await seedStory({
      slug: 'sports-story',
      articleType: 'breaking_news',
      topicIds: ['top_sports'],
    });

    const res = await app.inject({ method: 'GET', url: '/api/feeds/category/technology' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/rss+xml');

    const xml = res.body;
    expect(xml).toContain('TECHNOLOGY');
    expect(xml).toContain('/stories/tech-analysis');
    expect(xml).not.toContain('/stories/sports-story');
  });

  it('returns an empty but valid channel for categories without coverage', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/feeds/category/underwater-weaving' });
    expect(res.statusCode).toBe(200);
    const xml = res.body;
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<channel>');
    expect(xml).not.toContain('<item>');
  });

  it('serves topic RSS feeds scoped to a single topic id', async () => {
    await seedStory({ slug: 'topic-match', topicIds: ['top_global_trade'] });
    await seedStory({ slug: 'topic-other', topicIds: ['top_ai_policy'] });

    const res = await app.inject({ method: 'GET', url: '/api/feeds/topics/top_global_trade' });
    expect(res.statusCode).toBe(200);
    const xml = res.body;
    expect(xml).toContain('Topic: top_global_trade');
    expect(xml).toContain('/stories/topic-match');
    expect(xml).not.toContain('/stories/topic-other');
  });

  it('serves sitemap.xml with static routes, canonical categories, and story URLs', async () => {
    await seedStory({ slug: 'sitemap-story' });

    const res = await app.inject({ method: 'GET', url: '/api/sitemap.xml' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('xml');

    const xml = res.body;
    expect(xml).toContain('<urlset');
    expect(xml).toContain('<loc>');
    expect(xml).toContain('/stories/sitemap-story');
    expect(xml).toContain('/category/');
    expect(xml).toContain('<changefreq>');
    expect(xml).toContain('<priority>');
  });

  it('reflects publication lifecycle: only PUBLISHED stories reach the feeds', async () => {
    await seedStory({ slug: 'published-yes' });
    await seedStory({ slug: 'draft-invisible', status: 'DRAFT' } as never);

    const res = await app.inject({ method: 'GET', url: '/api/feeds/rss' });
    const xml = res.body;
    expect(xml).toContain('/stories/published-yes');
    expect(xml).not.toContain('/stories/draft-invisible');
  });
});
