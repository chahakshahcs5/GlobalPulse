import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../../../apps/api/src/server';
import { FastifyInstance } from 'fastify';
import { db } from '@ai-news/database';

describe('Dynamic Categories & Header Navigation Tabs API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildServer({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/categories', () => {
    it('returns categories dynamically from the database', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/categories',
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const worldCategory = data.find((c: { slug: string }) => c.slug === 'world');
      expect(worldCategory).toBeDefined();
      expect(worldCategory.name).toBe('World');
      expect(typeof worldCategory.storyCount).toBe('number');
    });

    it('reflects new categories inserted into the database', async () => {
      await db.categories.create({
        slug: 'artificial-intelligence',
        code: 'artificial_intelligence',
        name: 'Artificial Intelligence',
        description: 'Frontier AI models, research, and industry developments',
        icon: 'Cpu',
        sortOrder: 99,
        storyCount: 0,
        isPinned: false,
        subCategories: ['LLMs', 'Robotics'],
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/categories',
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      const aiCat = data.find((c: { slug: string }) => c.slug === 'artificial-intelligence');
      expect(aiCat).toBeDefined();
      expect(aiCat.name).toBe('Artificial Intelligence');
      expect(aiCat.sortOrder).toBe(99);
    });
  });

  describe('GET /api/navigation/tabs', () => {
    it('returns navigation header tabs dynamically from the database', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/navigation/tabs',
      });

      expect(res.statusCode).toBe(200);
      const tabs = JSON.parse(res.body);
      expect(Array.isArray(tabs)).toBe(true);
      expect(tabs.length).toBeGreaterThan(0);

      const topStories = tabs.find((t: { tabId: string }) => t.tabId === 'top');
      expect(topStories).toBeDefined();
      expect(topStories.name).toBe('Top Stories');
      expect(topStories.href).toBe('/');

      const tipLine = tabs.find((t: { tabId: string }) => t.tabId === 'tips');
      expect(tipLine).toBeDefined();
      expect(tipLine.name).toBe('Tip Line');
    });

    it('dynamically serves new header tabs created in the database', async () => {
      await db.navTabs.create({
        tabId: 'live-streams',
        name: 'Live Streams',
        href: '/live',
        icon: 'Radio',
        sortOrder: 15,
        active: true,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/navigation/tabs',
      });

      expect(res.statusCode).toBe(200);
      const tabs = JSON.parse(res.body);
      const liveTab = tabs.find((t: { tabId: string }) => t.tabId === 'live-streams');
      expect(liveTab).toBeDefined();
      expect(liveTab.name).toBe('Live Streams');
      expect(liveTab.icon).toBe('Radio');
    });
  });
});
