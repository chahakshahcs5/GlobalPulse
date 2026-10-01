import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { TopicService } from '@ai-news/topics';
import { EntityService } from '@ai-news/entities';
import { SourceService } from '@ai-news/sources';
import { EventService } from '@ai-news/events';
import { NotFoundError } from '@ai-news/shared';

describe('Domain Services Unit Tests', () => {
  let db: DatabaseService;
  let topicService: TopicService;
  let entityService: EntityService;
  let sourceService: SourceService;
  let eventService: EventService;

  beforeEach(() => {
    db = new DatabaseService({ memory: true, engine: 'memory' });
    topicService = new TopicService(db);
    entityService = new EntityService(db);
    sourceService = new SourceService(db);
    eventService = new EventService(db);
  });

  describe('TopicService', () => {
    it('creates topic with slug generation and alias preservation', async () => {
      const topic = await topicService.createTopic(
        {
          name: 'Artificial Intelligence & Ethics',
          description: 'Coverage of AI governance, ethics, and regulatory frameworks',
          aliases: ['AI Ethics', 'AI Policy'],
        },
        'org_test'
      );

      expect(topic.id).toMatch(/^top_/);
      expect(topic.slug).toBe('artificial-intelligence-ethics');
      expect(topic.aliases).toEqual(['AI Ethics', 'AI Policy']);
    });

    it('creates hierarchical child topic referencing parentTopicId', async () => {
      const parent = await topicService.createTopic(
        { name: 'Economics', description: 'Global financial systems' },
        'org_test'
      );

      const child = await topicService.createTopic(
        {
          name: 'Fiscal Policy',
          description: 'Sovereign budgets and taxation',
          parentTopicId: parent.id,
        },
        'org_test'
      );

      expect(child.parentTopicId).toBe(parent.id);
    });

    it('retrieves topic by ID and by slug', async () => {
      const created = await topicService.createTopic(
        { name: 'Quantum Computing', description: 'Quantum hardware advances' },
        'org_test'
      );

      const byId = await topicService.getTopic(created.id, 'org_test');
      expect(byId.name).toBe('Quantum Computing');

      const bySlug = await topicService.getTopicBySlug('quantum-computing', 'org_test');
      expect(bySlug.id).toBe(created.id);
    });

    it('throws NotFoundError for non-existent topic ID or slug', async () => {
      await expect(topicService.getTopic('top_nonexistent', 'org_test')).rejects.toThrow(
        NotFoundError
      );
      await expect(topicService.getTopicBySlug('non-existent-slug', 'org_test')).rejects.toThrow(
        NotFoundError
      );
    });

    it('searches topics matching name or aliases', async () => {
      await topicService.createTopic(
        {
          name: 'Renewable Energy',
          description: 'Clean energy technologies',
          aliases: ['Green Power', 'Solar'],
        },
        'org_test'
      );
      await topicService.createTopic(
        { name: 'Semiconductors', description: 'Chip fabrication' },
        'org_test'
      );

      const results = await topicService.searchTopics('Green Power', 'org_test');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('Renewable Energy');
    });
  });

  describe('EntityService', () => {
    it('creates entity with specific entity type and metadata', async () => {
      const entity = await entityService.createEntity(
        {
          name: 'European Central Bank',
          type: 'ORGANIZATION',
          description: 'Central bank of the eurozone countries',
          aliases: ['ECB'],
          avatarUrl: 'https://images.globalpulse.news/ecb.png',
          metadata: { country: 'EU', headquarters: 'Frankfurt' },
        },
        'org_test'
      );

      expect(entity.id).toMatch(/^ent_/);
      expect(entity.slug).toBe('european-central-bank');
      expect(entity.type).toBe('ORGANIZATION');
      expect(entity.metadata?.headquarters).toBe('Frankfurt');
    });

    it('retrieves entity by ID and by slug', async () => {
      const created = await entityService.createEntity(
        {
          name: 'Ursula von der Leyen',
          type: 'PERSON',
          description: 'European Commission President',
        },
        'org_test'
      );

      const byId = await entityService.getEntity(created.id, 'org_test');
      expect(byId.name).toBe('Ursula von der Leyen');

      const bySlug = await entityService.getEntityBySlug('ursula-von-der-leyen', 'org_test');
      expect(bySlug.id).toBe(created.id);
    });

    it('throws NotFoundError for non-existent entity', async () => {
      await expect(entityService.getEntity('ent_invalid', 'org_test')).rejects.toThrow(
        NotFoundError
      );
      await expect(
        entityService.getEntityBySlug('invalid-entity-slug', 'org_test')
      ).rejects.toThrow(NotFoundError);
    });

    it('searches entities by query across name and aliases', async () => {
      await entityService.createEntity(
        { name: 'Taiwan Semiconductor Manufacturing Co', type: 'ORGANIZATION', aliases: ['TSMC'] },
        'org_test'
      );

      const results = await entityService.searchEntities('TSMC', 'org_test');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toContain('Taiwan Semiconductor');
    });
  });

  describe('SourceService', () => {
    it('creates source and normalizes URL to prevent duplicates', async () => {
      const src1 = await sourceService.createSource(
        {
          url: 'https://www.reuters.com/markets/asia/trade-accord-2026/',
          title: 'Asian Trade Accord Finalized',
          publisher: 'Reuters',
          sourceType: 'NEWS_ARTICLE',
        },
        'org_test'
      );

      // Attempt creating with identical URL
      const src2 = await sourceService.createSource(
        {
          url: 'https://www.reuters.com/markets/asia/trade-accord-2026/',
          title: 'Different Title Duplicate',
          publisher: 'Reuters',
        },
        'org_test'
      );

      expect(src2.id).toBe(src1.id);
    });

    it('attaches source to story and prevents duplicate attachments', async () => {
      // Create story directly in database
      const story = await db.stories.create({
        id: 'sty_test_attachment',
        organizationId: 'org_test',
        slug: 'test-story',
        title: 'Test Story Headline',
        summary: 'Story summary',
        articleType: 'breaking_news',
        status: 'DRAFT',
        currentVersionNumber: 1,
        topicIds: [],
        entityIds: [],
        sourceIds: [],
        blocks: [],
        createdVia: 'api',
        createdByClient: 'human_web',
        authorId: 'usr_test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const source = await sourceService.createSource(
        { url: 'https://apnews.com/article/12345', title: 'AP Report', publisher: 'AP' },
        'org_test'
      );

      await sourceService.attachSourceToStory(story.id, source.id, 'org_test');

      const updated = await db.stories.findById(story.id, 'org_test');
      expect(updated?.sourceIds).toContain(source.id);

      // Re-attaching should be idempotent
      await sourceService.attachSourceToStory(story.id, source.id, 'org_test');
      const updated2 = await db.stories.findById(story.id, 'org_test');
      expect(updated2?.sourceIds.filter((id) => id === source.id).length).toBe(1);
    });

    it('throws NotFoundError when attaching to non-existent story or with non-existent source', async () => {
      const source = await sourceService.createSource(
        { url: 'https://bloomberg.com/news/1', title: 'Bloomberg', publisher: 'Bloomberg' },
        'org_test'
      );

      await expect(
        sourceService.attachSourceToStory('sty_missing', source.id, 'org_test')
      ).rejects.toThrow(NotFoundError);

      await expect(
        sourceService.attachSourceToStory('sty_test_attachment', 'src_missing', 'org_test')
      ).rejects.toThrow(NotFoundError);
    });

    it('creates granular citations linking claim text to specific blocks', async () => {
      const citation = await sourceService.createCitation({
        orgId: 'org_test',
        storyId: 'sty_test_attachment',
        sourceId: 'src_test_1',
        blockId: 'blk_chart_1',
        claimText:
          'Trade volume surged by 42% year-over-year according to bilateral customs reports.',
        confidenceScore: 0.98,
      });

      expect(citation.id).toMatch(/^cit_/);
      expect(citation.claimText).toContain('42% year-over-year');
      expect(citation.confidenceScore).toBe(0.98);

      const citations = await sourceService.getStoryCitations('sty_test_attachment');
      expect(citations.length).toBeGreaterThanOrEqual(1);
      expect(citations.some((c) => c.id === citation.id)).toBe(true);
    });

    it('groups multiple news articles under one parent publisher (The Hindu news1 & news2)', async () => {
      // 1. Register publisher The Hindu with logo and domain
      const hinduPub = await sourceService.createPublisher(
        {
          name: 'The Hindu',
          domain: 'thehindu.com',
          logoUrl: 'https://www.thehindu.com/theme/images/th-online/thehindu-logo.svg',
          description: "India's national newspaper since 1878",
          category: 'general',
          country: 'India',
        },
        'org_test'
      );

      expect(hinduPub.id).toMatch(/^pub_/);
      expect(hinduPub.domain).toBe('thehindu.com');
      expect(hinduPub.slug).toBe('the-hindu');

      // 2. Create news article 1: thehindu.com/news1
      const news1 = await sourceService.createSource(
        {
          url: 'https://thehindu.com/news/national/news1',
          title: 'India Finalizes Bilateral Tech Accord',
          publisher: 'The Hindu',
        },
        'org_test'
      );

      // 3. Create news article 2: thehindu.com/news2
      const news2 = await sourceService.createSource(
        {
          url: 'https://thehindu.com/business/economy/news2',
          title: 'Reserve Bank Expands Cross-Border Clearing',
          publisher: 'The Hindu',
        },
        'org_test'
      );

      // Both should be associated with The Hindu publisher
      expect(news1.publisherId).toBe(hinduPub.id);
      expect(news2.publisherId).toBe(hinduPub.id);

      // 4. Attach news1 to story A
      const storyA = await db.stories.create({
        id: 'sty_test_a',
        organizationId: 'org_test',
        slug: 'story-a',
        title: 'Story A: Tech Policy',
        summary: 'Story A summary',
        articleType: 'breaking_news',
        status: 'PUBLISHED',
        currentVersionNumber: 1,
        topicIds: [],
        entityIds: [],
        sourceIds: [news1.id],
        blocks: [],
        createdVia: 'api',
        createdByClient: 'human_web',
        authorId: 'usr_test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 5. Query complete publisher profile
      const profile = await sourceService.getPublisherProfile(hinduPub.slug, 'org_test');
      expect(profile.publisher.name).toBe('The Hindu');
      expect(profile.citedArticles.length).toBe(2);
      expect(profile.citedArticles.map((a) => a.url)).toContain(
        'https://thehindu.com/news/national/news1'
      );
      expect(profile.citedArticles.map((a) => a.url)).toContain(
        'https://thehindu.com/business/economy/news2'
      );

      // Referenced stories should contain Story A
      expect(profile.referencingStories.length).toBe(1);
      expect(profile.referencingStories[0].id).toBe(storyA.id);
    });

    it('allows users and AI agents to follow a publisher source', async () => {
      const pub = await sourceService.createPublisher(
        {
          name: 'Reuters',
          domain: 'reuters.com',
          category: 'world',
        },
        'org_test'
      );

      // User follows publisher
      await db.users.followTarget('usr_reader_1', 'source', pub.id);

      const isFollowing = await db.users.isFollowing('usr_reader_1', 'source', pub.id);
      expect(isFollowing).toBe(true);

      const followingList = await db.users.listFollowing('usr_reader_1', 'source');
      expect(followingList.length).toBe(1);
      expect(followingList[0].targetId).toBe(pub.id);

      const profile = await sourceService.getPublisherProfile(pub.slug, 'org_test', 'usr_reader_1');
      expect(profile.isFollowing).toBe(true);
    });
  });

  describe('EventService', () => {
    it('creates real-world event with geo coordinates and topics', async () => {
      const event = await eventService.createEvent(
        {
          title: 'COP31 Climate Summit Plenary',
          summary: 'Global delegates agree on renewable energy acceleration framework',
          status: 'ACTIVE',
          location: 'Antalya, Turkey',
          coordinates: [30.7133, 36.8969],
          topicIds: ['top_climate'],
          entityIds: ['ent_unfccc'],
        },
        'org_test'
      );

      expect(event.id).toMatch(/^evt_/);
      expect(event.location).toBe('Antalya, Turkey');
      expect(event.coordinates).toEqual([30.7133, 36.8969]);
      expect(event.status).toBe('ACTIVE');
    });

    it('retrieves event by ID and searches events by query', async () => {
      const created = await eventService.createEvent(
        {
          title: 'G20 Finance Ministers Convene in Brasilia',
          summary: 'Debates on cross-border digital taxation and reserves',
        },
        'org_test'
      );

      const byId = await eventService.getEvent(created.id, 'org_test');
      expect(byId.title).toContain('G20 Finance');

      const searchResults = await eventService.searchEvents('Brasilia', 'org_test');
      expect(searchResults.length).toBeGreaterThanOrEqual(1);
    });

    it('throws NotFoundError for non-existent event ID', async () => {
      await expect(eventService.getEvent('evt_unknown', 'org_test')).rejects.toThrow(NotFoundError);
    });
  });
});
