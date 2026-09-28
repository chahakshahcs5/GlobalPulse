import { describe, it, expect } from 'vitest';
import { buildClustersFromStories } from '../../../apps/web/src/lib/cluster-builder';
import type { Story } from '@ai-news/schemas';
import { GOOGLE_NEWS_CLUSTERS } from '../../../apps/web/src/lib/news-data';

describe('Google News Cluster Builder Unit Tests', () => {
  const mockStory1: Story = {
    id: 'sty_dynamic_01',
    organizationId: 'org_pulse',
    slug: 'quantum-ai-supercomputing-deployed',
    title: 'Autonomous AI Discovers Novel Room-Temperature Superconductor Candidate',
    summary:
      'A multi-agent AI system synthesizes and validates high-pressure crystal lattice models.',
    status: 'PUBLISHED',
    articleType: 'technology',
    currentVersionNumber: 1,
    currentVersionId: 'ver_01',
    topicIds: ['top_superconductors', 'top_ai'],
    entityIds: ['ent_deepmind'],
    sourceIds: ['src_nature'],
    createdByClient: 'gemini',
    createdVia: 'mcp',
    blocks: [
      {
        id: 'blk_quote_1',
        blockType: 'quote',
        sortOrder: 1,
        data: {
          quote:
            'This computational breakthrough cuts material synthesis lead times from years to hours.',
          attribution: 'Dr. Aris Thorne, Lead Materials Physicist',
        },
      },
    ],
    authorId: 'usr_gemini_agent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockStory2: Story = {
    id: 'sty_dynamic_02',
    organizationId: 'org_pulse',
    slug: 'commercial-reactors-license-superconductor',
    title: 'Fusion Energy Consortium Licenses New Superconducting Tape',
    summary: 'Industrial scale manufacturing planned across three regional hubs.',
    status: 'PUBLISHED',
    articleType: 'technology',
    currentVersionNumber: 1,
    currentVersionId: 'ver_02',
    topicIds: ['top_superconductors'], // Shares topic with mockStory1
    entityIds: ['ent_iter'],
    sourceIds: ['src_reuters'],
    createdByClient: 'human_web',
    createdVia: 'admin',
    blocks: [],
    authorId: 'usr_admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('builds GoogleNewsCluster from live published stories', () => {
    const clusters = buildClustersFromStories([mockStory1]);
    expect(clusters.length).toBeGreaterThan(GOOGLE_NEWS_CLUSTERS.length);

    const dynamicCluster = clusters.find((c) => c.mainStoryId === 'sty_dynamic_01');
    expect(dynamicCluster).toBeDefined();
    expect(dynamicCluster?.title).toBe(mockStory1.title);
    expect(dynamicCluster?.category).toBe('Technology');
    expect(dynamicCluster?.leadStory.publisher).toBe('Gemini AI Wire');
    expect(dynamicCluster?.leadStory.slug).toBe(mockStory1.slug);
  });

  it('extracts multi-source related articles from shared topics', () => {
    const clusters = buildClustersFromStories([mockStory1, mockStory2]);
    const cluster1 = clusters.find((c) => c.mainStoryId === 'sty_dynamic_01');
    expect(cluster1).toBeDefined();

    // mockStory2 shares 'top_superconductors' so it should appear as a related source article
    const relatedFromOtherStory = cluster1?.relatedArticles.find((r) => r.id === 'sty_dynamic_02');
    expect(relatedFromOtherStory).toBeDefined();
    expect(relatedFromOtherStory?.headline).toBe(mockStory2.title);
    expect(relatedFromOtherStory?.publisher).toBe('GlobalPulse Staff');
  });

  it('extracts perspectives from quote blocks in story content', () => {
    const clusters = buildClustersFromStories([mockStory1]);
    const cluster = clusters.find((c) => c.mainStoryId === 'sty_dynamic_01');
    const quoteArticle = cluster?.relatedArticles.find((r) => r.id === 'quote_blk_quote_1');
    expect(quoteArticle).toBeDefined();
    expect(quoteArticle?.publisher).toContain('Dr. Aris Thorne');
    expect(quoteArticle?.headline).toContain('computational breakthrough');
  });

  it('prepends dynamic stories before baseline seed clusters', () => {
    const clusters = buildClustersFromStories([mockStory1]);
    expect(clusters[0].mainStoryId).toBe('sty_dynamic_01');
  });
});
