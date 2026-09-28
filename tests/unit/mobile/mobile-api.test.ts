import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileApi, mapApiStoryToOffline } from '../../../apps/mobile/src/services/api';
import { offlineStorage, type OfflineStory } from '../../../apps/mobile/src/services/storage';
import type { Story } from '@ai-news/schemas';

const mockTestStory: OfflineStory = {
  id: 'sty_test_brics',
  slug: 'brics-expansion-2026',
  title: 'BRICS Expansion 2026: Historic Geoeconomic Shift',
  summary: 'Four new member nations formally inducted.',
  articleType: 'breaking',
  currentVersionNumber: 2,
  savedAt: new Date().toISOString(),
  readStatus: false,
  blocks: [],
};

describe('MobileApiService Unit Tests', () => {
  beforeEach(() => {
    offlineStorage.clearAll();
    vi.restoreAllMocks();
  });

  it('maps API Story payload accurately to OfflineStory structure', () => {
    const apiStory: Partial<Story> & { id: string; title: string } = {
      id: 'sty_live_123',
      slug: 'live-breakthrough-2026',
      title: 'Global Tech Accord Signed',
      summary: 'Nations establish open standards.',
      articleType: 'technology',
      heroImageUrl: 'https://images.unsplash.com/photo-test',
      currentVersionNumber: 3,
      publishedAt: '2026-03-15T10:00:00.000Z',
      blocks: [
        {
          id: 'b1',
          blockType: 'heading',
          sortOrder: 0,
          data: { level: 2, text: 'Consensus Reached' },
        },
      ],
    };

    const mapped = mapApiStoryToOffline(apiStory);
    expect(mapped.id).toBe('sty_live_123');
    expect(mapped.slug).toBe('live-breakthrough-2026');
    expect(mapped.title).toBe('Global Tech Accord Signed');
    expect(mapped.articleType).toBe('technology');
    expect(mapped.heroImageUrl).toBe('https://images.unsplash.com/photo-test');
    expect(mapped.currentVersionNumber).toBe(3);
    expect(mapped.blocks).toHaveLength(1);
    expect(mapped.readStatus).toBe(false);
  });

  it('fetches live stories from API gateway and caches them locally into offlineStorage', async () => {
    const mockApiResponse = {
      items: [
        {
          id: 'sty_api_alpha',
          slug: 'api-story-alpha',
          title: 'Autonomous AI Reporting Deployed',
          summary: 'Global coverage enabled via MCP protocols.',
          articleType: 'breaking_news',
          currentVersionNumber: 1,
          blocks: [],
          publishedAt: new Date().toISOString(),
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await mobileApi.fetchStories();
    expect(result.isOnline).toBe(true);
    expect(result.stories).toHaveLength(1);
    expect(result.stories[0].id).toBe('sty_api_alpha');

    // Confirm cached in offlineStorage
    const cached = offlineStorage.getStory('sty_api_alpha');
    expect(cached).toBeDefined();
    expect(cached?.title).toBe('Autonomous AI Reporting Deployed');
  });

  it('falls back seamlessly to offline cache when API network error occurs', async () => {
    offlineStorage.saveStory(mockTestStory);

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network connection failed'));

    const result = await mobileApi.fetchStories();
    expect(result.isOnline).toBe(false);
    expect(result.stories.length).toBeGreaterThan(0);
    expect(result.stories[0].id).toBe(mockTestStory.id);
  });

  it('filters cached stories during offline search when network is unavailable', async () => {
    offlineStorage.saveStory(mockTestStory);

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network unreachable'));

    const searchResults = await mobileApi.searchStories('BRICS');
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].title).toContain('BRICS Expansion');
  });
});
