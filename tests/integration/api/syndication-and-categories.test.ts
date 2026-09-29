import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';

describe('Syndication Feeds & Category Taxonomy Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    // Ensure at least one published story exists in technology
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/stories',
      headers: { authorization: 'Bearer dev-admin' },
      payload: {
        title: 'Commercial Fusion Reactor Achieves Sustained High-Beta Plasma',
        summary: 'Magnetohydrodynamic stability demonstrated for ninety consecutive minutes.',
        articleType: 'technology',
        blocks: [
          {
            id: 'blk_fus_01',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'Diagnostic sensors confirmed peak temperature stability.',
              format: 'markdown',
            },
          },
        ],
      },
    });
    const story = JSON.parse(createRes.body);

    await app.inject({
      method: 'POST',
      url: `/api/stories/${story.id}/publish`,
      headers: { authorization: 'Bearer dev-editor' },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Dynamic Categories Taxonomy', () => {
    it('returns canonical categories with story counts on GET /api/categories', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/categories',
        headers: { authorization: 'Bearer dev-reader' },
      });
      expect(res.statusCode).toBe(200);
      const categories = JSON.parse(res.body);
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThanOrEqual(8);
      const tech = categories.find((c: { slug: string }) => c.slug === 'technology');
      expect(tech).toBeDefined();
      expect(tech.name).toBe('Technology');
      expect(tech.storyCount).toBeGreaterThanOrEqual(1);
    });

    it('returns stories for a category on GET /api/categories/:slug/stories', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/categories/technology/stories',
        headers: { authorization: 'Bearer dev-reader' },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('Syndication & Feeds (RSS 2.0, Atom 1.0, Sitemap)', () => {
    it('serves valid RSS 2.0 XML feed on GET /rss.xml', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/rss.xml',
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/rss+xml');
      expect(res.body).toContain('<rss version="2.0"');
      expect(res.body).toContain('<channel>');
      expect(res.body).toContain('GlobalPulse News');
    });

    it('serves valid Atom 1.0 feed on GET /atom.xml', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/atom.xml',
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/atom+xml');
      expect(res.body).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    });

    it('serves category RSS feed on GET /feeds/:category/rss.xml', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/feeds/technology/rss.xml',
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/rss+xml');
      expect(res.body).toContain('GlobalPulse News — TECHNOLOGY');
    });

    it('serves standard XML sitemap on GET /sitemap.xml', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/sitemap.xml',
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(res.body).toContain('<loc>');
    });
  });
});
