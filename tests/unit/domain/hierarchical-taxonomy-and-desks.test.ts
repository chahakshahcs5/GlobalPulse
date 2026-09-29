import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { TopicService, SpecialDeskService } from '@ai-news/topics';
import {
  CANONICAL_CATEGORIES,
  SpecialDeskSchema,
  CreateSpecialDeskInputSchema,
  StorySchema,
} from '@ai-news/schemas';

describe('Hierarchical Taxonomy, Special Desks, and Topic Dossier Tests', () => {
  let db: DatabaseService;
  let topicService: TopicService;
  let deskService: SpecialDeskService;

  beforeEach(() => {
    db = new DatabaseService({ memory: true, engine: 'memory' });
    topicService = new TopicService(db);
    deskService = new SpecialDeskService();
  });

  describe('Canonical Categories & Subcategories', () => {
    it('contains all required canonical categories with valid subcategories', () => {
      expect(CANONICAL_CATEGORIES.length).toBeGreaterThanOrEqual(9);

      const tech = CANONICAL_CATEGORIES.find((c) => c.code === 'technology');
      expect(tech).toBeDefined();
      expect(tech?.subCategories).toContain('Artificial Intelligence');
      expect(tech?.subCategories).toContain('Semiconductors');

      const world = CANONICAL_CATEGORIES.find((c) => c.code === 'world');
      expect(world).toBeDefined();
      expect(world?.subCategories).toContain('Diplomatic Summits');

      const business = CANONICAL_CATEGORIES.find((c) => c.code === 'business');
      expect(business).toBeDefined();
      expect(business?.subCategories).toContain('Global Markets');
    });

    it('validates story schema with categories array', () => {
      const validStory = StorySchema.parse({
        id: 'sty_test_categories',
        organizationId: 'org_test',
        slug: 'quantum-cryptography-breakthrough',
        title: 'Quantum Cryptography Protocol Deployed Globally',
        summary:
          'Standardized quantum-resistant cryptographic keys rolled out to major banking infrastructures.',
        status: 'PUBLISHED',
        articleType: 'technology',
        categories: ['technology', 'Quantum Computing', 'Cybersecurity'],
        currentVersionNumber: 1,
        authorId: 'usr_editor',
        createdVia: 'admin',
        createdByClient: 'human_web',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(validStory.categories).toEqual(['technology', 'Quantum Computing', 'Cybersecurity']);
    });
  });

  describe('SpecialDeskService', () => {
    it('seeds curated default pop-up coverage desks', async () => {
      const desks = await deskService.listDesks(true);
      expect(desks.length).toBeGreaterThanOrEqual(2);

      const cop30 = await deskService.getDesk('cop30-climate-summit');
      expect(cop30).toBeDefined();
      expect(cop30?.themeColor).toBe('#10b981');
      expect(cop30?.liveTickerSymbol).toBe('CARBON-SPOT');

      const aiFrontier = await deskService.getDesk('frontier-ai-governance');
      expect(aiFrontier).toBeDefined();
      expect(aiFrontier?.themeColor).toBe('#6366f1');
    });

    it('creates and retrieves a new dynamic pop-up desk', async () => {
      const input = CreateSpecialDeskInputSchema.parse({
        name: 'Semiconductor Supply Foundry 2026',
        description: 'Global 2nm node deployment tracking and supply chain dispatches.',
        themeColor: '#f59e0b',
        liveTickerSymbol: 'CHIP-INDEX',
      });

      const desk = await deskService.createDesk(input);
      expect(desk.id).toMatch(/^desk_/);
      expect(desk.slug).toBe('semiconductor-supply-foundry-2026');
      expect(desk.themeColor).toBe('#f59e0b');
      expect(SpecialDeskSchema.safeParse(desk).success).toBe(true);

      const retrieved = await deskService.getDesk(desk.slug);
      expect(retrieved?.id).toBe(desk.id);
    });

    it('pins stories to a special pop-up desk', async () => {
      const desk = await deskService.createDesk({
        name: 'G20 Digital Economy Summit',
        themeColor: '#3b82f6',
      });

      const updated = await deskService.pinStory(desk.id, 'sty_g20_declaration');
      expect(updated.pinnedStoryIds).toContain('sty_g20_declaration');

      const fetched = await deskService.getDesk(desk.slug);
      expect(fetched?.pinnedStoryIds).toContain('sty_g20_declaration');
    });
  });

  describe('TopicService Topic Dossier & Knowledge Graph', () => {
    it('generates a rich topic dossier with milestones, sentiment, and co-occurrences', async () => {
      const topic = await topicService.createTopic(
        {
          name: 'Clean Fusion Energy',
          description: 'Commercial net-energy magnetic confinement experiments.',
        },
        'org_test'
      );

      // Seed stories associated with this topic
      await db.stories.create({
        id: 'sty_fusion_01',
        organizationId: 'org_test',
        slug: 'clean-fusion-energy-reactor-ignition',
        title: 'Reactor Achieves Sustainable Net-Energy Ignition',
        summary: 'Experimental magnetic confinement facility sustains Q>1.5 reaction.',
        status: 'PUBLISHED',
        articleType: 'science',
        topicIds: [topic.id, 'top_physics'],
        entityIds: ['ent_iter', 'ent_cern'],
        sourceIds: [],
        categories: ['science', 'Renewable Systems'],
        currentVersionNumber: 1,
        authorId: 'usr_scientist',
        createdVia: 'admin',
        createdByClient: 'human_web',
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
        publishedAt: '2026-03-01T10:00:00Z',
        blocks: [
          {
            id: 'blk_sum_1',
            blockType: 'summary',
            data: {
              headline: 'Breakthrough result verified.',
              bulletPoints: ['High plasma yield observed', 'Sustained net energy'],
              sentiment: 'positive',
            },
            sortOrder: 0,
          },
          {
            id: 'blk_tl_1',
            blockType: 'timeline',
            data: {
              items: [
                {
                  date: '2026-01-15T00:00:00Z',
                  headline: 'Magnets chilled to 4 Kelvin',
                  body: 'Superconducting coils reached operational temperature.',
                },
                {
                  date: '2026-02-20T00:00:00Z',
                  headline: 'Deuterium plasma injected',
                  body: 'Stable magnetic confinement initiated.',
                },
              ],
            },
            sortOrder: 1,
          },
        ],
      });

      const dossier = await topicService.getTopicDossier(topic.slug, 'org_test');

      expect(dossier.topic.name).toBe('Clean Fusion Energy');
      expect(dossier.storyCount).toBe(1);
      expect(dossier.sentiment.positive).toBe(1);
      expect(dossier.timeline.length).toBeGreaterThanOrEqual(1);
      expect(dossier.timeline.some((m) => m.headline.includes('Reactor Achieves'))).toBe(true);
      expect(dossier.keyEntities.length).toBeGreaterThan(0);
      expect(dossier.relatedTopics.some((r) => r.id === 'top_physics')).toBe(true);
    });

    it('computes topic knowledge graph with co-occurrence edge weights', async () => {
      const topA = await topicService.createTopic({ name: 'Robotics' }, 'org_test');
      const topB = await topicService.createTopic({ name: 'Computer Vision' }, 'org_test');

      await db.stories.create({
        id: 'sty_robotics_vision',
        organizationId: 'org_test',
        slug: 'humanoid-robots-realtime-vision',
        title: 'Bipedal Humanoids Master Unstructured Factory Navigation',
        summary: 'Vision-language-action foundation models enable autonomous material handling.',
        status: 'PUBLISHED',
        articleType: 'technology',
        topicIds: [topA.id, topB.id],
        entityIds: [],
        sourceIds: [],
        categories: ['technology', 'Artificial Intelligence'],
        currentVersionNumber: 1,
        authorId: 'usr_agent',
        createdVia: 'api',
        createdByClient: 'custom_mcp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        blocks: [],
      });

      const graph = await topicService.getTopicKnowledgeGraph('org_test');

      expect(graph.nodes.some((n) => n.id === topA.id)).toBe(true);
      expect(graph.nodes.some((n) => n.id === topB.id)).toBe(true);

      const edge = graph.edges.find(
        (e) =>
          (e.source === topA.id && e.target === topB.id) ||
          (e.source === topB.id && e.target === topA.id)
      );
      expect(edge).toBeDefined();
      expect(edge?.weight).toBe(1);
    });
  });
});
