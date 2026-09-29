import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { PersonalizationService } from '@ai-news/stories';
import {
  AlgorithmTuningSchema,
  AttributionSignalSchema,
  ReaderConsumptionProfileSchema,
} from '@ai-news/schemas';

describe('Explainable Personalization & Algorithm Tuning Tests', () => {
  let db: DatabaseService;
  let personalizationService: PersonalizationService;

  beforeEach(() => {
    db = new DatabaseService({ memory: true, engine: 'memory' });
    personalizationService = new PersonalizationService(db);
  });

  describe('Schema Validation', () => {
    it('validates algorithm tuning parameters with default weights', () => {
      const defaultTuning = AlgorithmTuningSchema.parse({});
      expect(defaultTuning.depthPreference).toBe('balanced');
      expect(defaultTuning.serendipityWeight).toBe(30);
      expect(defaultTuning.localVsGlobalWeight).toBe(50);
      expect(defaultTuning.editorialStrictness).toBe(70);

      const customTuning = AlgorithmTuningSchema.parse({
        depthPreference: 'deep_dive',
        serendipityWeight: 80,
        localVsGlobalWeight: 20,
        editorialStrictness: 90,
      });
      expect(customTuning.depthPreference).toBe('deep_dive');
      expect(customTuning.serendipityWeight).toBe(80);
    });

    it('validates attribution signal types and contributions', () => {
      const signal = AttributionSignalSchema.parse({
        type: 'followed_topic',
        target: 'semiconductors',
        contribution: 40,
        explanation: 'Story covers topic #semiconductors which you follow',
      });
      expect(signal.type).toBe('followed_topic');
      expect(signal.contribution).toBe(40);
    });
  });

  describe('PersonalizationService with Explainable Attribution', () => {
    it('generates personalized feed with transparent attribution signals and algorithm tuning', async () => {
      const now = new Date().toISOString();

      // Create test user with custom algorithm tuning
      const user = await db.users.create({
        id: 'usr_tuner_reader',
        organizationId: 'org_test',
        name: 'Alex Rivera',
        email: 'alex@globalpulse.test',
        role: 'reader',
        clientType: 'human_web',
        status: 'active',
        preferences: {
          categories: ['technology'],
          emailFrequency: 'daily',
          readingHistoryEnabled: true,
          theme: 'dark',
          depthPreference: 'deep_dive',
          serendipityWeight: 60,
          localVsGlobalWeight: 50,
          editorialStrictness: 80,
        },
        createdAt: now,
        updatedAt: now,
      });

      // Follow a specific topic
      await db.users.followTarget('usr_tuner_reader', 'topic', 'quantum_chips');

      // Create stories
      await db.stories.create({
        id: 'sty_quantum_deep',
        organizationId: 'org_test',
        slug: 'quantum-annealing-commercial-milestone',
        title: 'Quantum Annealing Reaches 5,000 Qubits in Commercial Trials',
        summary: 'Exhaustive benchmark data from five supercomputing centers confirm stability.',
        status: 'PUBLISHED',
        articleType: 'technology',
        topicIds: ['quantum_chips'],
        entityIds: [],
        sourceIds: [],
        categories: ['technology'],
        currentVersionNumber: 1,
        authorId: 'usr_writer',
        createdVia: 'admin',
        createdByClient: 'human_web',
        readingTimeMinutes: 8,
        wordCount: 1450,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        blocks: [],
      });

      await db.stories.create({
        id: 'sty_archaeology_serendipity',
        organizationId: 'org_test',
        slug: 'submerged-neolithic-monument-discovered',
        title: 'LiDAR Scans Reveal Submerged Neolithic Stone Circle',
        summary:
          'Marine archaeologists discover intact prehistoric megalith off the coast of Brittany.',
        status: 'PUBLISHED',
        articleType: 'science',
        topicIds: ['archaeology'],
        entityIds: [],
        sourceIds: [],
        categories: ['science'],
        currentVersionNumber: 1,
        authorId: 'usr_writer',
        createdVia: 'admin',
        createdByClient: 'human_web',
        readingTimeMinutes: 4,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        blocks: [],
      });

      const feed = await personalizationService.getPersonalizedFeedWithAttribution({
        userId: user.id,
        organizationId: 'org_test',
        limit: 10,
      });

      expect(feed.items.length).toBe(2);

      // Top ranked story should be the followed topic & depth match
      const topItem = feed.items[0];
      expect(topItem.story.id).toBe('sty_quantum_deep');
      expect(topItem.signals.some((s) => s.type === 'followed_topic')).toBe(true);
      expect(topItem.signals.some((s) => s.type === 'category_affinity')).toBe(true);
      expect(topItem.signals.some((s) => s.type === 'reading_depth')).toBe(true);

      // Second story should reflect serendipity discovery
      const secondItem = feed.items[1];
      expect(secondItem.signals.some((s) => s.type === 'serendipity_discovery')).toBe(true);
    });

    it('computes reader consumption profile and topic balance', async () => {
      const now = new Date().toISOString();
      const userId = 'usr_diet_reader';

      await db.users.create({
        id: userId,
        organizationId: 'org_test',
        name: 'Sarah Connor',
        email: 'sarah@globalpulse.test',
        role: 'reader',
        clientType: 'human_web',
        status: 'active',
        preferences: {
          categories: ['technology', 'business'],
          depthPreference: 'balanced',
          readingHistoryEnabled: true,
          emailFrequency: 'daily',
          theme: 'system',
        },
        createdAt: now,
        updatedAt: now,
      });

      // Seed published story
      await db.stories.create({
        id: 'sty_finance_01',
        organizationId: 'org_test',
        slug: 'central-bank-liquidity-update',
        title: 'Central Bank Injects Liquidity Into Interbank Lending Markets',
        summary: 'Overnight facilities stabilize swap spreads across European hubs.',
        status: 'PUBLISHED',
        articleType: 'business',
        topicIds: ['top_finance'],
        entityIds: [],
        sourceIds: [],
        categories: ['business'],
        currentVersionNumber: 1,
        authorId: 'usr_reporter',
        createdVia: 'admin',
        createdByClient: 'human_web',
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        blocks: [],
      });

      // Record reading progress
      await db.engagement.saveReadingProgress(userId, 'sty_finance_01', 100, true);

      const profile = await personalizationService.getReaderConsumptionProfile(userId, 'org_test');
      expect(profile.userId).toBe(userId);
      expect(profile.storiesReadCount).toBe(1);
      expect(profile.categoryDistribution['business']).toBe(1);
      expect(profile.diversityScore).toBeGreaterThan(0);
      expect(ReaderConsumptionProfileSchema.safeParse(profile).success).toBe(true);
    });

    it('exports an offline digest bundle for disconnected reading', async () => {
      const now = new Date().toISOString();

      await db.stories.create({
        id: 'sty_flight_01',
        organizationId: 'org_test',
        slug: 'supersonic-airliner-certification-tests',
        title: 'Commercial Supersonic Jet Passes Quiet Sonic Boom Trials',
        summary: 'Acoustic signature below 75 PLdB clears overland supersonic flight routes.',
        status: 'PUBLISHED',
        articleType: 'technology',
        topicIds: ['aviation'],
        entityIds: [],
        sourceIds: [],
        categories: ['technology'],
        currentVersionNumber: 1,
        authorId: 'usr_aviation',
        createdVia: 'admin',
        createdByClient: 'human_web',
        readingTimeMinutes: 4,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        blocks: [],
      });

      const digest = await personalizationService.exportOfflineDigest({
        organizationId: 'org_test',
        count: 5,
      });

      expect(digest.digestId).toMatch(/^digest_/);
      expect(digest.stories.length).toBeGreaterThanOrEqual(1);
      expect(digest.totalEstimatedReadingMinutes).toBeGreaterThan(0);
      expect(digest.title).toContain('Offline');
    });
  });
});
