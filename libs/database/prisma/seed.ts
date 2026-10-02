import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2]?.trim();
      }
    }
  }
}
loadEnvFile();
import { DatabaseService } from '../src/database.service';
import { logger } from '@ai-news/observability';
import { type Story, CANONICAL_CATEGORIES, BASELINE_NAV_TABS } from '@ai-news/schemas';

export async function seedDatabase(db: DatabaseService): Promise<void> {
  logger.info('Starting enterprise database seed with canonical schema records...');

  // 1. Taxonomy Topics
  const topics = [
    {
      id: 'top_geopolitics',
      organizationId: 'org_default',
      slug: 'geopolitics',
      name: 'Global Geopolitics',
      description:
        'International treaties, multilateral summits, sanctions, and diplomatic affairs.',
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
    const existing = await db.topics.findById(topic.id);
    if (!existing) {
      await db.topics.create(topic);
    }
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
    const existing = await db.entities.findById(entity.id);
    if (!existing) {
      await db.entities.create(entity);
    }
  }

  // 3. Publishers & Primary Sources
  const publishers = [
    {
      id: 'pub_the_hindu',
      organizationId: 'org_default',
      name: 'The Hindu',
      slug: 'the-hindu',
      domain: 'thehindu.com',
      logoUrl:
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=160&auto=format&fit=crop&q=80',
      description:
        "One of India's most respected English-language daily newspapers, founded in 1878.",
      category: 'general',
      country: 'India',
      language: 'en',
      websiteUrl: 'https://www.thehindu.com',
      biasRating: 'Center / Independent',
      credibilityScore: 96,
      isVerified: true,
      followerCount: 1840,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pub_reuters',
      organizationId: 'org_default',
      name: 'Reuters',
      slug: 'reuters',
      domain: 'reuters.com',
      logoUrl:
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=160&auto=format&fit=crop&q=80',
      description:
        'International news organization providing breaking global wire dispatches and financial intelligence.',
      category: 'world',
      country: 'Global',
      language: 'en',
      websiteUrl: 'https://www.reuters.com',
      biasRating: 'Wire / Factual',
      credibilityScore: 98,
      isVerified: true,
      followerCount: 4210,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pub_bloomberg',
      organizationId: 'org_default',
      name: 'Bloomberg',
      slug: 'bloomberg',
      domain: 'bloomberg.com',
      logoUrl:
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=160&auto=format&fit=crop&q=80',
      description: 'Global business and financial markets news agency.',
      category: 'business',
      country: 'United States',
      language: 'en',
      websiteUrl: 'https://www.bloomberg.com',
      biasRating: 'Market Focused',
      credibilityScore: 95,
      isVerified: true,
      followerCount: 3950,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pub_techcrunch',
      organizationId: 'org_default',
      name: 'TechCrunch',
      slug: 'techcrunch',
      domain: 'techcrunch.com',
      logoUrl:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=160&auto=format&fit=crop&q=80',
      description:
        'Premier technology and venture publication covering AI breakthroughs and startup innovation.',
      category: 'technology',
      country: 'United States',
      language: 'en',
      websiteUrl: 'https://techcrunch.com',
      biasRating: 'Tech Analytical',
      credibilityScore: 92,
      isVerified: true,
      followerCount: 2600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const pub of publishers) {
    const existing = await db.publishers.findById(pub.id);
    if (!existing) {
      await db.publishers.create(pub);
    }
  }

  const sources = [
    {
      id: 'src_hindu_01',
      organizationId: 'org_default',
      publisherId: 'pub_the_hindu',
      domain: 'thehindu.com',
      url: 'https://thehindu.com/news/national/india-multilateral-trade-accord-2026',
      canonicalUrl: 'https://thehindu.com/news/national/india-multilateral-trade-accord-2026',
      title: 'India Seals Multilateral Trade Settlement Framework at New Delhi Summit',
      publisher: 'The Hindu',
      author: 'Special Diplomatic Correspondent',
      publishedAt: '2026-09-26T09:00:00Z',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'NEWS_ARTICLE' as const,
      permissibleExcerpt:
        'Negotiators in New Delhi agreed to the landmark accession protocols establishing direct local-currency exchange mechanisms.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'src_hindu_02',
      organizationId: 'org_default',
      publisherId: 'pub_the_hindu',
      domain: 'thehindu.com',
      url: 'https://thehindu.com/business/economy/cross-border-currency-clearing',
      canonicalUrl: 'https://thehindu.com/business/economy/cross-border-currency-clearing',
      title: 'Reserve Bank Unveils Sovereign Clearing Channels for Asian Bilateral Trade',
      publisher: 'The Hindu',
      author: 'Banking & Macroeconomics Desk',
      publishedAt: '2026-09-26T11:45:00Z',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'NEWS_ARTICLE' as const,
      permissibleExcerpt:
        'The central bank issued operational directives permitting bilateral clearing accounts without third-party intermediary currencies.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'src_reuters_01',
      organizationId: 'org_default',
      publisherId: 'pub_reuters',
      domain: 'reuters.com',
      url: 'https://reuters.example.com/world/brics-summit-accord-2026',
      canonicalUrl: 'https://reuters.example.com/world/brics-summit-accord-2026',
      title: 'BRICS Leaders Reach Comprehensive Accession Accord',
      publisher: 'Reuters Global Wire',
      author: 'Diplomatic Affairs Bureau',
      publishedAt: '2026-09-26T08:00:00Z',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'NEWS_ARTICLE' as const,
      permissibleExcerpt:
        'The member states formally adopt the New Delhi multilateral settlement framework.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'src_mea_gov',
      organizationId: 'org_default',
      domain: 'mea.gov.in',
      url: 'https://mea.gov.in/brics-declaration-2026.htm',
      canonicalUrl: 'https://mea.gov.in/brics-declaration-2026.htm',
      title: 'Official Treaty: 2026 New Delhi Declaration',
      publisher: 'Ministry of External Affairs',
      author: 'Summit Secretariat',
      publishedAt: '2026-09-26T09:30:00Z',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'OFFICIAL_DOCUMENT' as const,
      permissibleExcerpt:
        'Article 4: Cross-border clearing among member states shall be denominated in local currencies.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const source of sources) {
    const existing = await db.sources.findById(source.id);
    if (!existing) {
      await db.sources.create(source);
    }
  }

  // 4. Flagship Multi-Version Story
  const story: Story = {
    id: 'sty_brics_flagship',
    organizationId: 'org_default',
    slug: 'brics-expansion-2026-global-economic-realignment',
    title: 'BRICS Expansion 2026: Historic Geoeconomic Shift Finalized in New Delhi',
    summary:
      'Ten member nations formally ratify expansion protocols and introduce a multi-currency trade clearing architecture.',
    status: 'PUBLISHED',
    articleType: 'breaking_news',
    authorId: 'usr_spark_agent',
    createdByClient: 'gemini_spark',
    createdVia: 'mcp',
    currentVersionNumber: 2,
    heroImageUrl:
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1600&q=80',
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
              description:
                'Updated D3 economic projection chart reflecting revised purchasing-power output.',
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

  const existingStory = await db.stories.findById(story.id);
  if (!existingStory) {
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
      changeSummary:
        'Added What-Changed summary, D3 economic projection chart, and ratified declaration citations.',
      blocks: story.blocks,
      authorId: 'usr_spark_agent',
      clientType: 'gemini_spark',
      createdAt: '2026-09-26T10:00:00Z',
    });
  }

  // 6. Fact Checks
  const factChecks = [
    {
      id: 'fc_01',
      claim: 'Solar storms completely dismantled international undersea internet cables.',
      claimant: 'Viral Social Media Posts',
      rating: 'FALSE' as const,
      summary:
        'Undersea fiber optic cables operate via light pulses immune to geomagnetic fluctuations. Only surface equipment experienced minor transient surges.',
      checker: 'GlobalPulse Verification Desk',
      sources: ['NOAA Space Weather Prediction Center', 'International Cable Protection Committee'],
      checkedAt: new Date().toISOString(),
    },
    {
      id: 'fc_02',
      claim: 'Central Banks quietly agreed to eliminate physical cash currencies by 2027.',
      claimant: 'Blog Speculation',
      rating: 'FALSE' as const,
      summary:
        'Central Bank Digital Currencies (CBDCs) are experimental supplements. Official policy frameworks explicitly mandate cash availability.',
      checker: 'Reuters Fact Check',
      sources: ['Bank for International Settlements', 'Federal Reserve Board Policy Release'],
      checkedAt: new Date().toISOString(),
    },
    {
      id: 'fc_03',
      claim: 'CERN set a new quantum entanglement record in particle collision density.',
      claimant: 'Physics Conference Dispatches',
      rating: 'TRUE' as const,
      summary:
        'Peer-reviewed measurements at the Large Hadron Collider confirm unprecedented quantum correlation metrics.',
      checker: 'Science Verification Network',
      sources: ['Physical Review Letters', 'CERN Directorate'],
      checkedAt: new Date().toISOString(),
    },
  ];

  for (const fc of factChecks) {
    const existing = await db.factChecks.findById(fc.id);
    if (!existing) {
      await db.factChecks.create(fc);
    }
  }

  // 7. Categories
  for (const cat of CANONICAL_CATEGORIES) {
    const existing = await db.categories.findBySlug(cat.slug);
    if (!existing) {
      await db.categories.create(cat);
    }
  }

  // 8. Navigation Tabs
  for (const tab of BASELINE_NAV_TABS) {
    const existing = await db.navTabs.findById(tab.tabId);
    if (!existing) {
      await db.navTabs.create(tab);
    } else {
      await db.navTabs.update(tab);
    }
  }

  logger.info('Database seeded successfully with enterprise newsroom records.');
}

if (require.main === module) {
  const dbInstance = new DatabaseService();
  dbInstance
    .initialize()
    .then(() => seedDatabase(dbInstance))
    .then(() => {
      logger.info('Database seeding completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
