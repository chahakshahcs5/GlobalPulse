import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import { EventService } from '@ai-news/events';
import { SourceService } from '@ai-news/sources';
import { SearchService } from '@ai-news/search';

describe('Search & Domain Model Separation (Event vs Story vs Source)', () => {
  let db: DatabaseService;
  let storyService: StoryService;
  let eventService: EventService;
  let sourceService: SourceService;
  let searchService: SearchService;

  const orgId = 'org_separation_test';
  const ctx = {
    organizationId: orgId,
    authorId: 'usr_editor_1',
    clientType: 'human_web' as const,
    createdVia: 'web' as const,
  };

  beforeEach(() => {
    db = new DatabaseService();
    storyService = new StoryService(db);
    eventService = new EventService(db);
    sourceService = new SourceService(db);
    searchService = new SearchService(db);
  });

  it('maintains strict separation between Event, Story, and Source', async () => {
    // 1. Real-world event
    const event = await eventService.createEvent(
      {
        title: 'BRICS 2026 Summit Official Opening',
        summary: 'Annual diplomatic summit commencing in New Delhi.',
        location: 'New Delhi, India',
        coordinates: [77.209, 28.6139],
      },
      orgId
    );
    expect(event.id).toMatch(/^evt_/);

    // 2. External Source
    const source = await sourceService.createSource(
      {
        url: 'https://reuters.example.com/world/brics-summit-opening-2026',
        title: 'BRICS Leaders Gather in New Delhi for Historic Summit',
        publisher: 'Reuters',
        author: 'Global Desk',
      },
      orgId
    );
    expect(source.id).toMatch(/^src_/);

    // 3. Editorial Story linked to the Event and Source
    const story = await storyService.createStory(
      {
        title: 'BRICS Summit 2026 Opens with Focus on Tech Alliances',
        summary: 'Member states outline priorities for artificial intelligence and trade.',
        eventId: event.id,
        sourceIds: [source.id],
        blocks: [
          {
            id: 'p_summit',
            blockType: 'paragraph',
            sortOrder: 0,
            data: { text: 'Representatives from 10 member states convened.', format: 'markdown' },
          },
        ],
      },
      ctx
    );

    expect(story.id).toMatch(/^sty_/);
    expect(story.eventId).toBe(event.id);
    expect(story.sourceIds).toContain(source.id);

    // 4. Citation linking specific block claim to the Source
    const citation = await sourceService.createCitation({
      storyId: story.id,
      sourceId: source.id,
      claimText: '10 member states convened in New Delhi',
      blockId: 'p_summit',
      confidenceScore: 0.98,
      orgId,
    });
    expect(citation.id).toMatch(/^cit_/);

    const citations = await sourceService.getStoryCitations(story.id);
    expect(citations.length).toBe(1);
    expect(citations[0].sourceId).toBe(source.id);
  });

  it('performs similarity search to inform external AI without making editorial decisions', async () => {
    await storyService.createStory(
      {
        title: 'Electric Vehicle Battery Innovation Extends Range to 800 Miles',
        summary: 'Solid-state silicon anode cells achieve production scalability.',
      },
      ctx
    );

    // External AI tests similarity for a candidate report
    const candidates = await searchService.findSimilarStories(
      {
        title: 'New Electric Vehicle Battery Claims 800 Miles Range',
        summary: 'Solid-state battery technology breakthroughs announced.',
        threshold: 0.4,
      },
      orgId
    );

    expect(candidates.length).toBe(1);
    expect(candidates[0].similarityScore).toBeDefined();
    expect(candidates[0].similarityScore!).toBeGreaterThanOrEqual(0.4);
    // The application returns the score; the external AI decides whether to create new or update!
  });
});
