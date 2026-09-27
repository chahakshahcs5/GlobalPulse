import { DatabaseService } from '../src/database.service';
import { logger } from '@ai-news/observability';
import type { Story } from '@ai-news/schemas';

export async function seedDatabase(db: DatabaseService): Promise<void> {
  logger.info('Starting enterprise database seed with canonical schema records...');

  // 1. Taxonomy Topics
  const topics = [
    {
      id: 'top_geopolitics',
      organizationId: 'org_default',
      slug: 'geopolitics',
      name: 'Global Geopolitics',
      description: 'International treaties, multilateral summits, sanctions, and diplomatic affairs.',
      aliases: ['diplomacy', 'foreign-policy', 'summits'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'top_brics_2026',
      organizationId: 'org_default',
      slug: 'brics-2026',
      name: 'BRICS Summit 2026',
      parentTopicId: 'top_geopolitics',
      description: 'Coverage of the 2026 New Delhi multilateral summit and expansion accords.',
      aliases: ['brics', 'brics-summit', 'new-delhi-accord'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'top_energy_fusion',
      organizationId: 'org_default',
      slug: 'fusion-energy',
      name: 'Nuclear Fusion Energy',
      description: 'Commercial net-energy gain milestones, tokamaks, and magnet breakthroughs.',
      aliases: ['fusion', 'tokamak', 'plasma-physics'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const topic of topics) {
    await db.topics.create(topic);
  }

  // 2. Entities
  const entities = [
    {
      id: 'ent_india',
      organizationId: 'org_default',
      slug: 'india',
      name: 'Republic of India',
      type: 'COUNTRY' as const,
      aliases: ['Bharat', 'IN'],
      description: 'Host nation of the 2026 multilateral economic summit.',
      metadata: { capital: 'New Delhi', region: 'South Asia' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ent_tsmc',
      organizationId: 'org_default',
      slug: 'tsmc',
      name: 'Taiwan Semiconductor Manufacturing Co.',
      type: 'ORGANIZATION' as const,
      aliases: ['TSMC', 'Taiwan Semi'],
      description: 'World leading semiconductor foundry and pioneer of 2nm gate-all-around nodes.',
      metadata: { ticker: 'TSM', industry: 'Semiconductors' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const entity of entities) {
    await db.entities.create(entity);
  }

  // 3. Primary Sources
  const sources = [
    {
      id: 'src_reuters_01',
      organizationId: 'org_default',
      url: 'https://reuters.example.com/world/brics-summit-accord-2026',
      canonicalUrl: 'https://reuters.example.com/world/brics-summit-accord-2026',
      title: 'BRICS Leaders Reach Comprehensive Accession Accord',
      publisher: 'Reuters Global Wire',
      author: 'Diplomatic Affairs Bureau',
      publishedAt: '2026-09-26T08:00:00Z',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'NEWS_ARTICLE' as const,
      permissibleExcerpt: 'The member states formally adopt the New Delhi multilateral settlement framework.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'src_mea_gov',
      organizationId: 'org_default',
      url: 'https://mea.gov.in/brics-declaration-2026.htm',
      canonicalUrl: 'https://mea.gov.in/brics-declaration-2026.htm',
      title: 'Official Treaty: 2026 New Delhi Declaration',
      publisher: 'Ministry of External Affairs',
      author: 'Summit Secretariat',
      publishedAt: '2026-09-26T09:30:00Z',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'OFFICIAL_DOCUMENT' as const,
      permissibleExcerpt: 'Article 4: Cross-border clearing among member states shall be denominated in local currencies.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const source of sources) {
    await db.sources.create(source);
  }

  // 4. Flagship Multi-Version Story
  const story: Story = {
    id: 'sty_brics_flagship',
    organizationId: 'org_default',
    slug: 'brics-expansion-2026-global-economic-realignment',
    title: 'BRICS Expansion 2026: Historic Geoeconomic Shift Finalized in New Delhi',
    summary: 'Ten member nations formally ratify expansion protocols and introduce a multi-currency trade clearing architecture.',
    status: 'PUBLISHED',
    articleType: 'breaking_news',
    authorId: 'usr_spark_agent',
    createdByClient: 'gemini_spark',
    createdVia: 'mcp',
    currentVersionNumber: 2,
    heroImageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1600&q=80',
    publishedAt: '2026-09-26T10:00:00Z',
    createdAt: '2026-09-26T07:00:00Z',
    updatedAt: '2026-09-26T10:00:00Z',
    topicIds: ['top_brics_2026'],
    entityIds: ['ent_india'],
    sourceIds: ['src_reuters_01', 'src_mea_gov'],
    blocks: [
      {
        id: 'blk_what_changed',
        blockType: 'what_changed',
        sortOrder: 0,
        data: {
          previousVersionNumber: 1,
          updatedAt: '2026-09-26T10:00:00Z',
          items: [
            {
              changeType: 'added',
              description: 'Incorporated ratified New Delhi Declaration official excerpts.',
            },
            {
              changeType: 'updated',
              description: 'Updated D3 economic projection chart reflecting revised purchasing-power output.',
            },
          ],
        },
      },
      {
        id: 'blk_lead',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'NEW DELHI — In a historic unanimous vote, member states formally ratified the accession of four partner economies, establishing a unified multilateral settlement mechanism.',
          format: 'markdown',
        },
      },
      {
        id: 'blk_chart_gdp',
        blockType: 'chart',
        sortOrder: 2,
        data: {
          chartType: 'bar',
          title: 'Combined Economic Output ($ Trillion PPP)',
          xAxis: { key: 'year', label: 'Fiscal Year', type: 'category' },
          yAxis: { label: 'Trillion USD' },
          series: [{ name: 'Combined Output', key: 'gdp', color: '#3b82f6' }],
          values: [
            { year: '2022', gdp: 29.5 },
            { year: '2024', gdp: 35.2 },
            { year: '2026 Proj', gdp: 41.8 },
          ],
          sourceAttribution: 'World Bank & BRICS Secretariat 2026',
        },
      },
      {
        id: 'blk_timeline',
        blockType: 'timeline',
        sortOrder: 3,
        data: {
          title: 'Summit Progression',
          items: [
            {
              date: '08:00 UTC',
              headline: 'Draft Protocol Circulated',
              body: 'Ministerial delegations finalized technical wording for bilateral clearing systems.',
            },
            {
              date: '10:00 UTC',
              headline: 'Declaration Ratified',
              body: 'Heads of state executed signature protocols before the plenary assembly.',
            },
          ],
        },
      },
    ],
  };

  await db.stories.create(story);

  // Versions
  await db.stories.createVersion({
    id: 'ver_brics_v1',
    storyId: story.id,
    versionNumber: 1,
    title: 'BRICS Expansion 2026: Preliminary Consensus Reached',
    summary: 'Summit opens with draft agreement on expanded membership.',
    changeSummary: 'Initial breaking news dispatch.',
    blocks: [story.blocks[1]],
    authorId: 'usr_spark_agent',
    clientType: 'gemini_spark',
    createdAt: '2026-09-26T07:00:00Z',
  });

  await db.stories.createVersion({
    id: 'ver_brics_v2',
    storyId: story.id,
    versionNumber: 2,
    title: story.title,
    summary: story.summary,
    changeSummary: 'Added What-Changed summary, D3 economic projection chart, and ratified declaration citations.',
    blocks: story.blocks,
    authorId: 'usr_spark_agent',
    clientType: 'gemini_spark',
    createdAt: '2026-09-26T10:00:00Z',
  });

  logger.info('Database seeded successfully with enterprise newsroom records.');
}

if (require.main === module) {
  const dbInstance = new DatabaseService();
  seedDatabase(dbInstance).catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
