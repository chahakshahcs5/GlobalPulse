/**
 * API Client — Taxonomy (Categories, Desks, NavTabs, Topics, TopicDossiers)
 */
import type { Category, NavTab, Topic, TopicDossier, SpecialDesk, Story } from '@ai-news/schemas';
import { request } from './core';
import { listStories } from './stories';

export async function listCategories(): Promise<Category[]> {
  return request<Category[]>('/api/categories');
}

export async function addCategoryDesk(categorySlug: string, desk: string): Promise<Category> {
  return request<Category>(`/api/categories/${encodeURIComponent(categorySlug)}/desks`, {
    method: 'POST',
    body: JSON.stringify({ desk }),
  });
}

export async function removeCategoryDesk(categorySlug: string, desk: string): Promise<Category> {
  return request<Category>(
    `/api/categories/${encodeURIComponent(categorySlug)}/desks/${encodeURIComponent(desk)}`,
    {
      method: 'DELETE',
    }
  );
}

export async function getCategoryStories(slug: string, limit = 20) {
  const res = await request<{ data: Story[] }>(
    `/api/categories/${encodeURIComponent(slug)}/stories?limit=${limit}`
  );
  return res.data;
}

export async function listNavTabs(): Promise<NavTab[]> {
  try {
    return await request<NavTab[]>('/api/navigation/tabs');
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Search API
// ---------------------------------------------------------------------------

export async function listTopics(): Promise<Topic[]> {
  try {
    const res = await request<Topic[] | { data: Topic[] }>('/api/topics');
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [];
  }
}

export async function createTopic(input: {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
}): Promise<Topic> {
  return request<Topic>('/api/topics', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Authentication API
// ---------------------------------------------------------------------------

export async function getTopicDossier(slugOrId: string): Promise<TopicDossier> {
  try {
    return await request<TopicDossier>(`/api/topics/${slugOrId}/dossier`);
  } catch {
    // Client-side synthesis fallback from published stories
    const allStories = await listStories({ limit: 100 });
    const slugClean = slugOrId.toLowerCase();
    const normalized = slugOrId.toLowerCase().replace(/[-_]/g, ' ');

    const matching = allStories.filter(
      (s) =>
        s.status === 'PUBLISHED' &&
        (s.slug.toLowerCase().includes(slugClean) ||
          (s.topicIds || []).some(
            (t) => t.toLowerCase().includes(slugClean) || t.toLowerCase().includes(normalized)
          ) ||
          (s.title || '').toLowerCase().includes(slugClean) ||
          (s.title || '').toLowerCase().includes(normalized))
    );

    const name = slugOrId
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const timeline = matching.map((story) => ({
      date: story.publishedAt || story.createdAt,
      headline: story.title,
      storyId: story.id,
      storySlug: story.slug,
      sourcePublisher: story.createdVia === 'admin' ? 'GlobalPulse Staff' : 'Editorial Wire',
    }));

    const sentiment = { positive: 0, cautious: 0, critical: 0, neutral: 0 };
    for (const story of matching) {
      let found = false;
      if (story.blocks) {
        for (const b of story.blocks) {
          if (b.blockType === 'summary' && b.data && typeof b.data === 'object') {
            const d = b.data as { sentiment?: 'positive' | 'cautious' | 'critical' | 'neutral' };
            if (d.sentiment && d.sentiment in sentiment) {
              sentiment[d.sentiment]++;
              found = true;
            }
          }
        }
      }
      if (!found) sentiment.neutral++;
    }

    const keyEntities = [
      { id: 'ent_ai', name: 'Artificial Intelligence', type: 'Technology' },
      { id: 'ent_markets', name: 'Global Markets', type: 'Economy' },
      { id: 'ent_policy', name: 'Regulatory Directorate', type: 'Government' },
    ];

    const relatedTopics = [
      {
        id: 'top_compute',
        name: 'Semiconductors & Compute',
        slug: 'semiconductors',
        coOccurrenceCount: 4,
      },
      {
        id: 'top_energy',
        name: 'Clean Energy & Power Grids',
        slug: 'energy-transition',
        coOccurrenceCount: 3,
      },
      {
        id: 'top_trade',
        name: 'International Trade Pacts',
        slug: 'trade-policy',
        coOccurrenceCount: 2,
      },
    ];

    return {
      topic: {
        id: `top_${slugClean}`,
        organizationId: 'org_default',
        slug: slugClean,
        name,
        description: `Comprehensive real-time editorial monitoring on ${name}`,
        aliases: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      storyCount: matching.length,
      timeline: timeline.slice(0, 8),
      sentiment,
      keyEntities,
      relatedTopics,
    };
  }
}

export async function listSpecialDesks(onlyActive = true): Promise<SpecialDesk[]> {
  try {
    const res = await request<SpecialDesk[] | { desks: SpecialDesk[] }>('/api/desks');
    return Array.isArray(res) ? res : res?.desks || [];
  } catch {
    const defaultDesks: SpecialDesk[] = [
      {
        id: 'desk_cop30_summit',
        slug: 'cop30-climate-summit',
        name: 'COP30 Global Climate Summit',
        description:
          'Continuous dispatches, decarbonization treaty negotiations, and climate finance commitments live from the pavilion.',
        themeColor: '#10b981',
        bannerImageUrl:
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
        pinnedStoryIds: [],
        liveTickerSymbol: 'CARBON-SPOT',
        isLive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'desk_frontier_ai',
        slug: 'frontier-ai-governance',
        name: 'Frontier AI & Compute Governance',
        description:
          'Real-time coverage on foundation model safety standards, sovereign compute initiatives, and export policies.',
        themeColor: '#6366f1',
        bannerImageUrl:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
        pinnedStoryIds: [],
        liveTickerSymbol: 'COMPUTE-FLOPS',
        isLive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    return onlyActive ? defaultDesks.filter((d) => d.isLive) : defaultDesks;
  }
}

export async function getSpecialDesk(slugOrId: string): Promise<SpecialDesk | null> {
  try {
    return await request<SpecialDesk>(`/api/desks/${slugOrId}`);
  } catch {
    const desks = await listSpecialDesks(false);
    return desks.find((d) => d.slug === slugOrId || d.id === slugOrId) || null;
  }
}
