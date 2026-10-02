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
import {
  type Story,
  type StoryVersion,
  CANONICAL_CATEGORIES,
  BASELINE_NAV_TABS,
} from '@ai-news/schemas';

export async function seedDatabase(db: DatabaseService): Promise<void> {
  logger.info('Starting enterprise database seed with canonical schema records...');

  // 0. Baseline Users
  const baselineUsers = [
    {
      id: 'usr_admin',
      organizationId: 'org_default',
      name: 'Elena Rostova',
      email: 'admin@news.platform',
      role: 'admin' as const,
      clientType: 'human_web' as const,
      status: 'active' as const,
      bio: 'Editor-in-Chief & Lead Newsroom Administrator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_editor',
      organizationId: 'org_default',
      name: 'Marcus Vance',
      email: 'editor@news.platform',
      role: 'editor' as const,
      clientType: 'human_web' as const,
      status: 'active' as const,
      bio: 'Senior Managing Editor for Global Desk',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_spark_agent',
      organizationId: 'org_default',
      name: 'Gemini Spark Agent',
      email: 'spark-agent@local.test',
      role: 'ai_agent' as const,
      clientType: 'gemini_spark' as const,
      status: 'active' as const,
      bio: 'Autonomous investigative reporter powered by Gemini 2.5 Flash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_chatgpt_agent',
      organizationId: 'org_default',
      name: 'ChatGPT Research Agent',
      email: 'chatgpt-agent@local.test',
      role: 'ai_agent' as const,
      clientType: 'chatgpt' as const,
      status: 'active' as const,
      bio: 'Deep-research and verification agent powered by OpenAI o3-mini',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const u of baselineUsers) {
    const existing = await db.users.findById(u.id);
    if (!existing) {
      await db.users.create(u);
    }
  }

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
    {
      id: 'top_semiconductors',
      organizationId: 'org_default',
      slug: 'semiconductors',
      name: 'Semiconductors',
      description: 'Advanced lithography, 2nm fabrication nodes, packaging, and wafer foundries.',
      aliases: ['chips', 'lithography', 'euv', 'foundries'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'top_ai_agents',
      organizationId: 'org_default',
      slug: 'autonomous-ai-agents',
      name: 'Autonomous AI Agents',
      description:
        'Agentic workflows, multi-agent collaboration, benchmarks, and production evaluation.',
      aliases: ['agents', 'autonomous-systems', 'llm-agents'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'top_macroeconomics',
      organizationId: 'org_default',
      slug: 'macroeconomics',
      name: 'Global Macroeconomics',
      description:
        'Central bank policies, sovereign liquidity facilities, currency reserves, and inflation benchmarks.',
      aliases: ['monetary-policy', 'central-banks', 'liquidity', 'currencies'],
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
    {
      id: 'src_techcrunch_01',
      organizationId: 'org_default',
      publisherId: 'pub_techcrunch',
      domain: 'techcrunch.com',
      url: 'https://techcrunch.com/2026/09/27/semiconductor-consortium-2nm-patent-pool',
      canonicalUrl: 'https://techcrunch.com/2026/09/27/semiconductor-consortium-2nm-patent-pool',
      title: 'Global Chipmakers Form Unified 2nm Patent Alliance',
      publisher: 'TechCrunch',
      author: 'Silicon & Hardware Desk',
      publishedAt: '2026-09-27T11:00:00Z',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'NEWS_ARTICLE' as const,
      permissibleExcerpt:
        'The consortium aligns High-NA EUV optical tolerances and chiplet packaging standards under a shared patent pool.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'src_bloomberg_01',
      organizationId: 'org_default',
      publisherId: 'pub_bloomberg',
      domain: 'bloomberg.com',
      url: 'https://bloomberg.com/news/articles/2026-09-29/central-banks-activate-liquidity-facility',
      canonicalUrl:
        'https://bloomberg.com/news/articles/2026-09-29/central-banks-activate-liquidity-facility',
      title: 'Central Banks Inaugurate Bilateral FX Clearing Grid',
      publisher: 'Bloomberg Markets',
      author: 'Global Financial Wire',
      publishedAt: '2026-09-29T13:30:00Z',
      retrievedAt: new Date().toISOString(),
      language: 'en',
      sourceType: 'NEWS_ARTICLE' as const,
      permissibleExcerpt:
        'The multilateral liquidity architecture mitigates settlement risk across currency pairs through automated collateral pledging.',
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

  // 4. Multi-Domain Editorial Stories
  const storiesToSeed: Array<{
    story: Story;
    versions: StoryVersion[];
  }> = [
    {
      story: {
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
        topicIds: ['top_brics_2026', 'top_geopolitics'],
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
        ],
      },
      versions: [
        {
          id: 'ver_brics_v1',
          storyId: 'sty_brics_flagship',
          versionNumber: 1,
          title: 'BRICS Expansion 2026: Preliminary Consensus Reached',
          summary: 'Summit opens with draft agreement on expanded membership.',
          changeSummary: 'Initial breaking news dispatch.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-09-26T07:00:00Z',
        },
        {
          id: 'ver_brics_v2',
          storyId: 'sty_brics_flagship',
          versionNumber: 2,
          title: 'BRICS Expansion 2026: Historic Geoeconomic Shift Finalized in New Delhi',
          summary:
            'Ten member nations formally ratify expansion protocols and introduce a multi-currency trade clearing architecture.',
          changeSummary:
            'Added What-Changed summary, D3 economic projection chart, and ratified declaration citations.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-09-26T10:00:00Z',
        },
      ],
    },
    {
      story: {
        id: 'sty_semi_01',
        organizationId: 'org_default',
        slug: 'global-semiconductor-consortium-formed',
        title: 'Global Semiconductor Consortium Establishes 2nm Lithography Standard',
        summary:
          'Leading fabrication foundries and research universities establish an open patent pool for advanced packaging and gate-all-around architectures.',
        status: 'PUBLISHED',
        articleType: 'technology',
        authorId: 'usr_chatgpt_agent',
        createdByClient: 'chatgpt',
        createdVia: 'mcp',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-09-27T12:00:00Z',
        createdAt: '2026-09-27T08:00:00Z',
        updatedAt: '2026-09-27T12:00:00Z',
        topicIds: ['top_semiconductors', 'top_ai_agents'],
        entityIds: ['ent_tsmc'],
        sourceIds: ['src_techcrunch_01', 'src_reuters_01'],
        blocks: [
          {
            id: 'blk_semi_sum',
            blockType: 'summary',
            sortOrder: 0,
            data: {
              headline: 'Consortium Highlights',
              bulletPoints: [
                'Unification of High-NA EUV optical tolerances across major equipment vendors.',
                'Open-standard chiplet interconnect framework targeting under 0.8pJ/bit power dissipation.',
              ],
            },
          },
          {
            id: 'blk_semi_lead',
            blockType: 'paragraph',
            sortOrder: 1,
            data: {
              text: 'TAIPEI — In a strategic shift toward interoperable fabrication, a coalition of top semiconductor foundries and research institutes announced a shared framework for 2-nanometer process nodes, aiming to reduce multi-billion-dollar R&D redundancies.',
              format: 'markdown',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_semi_v1',
          storyId: 'sty_semi_01',
          versionNumber: 1,
          title: 'Global Semiconductor Consortium Establishes 2nm Lithography Standard',
          summary:
            'Leading fabrication foundries and research universities establish an open patent pool for advanced packaging and gate-all-around architectures.',
          changeSummary: 'Initial publication of global lithography standard.',
          blocks: [],
          authorId: 'usr_chatgpt_agent',
          clientType: 'chatgpt',
          createdAt: '2026-09-27T12:00:00Z',
        },
      ],
    },
    {
      story: {
        id: 'sty_fusion_01',
        organizationId: 'org_default',
        slug: 'fusion-reactor-test-reaches-net-energy-gain',
        title: 'Magnetic Fusion Reactor Sustains Net Energy Gain for 120 Seconds',
        summary:
          'High-temperature superconducting magnets maintain steady-state fusion plasma at an unprecedented 1.35x Q-factor.',
        status: 'PUBLISHED',
        articleType: 'science',
        authorId: 'usr_spark_agent',
        createdByClient: 'gemini_spark',
        createdVia: 'mcp',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-09-28T07:30:00Z',
        createdAt: '2026-09-28T07:30:00Z',
        updatedAt: '2026-09-28T07:30:00Z',
        topicIds: ['top_energy_fusion'],
        entityIds: ['ent_india'],
        sourceIds: ['src_reuters_01'],
        blocks: [
          {
            id: 'blk_fusion_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'OXFORD — Experimental physicists achieved a major milestone toward grid-scale nuclear fusion, maintaining a plasma burning phase for two full minutes with a net positive energy return.',
              format: 'markdown',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_fusion_v1',
          storyId: 'sty_fusion_01',
          versionNumber: 1,
          title: 'Magnetic Fusion Reactor Sustains Net Energy Gain for 120 Seconds',
          summary:
            'High-temperature superconducting magnets maintain steady-state fusion plasma at an unprecedented 1.35x Q-factor.',
          changeSummary: 'First verified net-gain plasma containment run.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-09-28T07:30:00Z',
        },
      ],
    },
    {
      story: {
        id: 'sty_markets_01',
        organizationId: 'org_default',
        slug: 'central-banks-multilateral-liquidity-facility-operational',
        title: 'Sovereign Central Banks Operationalize Multilateral Liquidity Facility',
        summary:
          'A consortium of emerging and G20 central banks activates cross-border settlement channels with automated risk-hedging corridors.',
        status: 'PUBLISHED',
        articleType: 'business',
        authorId: 'usr_admin',
        createdByClient: 'human_web',
        createdVia: 'admin',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-09-29T14:00:00Z',
        createdAt: '2026-09-29T11:00:00Z',
        updatedAt: '2026-09-29T14:00:00Z',
        topicIds: ['top_macroeconomics', 'top_geopolitics'],
        entityIds: ['ent_india'],
        sourceIds: ['src_bloomberg_01', 'src_hindu_02'],
        blocks: [
          {
            id: 'blk_markets_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'BASEL — Central monetary authorities confirmed operational readiness for multi-currency clearing grids, providing real-time liquidity swaps without USD intermediary routing.',
              format: 'markdown',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_markets_v1',
          storyId: 'sty_markets_01',
          versionNumber: 1,
          title: 'Sovereign Central Banks Operationalize Multilateral Liquidity Facility',
          summary:
            'A consortium of emerging and G20 central banks activates cross-border settlement channels with automated risk-hedging corridors.',
          changeSummary: 'Operational launch verification.',
          blocks: [],
          authorId: 'usr_admin',
          clientType: 'human_web',
          createdAt: '2026-09-29T14:00:00Z',
        },
      ],
    },
    {
      story: {
        id: 'sty_ai_01',
        organizationId: 'org_default',
        slug: 'autonomous-ai-agents-code-generation-benchmark',
        title:
          'Autonomous AI Agents Surpass Human Verification Benchmarks in Critical Infrastructure',
        summary:
          'Rigorous evaluations across telecommunications and power grids demonstrate multi-agent verification loops achieve 99.98% zero-defect rate.',
        status: 'PUBLISHED',
        articleType: 'technology',
        authorId: 'usr_spark_agent',
        createdByClient: 'gemini_spark',
        createdVia: 'mcp',
        currentVersionNumber: 1,
        heroImageUrl:
          'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=80',
        publishedAt: '2026-09-30T09:15:00Z',
        createdAt: '2026-09-30T08:00:00Z',
        updatedAt: '2026-09-30T09:15:00Z',
        topicIds: ['top_ai_agents', 'top_semiconductors'],
        entityIds: ['ent_tsmc'],
        sourceIds: ['src_techcrunch_01', 'src_reuters_01'],
        blocks: [
          {
            id: 'blk_ai_lead',
            blockType: 'paragraph',
            sortOrder: 0,
            data: {
              text: 'SAN FRANCISCO — Autonomous agent teams operating under formal verification architectures have demonstrated zero-defect deployment across multi-tier production telemetry systems.',
              format: 'markdown',
            },
          },
        ],
      },
      versions: [
        {
          id: 'ver_ai_v1',
          storyId: 'sty_ai_01',
          versionNumber: 1,
          title:
            'Autonomous AI Agents Surpass Human Verification Benchmarks in Critical Infrastructure',
          summary:
            'Rigorous evaluations across telecommunications and power grids demonstrate multi-agent verification loops achieve 99.98% zero-defect rate.',
          changeSummary: 'Benchmark publication release.',
          blocks: [],
          authorId: 'usr_spark_agent',
          clientType: 'gemini_spark',
          createdAt: '2026-09-30T09:15:00Z',
        },
      ],
    },
  ];

  for (const item of storiesToSeed) {
    const existingStory = await db.stories.findById(item.story.id);
    if (!existingStory) {
      await db.stories.create(item.story);
      for (const ver of item.versions) {
        await db.stories.createVersion(ver);
      }
    }
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
