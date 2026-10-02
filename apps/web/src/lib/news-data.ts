import type { Story } from '@ai-news/schemas';

export interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: string;
  forecast: Array<{ day: string; temp: number; icon: string }>;
}

export interface FactCheckItem {
  id: string;
  claim: string;
  claimant: string;
  checker: string;
  checkerLogo?: string;
  rating: 'TRUE' | 'FALSE' | 'PARTLY TRUE' | 'MISLEADING';
  summary: string;
  factCheckUrl: string;
}

export interface TrendingTopic {
  id: string;
  tag: string;
  query: string;
  volume: string;
}

export interface RelatedSourceArticle {
  id: string;
  publisher: string;
  publisherLogo?: string;
  headline: string;
  timeAgo: string;
  url: string;
  thumbnailUrl?: string;
}

export interface GoogleNewsCluster {
  id: string;
  mainStoryId: string;
  title: string;
  summary: string;
  category: 'India' | 'World' | 'Business' | 'Technology' | 'Science' | 'Health' | 'Sports';
  leadStory: {
    slug: string;
    headline: string;
    publisher: string;
    publisherLogo?: string;
    timeAgo: string;
    imageUrl: string;
    author: string;
    excerpt: string;
    isSubscriberOnly?: boolean;
  };
  relatedArticles: RelatedSourceArticle[];
  timeline?: Array<{ time: string; headline: string; publisher: string }>;
  perspectives?: Array<{ publisher: string; stance: string; headline: string; url: string }>;
}

export interface FullCoverageCluster {
  storyId: string;
  title: string;
  summary: string;
  perspectives: Array<{
    publisher: string;
    headline: string;
    sourceType: string;
    url: string;
    excerpt: string;
    timeAgo: string;
    tone: 'analytical' | 'optimistic' | 'cautious' | 'official';
  }>;
  timeline: Array<{
    time: string;
    headline: string;
    detail: string;
  }>;
  factCheck: {
    verdict: 'VERIFIED' | 'DEVELOPING' | 'DISPUTED';
    confidence: number;
    officialSources: string[];
    verificationNote: string;
  };
}

export const DEMO_FULL_COVERAGE: Record<string, FullCoverageCluster> = {
  'brics-2026-summit-ratifies-landmark-trade-pact': {
    storyId: 'sty_brics_2026',
    title: 'Full Coverage: BRICS 2026 Sovereign Settlement Framework',
    summary:
      'Ten nations agree to bypass third-party clearing currencies, establishing a real-time bilateral settlement and open AI compute pact.',
    perspectives: [
      {
        publisher: 'The Hindu',
        headline: 'Bilateral Currency Clearing Accord Ratified Across 10 Member States',
        sourceType: 'Lead Analysis',
        url: '#',
        excerpt:
          'The protocol establishes an automated settlement ledger eliminating multi-currency conversion friction across 3.6 billion citizens.',
        timeAgo: '2 hours ago',
        tone: 'analytical',
      },
      {
        publisher: 'Reuters',
        headline:
          'Ten Nations Agree on Local-Currency Clearing Protocol to Reduce Dollar Dependency',
        sourceType: 'Global Wire',
        url: 'https://reuters.example.com',
        excerpt:
          'Non-dollar bilateral trade accounted for 38% of members commerce last quarter; new mechanisms aim to push this past 60% by 2028.',
        timeAgo: '1 hour ago',
        tone: 'cautious',
      },
      {
        publisher: 'NDTV News',
        headline:
          'Commerce Minister: Indian Exporters to Gain Instant Liquidity Under Bilateral Invoicing',
        sourceType: 'Regional Impact',
        url: 'https://ndtv.example.com',
        excerpt:
          'Engineering and pharmaceutical export associations welcome direct rupee clearing mechanisms, reducing invoice processing times from 4 days to real time.',
        timeAgo: '45 mins ago',
        tone: 'optimistic',
      },
      {
        publisher: 'BRICS Summit Secretariat',
        headline: 'New Delhi Declaration: Leaders Joint Communiqué on Sustainable Growth and AI',
        sourceType: 'Official Document',
        url: 'https://secretariat.brics2026.gov',
        excerpt:
          'We resolve to establish an open technological exchange framework ensuring equitable access to advanced compute and energy resources.',
        timeAgo: '3 hours ago',
        tone: 'official',
      },
    ],
    timeline: [
      {
        time: '08:30 AM',
        headline: 'Ministerial Working Session',
        detail: 'Central bank governors review final currency swap and liquidity thresholds.',
      },
      {
        time: '11:45 AM',
        headline: 'Plenary Accord Approved',
        detail: 'All 10 delegation heads sign the Comprehensive Economic Integration Protocol.',
      },
      {
        time: '02:15 PM',
        headline: 'Digital Clearing Pilot Announced',
        detail:
          'Technical pilot scheduled to settle energy and agricultural cargo across three corridors.',
      },
      {
        time: '04:30 PM',
        headline: 'Joint Press Declaration Released',
        detail: 'Leaders address international media at Bharat Mandapam, New Delhi.',
      },
    ],
    factCheck: {
      verdict: 'VERIFIED',
      confidence: 0.98,
      officialSources: [
        'Ministry of External Affairs Gazette',
        'BRICS Summit Official Communiqué',
        'Reserve Bank Registry',
      ],
      verificationNote:
        'Primary documents cross-referenced across 4 official national gazettes and sovereign bank declarations.',
    },
  },
  'global-semiconductor-consortium-formed': {
    storyId: 'sty_semi_01',
    title: 'Full Coverage: Global 2nm Semiconductor Consortium',
    summary:
      'Cross-foundry alliance standardizing High-NA EUV tolerances, packaging, and open-source chiplet interconnect topologies.',
    perspectives: [
      {
        publisher: 'EE Times',
        headline: 'Foundry Giants Pool Patents for Gate-All-Around 2nm Nodes',
        sourceType: 'Technical Analysis',
        url: '#',
        excerpt:
          'The alliance standardizes dielectric spacing and interconnect physics to slash multi-billion dollar R&D duplication.',
        timeAgo: '3 hours ago',
        tone: 'analytical',
      },
      {
        publisher: 'The Verge',
        headline: 'Why the 2nm Chip Alliance Could Speed Up Next-Gen Smartphone Processors',
        sourceType: 'Consumer Tech',
        url: 'https://theverge.example.com',
        excerpt:
          'Consumers could see the first commercial fruits of the partnership in 2027 flagships with up to 35% lower battery draw.',
        timeAgo: '2 hours ago',
        tone: 'optimistic',
      },
      {
        publisher: 'The Wall Street Journal',
        headline: 'Chipmakers Target Multi-Billion Dollar R&D Synergies in Open Standards Push',
        sourceType: 'Financial Coverage',
        url: 'https://wsj.example.com',
        excerpt:
          'Soaring fab construction costs have forced historical rivals to share non-differentiating baseline lithography infrastructure.',
        timeAgo: '4 hours ago',
        tone: 'cautious',
      },
    ],
    timeline: [
      {
        time: '09:00 AM',
        headline: 'Consortium Charter Ratified',
        detail: 'TSMC, Intel, and Samsung technical leaders sign the standard protocol.',
      },
      {
        time: '12:00 PM',
        headline: 'High-NA EUV Tolerances Released',
        detail: 'Optical specifications published to equipment vendors.',
      },
      {
        time: '03:30 PM',
        headline: 'Joint Test Pilot Date Set for Q2 2027',
        detail: 'Initial 300mm test wafers to be processed at Hsinchu pilot facility.',
      },
    ],
    factCheck: {
      verdict: 'VERIFIED',
      confidence: 0.96,
      officialSources: ['Consortium Memorandum of Understanding', 'SEMICON International Briefing'],
      verificationNote:
        'Cross-licensing agreements verified with corporate filings across Taiwan, US, and South Korea jurisdictions.',
    },
  },
  'fusion-reactor-test-reaches-net-energy-gain': {
    storyId: 'sty_fusion_01',
    title: 'Full Coverage: 120-Second Steady-State Fusion Energy Milestone',
    summary:
      'Magnetic confinement fusion reactor sustains burning plasma phase at 1.35x Q-factor for 120 consecutive seconds.',
    perspectives: [
      {
        publisher: 'Nature News',
        headline: 'Physicists Verify Steady Burning Plasma for Record Two Minutes',
        sourceType: 'Scientific Journal',
        url: '#',
        excerpt:
          'High-temperature superconducting coils maintained magnetohydrodynamic equilibrium without disruptive wall collisions.',
        timeAgo: '5 hours ago',
        tone: 'analytical',
      },
      {
        publisher: 'BBC News',
        headline: 'Scientists Hail Two-Minute Fusion Milestone as Grid-Scale Power Step',
        sourceType: 'General News',
        url: 'https://bbc.example.com',
        excerpt:
          'The breakthrough brings commercial clean baseload fusion power significantly closer to reality.',
        timeAgo: '3 hours ago',
        tone: 'optimistic',
      },
    ],
    timeline: [
      {
        time: '06:00 AM',
        headline: 'Plasma Ignition Test Commences',
        detail: 'Deuterium-tritium fuel pellet injection begins in tokamak vacuum chamber.',
      },
      {
        time: '07:30 AM',
        headline: '120-Second Milestone Reached',
        detail: 'Superconducting magnet telemetry confirms stable 1.35x energy output.',
      },
    ],
    factCheck: {
      verdict: 'VERIFIED',
      confidence: 0.99,
      officialSources: [
        'Culham Centre Fusion Diagnostics Log',
        'International Atomic Energy Agency Peer Review',
      ],
      verificationNote:
        'Independent neutron sensor telemetry verified by UK Atomic Energy Authority.',
    },
  },
};

export const LOCAL_WEATHER: WeatherData = {
  city: 'New Delhi',
  temperature: 28,
  condition: 'Partly Cloudy',
  icon: '🌤️',
  humidity: 62,
  windSpeed: '12 km/h',
  forecast: [
    { day: 'Sun', temp: 28, icon: '🌤️' },
    { day: 'Mon', temp: 30, icon: '☀️' },
    { day: 'Tue', temp: 29, icon: '⛅' },
    { day: 'Wed', temp: 27, icon: '🌧️' },
  ],
};

export const TRENDING_TOPICS: TrendingTopic[] = [
  { id: 't1', tag: 'BRICS 2026 Summit', query: 'brics', volume: '125K searches' },
  { id: 't2', tag: '2nm Semiconductor Alliance', query: 'semiconductor', volume: '94K searches' },
  { id: 't3', tag: 'Nuclear Fusion Milestone', query: 'fusion', volume: '82K searches' },
  { id: 't4', tag: 'Federal Reserve Policy', query: 'fed', volume: '67K searches' },
  { id: 't5', tag: 'Sodium-Ion Battery EV', query: 'battery', volume: '54K searches' },
  { id: 't6', tag: 'Quantum Satellite Network', query: 'quantum', volume: '43K searches' },
];

export const FACT_CHECKS: FactCheckItem[] = [
  {
    id: 'fc_1',
    claim:
      'BRICS summit established an mandatory single common currency replacing national currencies immediately.',
    claimant: 'Social Media Viral Posts',
    checker: 'BoomLive / Reuters Fact Check',
    rating: 'FALSE',
    summary:
      'The accord ratifies bilateral settlement in existing local sovereign currencies (Rupees, Dirhams, Reais), not a single unified currency.',
    factCheckUrl: '#',
  },
  {
    id: 'fc_2',
    claim:
      'The 2nm lithography alliance allows open commercial patent access without licensing fees.',
    claimant: 'Tech Blog Reports',
    checker: 'AFP Fact Check',
    rating: 'PARTLY TRUE',
    summary:
      'Academic and pre-competitive research frameworks are open, while commercial foundry fabrication requires consortium cross-licensing.',
    factCheckUrl: '#',
  },
];

export const GOOGLE_NEWS_CLUSTERS: GoogleNewsCluster[] = [
  {
    id: 'cluster_brics',
    mainStoryId: 'sty_brics_2026',
    title: 'BRICS 2026 Summit Ratifies Landmark Trade Accord in New Delhi',
    summary:
      'Ten member nations agree on direct bilateral currency settlements and launch joint AI scientific compute standards.',
    category: 'World',
    leadStory: {
      slug: 'brics-2026-summit-ratifies-landmark-trade-pact',
      headline: 'BRICS 2026 Summit Ratifies Landmark Trade Accord in New Delhi',
      publisher: 'The Hindu',
      timeAgo: '2 hours ago',
      imageUrl:
        'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
      author: 'Diplomatic Bureau',
      excerpt:
        'Delegates representing the expanded 10-nation bloc finalized terms for sovereign bilateral clearing accounts at Bharat Mandapam, New Delhi.',
    },
    relatedArticles: [
      {
        id: 'rel_reuters',
        publisher: 'Reuters',
        headline:
          'Ten Nations Agree on Local-Currency Clearing Protocol to Reduce Dollar Dependency',
        timeAgo: '1 hour ago',
        url: 'https://reuters.example.com',
      },
      {
        id: 'rel_ndtv',
        publisher: 'NDTV News',
        headline:
          'Commerce Minister: Indian Exporters to Gain Instant Liquidity Under Bilateral Invoicing',
        timeAgo: '45 mins ago',
        url: 'https://ndtv.example.com',
      },
      {
        id: 'rel_bloomberg',
        publisher: 'Bloomberg',
        headline: 'Trade Volume Across Emerging Economies Surges Past $2.1 Trillion',
        timeAgo: '3 hours ago',
        url: 'https://bloomberg.example.com',
      },
    ],
    timeline: [
      {
        time: '09:00 AM',
        headline: 'Inaugural Plenary Address by Heads of State',
        publisher: 'Official Secretariat',
      },
      {
        time: '01:30 PM',
        headline: 'Bilateral Currency Clearing Accord Signed',
        publisher: 'The Hindu',
      },
      {
        time: '04:15 PM',
        headline: 'Joint Communiqué Released to International Press',
        publisher: 'Reuters',
      },
    ],
    perspectives: [
      {
        publisher: 'The Hindu',
        stance: 'Regional Economic Impact',
        headline: 'Bilateral mechanism protects domestic suppliers from exchange volatility',
        url: '#',
      },
      {
        publisher: 'Reuters',
        stance: 'Global Finance Analysis',
        headline: 'Gradual diversification in foreign exchange reserve management',
        url: '#',
      },
      {
        publisher: 'Financial Times',
        stance: 'Institutional Banking View',
        headline: 'Central banks test digital infrastructure for cross-border reconciliation',
        url: '#',
      },
    ],
  },
  {
    id: 'cluster_chips',
    mainStoryId: 'sty_semi_01',
    title: 'Global Semiconductor Consortium Establishes 2nm Lithography Standard',
    summary:
      'Leading foundries unite on High-NA EUV optical tolerances and open chiplet packaging standards.',
    category: 'Technology',
    leadStory: {
      slug: 'global-semiconductor-consortium-formed',
      headline: 'Global Semiconductor Consortium Establishes 2nm Lithography Standard in Taipei',
      publisher: 'EE Times',
      timeAgo: '3 hours ago',
      imageUrl:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      author: 'Silicon Technology Desk',
      excerpt:
        'Foundry giants and leading research universities established an open patent pool for 2-nanometer gate-all-around architectures.',
      isSubscriberOnly: true,
    },
    relatedArticles: [
      {
        id: 'rel_verge',
        publisher: 'The Verge',
        headline: 'Why the 2nm Chip Alliance Could Speed Up Next-Gen Smartphone Processors',
        timeAgo: '2 hours ago',
        url: 'https://theverge.example.com',
      },
      {
        id: 'rel_wsj',
        publisher: 'The Wall Street Journal',
        headline: 'Chipmakers Target Multi-Billion Dollar R&D Synergies in Open Standards Push',
        timeAgo: '4 hours ago',
        url: 'https://wsj.example.com',
      },
    ],
  },
  {
    id: 'cluster_fusion',
    mainStoryId: 'sty_fusion_01',
    title: 'Magnetic Fusion Reactor Sustains Net Energy Gain for 120 Seconds',
    summary:
      'Superconducting magnets maintain steady-state plasma at 1.35x Q-factor at Oxfordshire facility.',
    category: 'Science',
    leadStory: {
      slug: 'fusion-reactor-test-reaches-net-energy-gain',
      headline: 'Magnetic Fusion Reactor Sustains Net Energy Gain for 120 Seconds',
      publisher: 'Nature News',
      timeAgo: '5 hours ago',
      imageUrl:
        'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
      author: 'Physics Correspondent',
      excerpt:
        'Physicists maintained steady-state burning plasma at a record 1.35x Q-factor for two full minutes.',
      isSubscriberOnly: true,
    },
    relatedArticles: [
      {
        id: 'rel_bbc',
        publisher: 'BBC News',
        headline: 'Scientists Hail Two-Minute Fusion Milestone as Grid-Scale Power Step',
        timeAgo: '3 hours ago',
        url: 'https://bbc.example.com',
      },
      {
        id: 'rel_guardian',
        publisher: 'The Guardian',
        headline: 'What 120 Seconds of Clean Fusion Means for Global Decarbonization Targets',
        timeAgo: '4 hours ago',
        url: 'https://theguardian.example.com',
      },
    ],
  },
  {
    id: 'cluster_fed',
    mainStoryId: 'sty_fed_rate_cut',
    title: 'Federal Reserve Signals Neutral Monetary Policy Shift as Inflation Cools',
    summary: 'Policymakers cite consistent progress toward consumer price stability.',
    category: 'Business',
    leadStory: {
      slug: 'fed-rate-cut-signals-global-market-impact',
      headline: 'Federal Reserve Signals Neutral Rate Shift as Inflation Moderates to Target',
      publisher: 'CNBC',
      timeAgo: '4 hours ago',
      imageUrl:
        'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
      author: 'Federal Reserve Correspondent',
      excerpt:
        'Minutes from the latest Federal Open Market Committee confirmed a synchronized pivot toward neutral policy settings.',
    },
    relatedArticles: [
      {
        id: 'rel_ft',
        publisher: 'Financial Times',
        headline: 'Treasury Yields Drop as Traders Price in Consecutive Rate Adjustments',
        timeAgo: '2 hours ago',
        url: 'https://ft.example.com',
      },
    ],
  },
  {
    id: 'cluster_battery',
    mainStoryId: 'sty_sodium_battery',
    title: 'Automakers Accelerate Sodium-Ion Battery Rollout to Cut EV Prices by 25%',
    summary: 'Commercial energy density breakthroughs eliminate lithium and cobalt dependence.',
    category: 'Technology',
    leadStory: {
      slug: 'sodium-ion-battery-breakthrough-ev-costs',
      headline: 'Automakers Accelerate Sodium-Ion Battery Rollout to Cut EV Prices by 25%',
      publisher: 'Autocar',
      timeAgo: '6 hours ago',
      imageUrl:
        'https://images.unsplash.com/photo-1558441719-74375b47a164?auto=format&fit=crop&w=1200&q=80',
      author: 'Automotive Intelligence',
      excerpt:
        'Automotive manufacturers kick off volume assembly of sodium-ion battery packs for compact urban electric vehicles.',
    },
    relatedArticles: [
      {
        id: 'rel_electrek',
        publisher: 'Electrek',
        headline: 'Sodium-Ion vs LFP: Which Battery Chemistry Wins the Budget EV Market?',
        timeAgo: '4 hours ago',
        url: 'https://electrek.example.com',
      },
    ],
  },
  {
    id: 'cluster_explain',
    mainStoryId: 'sty_et_explainer_clearing',
    title: 'Explainer: How Sovereign Bilateral Currency Clearing Works',
    summary: 'A deep dive into cross-border local currency settlement mechanisms.',
    category: 'Business',
    leadStory: {
      slug: 'et-explainer-how-bilateral-clearing-works',
      headline: 'Explainer: How Sovereign Bilateral Currency Clearing Works',
      publisher: 'Mint',
      timeAgo: '7 hours ago',
      imageUrl:
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
      author: 'Financial Explainer Bureau',
      excerpt:
        'Understanding how reciprocal trade accounts allow sovereign nations to trade goods without intermediary correspondent fees.',
    },
    relatedArticles: [
      {
        id: 'rel_theprint',
        publisher: 'ThePrint',
        headline: 'Why Local Currency Clearing Is Becoming Central to Global Trade Strategy',
        timeAgo: '5 hours ago',
        url: 'https://theprint.example.com',
      },
    ],
  },
];

export const EXTENDED_NEWS_STORIES: Story[] = [
  {
    id: 'sty_brics_2026',
    organizationId: 'org_default',
    slug: 'brics-2026-summit-ratifies-landmark-trade-pact',
    title: 'BRICS 2026 Summit Ratifies Landmark Trade Accord in New Delhi',
    summary:
      'Delegates representing the expanded 10-nation bloc finalize terms for sovereign local-currency settlements and launch joint AI compute standards.',
    status: 'PUBLISHED',
    articleType: 'developing_story',
    currentVersionNumber: 3,
    currentVersionId: 'ver_brics_v3',
    topicIds: ['top_brics_2026', 'top_global_trade', 'top_ai_policy'],
    entityIds: ['ent_india', 'ent_china', 'ent_brazil', 'ent_russia', 'ent_south_africa'],
    sourceIds: ['src_reuters', 'src_bloomberg', 'src_official'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'admin',
    createdByClient: 'human_web',
    authorId: 'usr_arjun_nambiar',
    publishedAt: '2026-09-27T08:45:00Z',
    createdAt: '2026-09-27T06:00:00Z',
    updatedAt: '2026-09-27T08:45:00Z',
    blocks: [
      {
        id: 'sum_brics',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Key Takeaways & Highlights',
          bulletPoints: [
            'Bilateral currency clearing mechanisms officially established across 10 member states.',
            'Direct local-currency trade eliminates intermediate foreign exchange conversion fees.',
            'Creation of a $50B clean tech and microelectronics transition financing facility.',
            'Adoption of the New Delhi AI Governance Framework for open scientific research.',
          ],
        },
      },
      {
        id: 'p_lead',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'NEW DELHI — In a decisive conclusion to the 18th annual diplomatic summit, heads of state ratified the Comprehensive Economic Integration Protocol, creating an automated bilateral settlement network designed to facilitate commerce across 3.6 billion citizens.',
          format: 'markdown',
        },
      },
      {
        id: 'quote_leader',
        blockType: 'quote',
        sortOrder: 2,
        data: {
          quote:
            'Our goal is not isolation, but resilience. By building resilient financial infrastructure and pooling computational research, we establish an engine for shared prosperity.',
          attribution: 'Summit Conference Chair',
          title: 'Plenary Closing Address',
        },
      },
      {
        id: 'p_detail',
        blockType: 'paragraph',
        sortOrder: 3,
        data: {
          text: 'Industry federations in manufacturing and agriculture highlighted that direct settlement reduces invoice cycle latency from three business days to near-instantaneous confirmations. The protocol introduces an algorithmic netting corridor that clears imbalances on a bi-weekly cycle.',
          format: 'markdown',
        },
      },
      {
        id: 'tl_summit',
        blockType: 'timeline',
        sortOrder: 4,
        data: {
          title: 'Summit Milestone Chronology',
          items: [
            {
              date: 'Day 1 • 09:00 AM',
              headline: 'Opening Session',
              body: 'Delegations arrive and confirm the final agenda.',
            },
            {
              date: 'Day 2 • 02:00 PM',
              headline: 'Financial Ministers Accord',
              body: 'Technical working groups harmonize clearing protocol.',
            },
            {
              date: 'Day 3 • 04:30 PM',
              headline: 'Unanimous Adoption',
              body: 'Final joint declaration ratified and released to international press.',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'sty_semi_01',
    organizationId: 'org_default',
    slug: 'global-semiconductor-consortium-formed',
    title: 'Global Semiconductor Consortium Establishes 2nm Lithography Standard',
    summary:
      'Leading fabrication foundries and research institutes establish an open patent pool for advanced packaging and gate-all-around architectures.',
    status: 'PUBLISHED',
    articleType: 'technology',
    currentVersionNumber: 2,
    currentVersionId: 'ver_semi_v2',
    topicIds: ['top_semiconductors', 'top_ai_hardware'],
    entityIds: ['ent_tsmc', 'ent_intel', 'ent_samsung'],
    sourceIds: ['src_reuters'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'mcp',
    createdByClient: 'gemini_spark',
    authorId: 'usr_gemini_spark_agent',
    publishedAt: '2026-09-27T07:00:00Z',
    createdAt: '2026-09-27T05:00:00Z',
    updatedAt: '2026-09-27T07:00:00Z',
    blocks: [
      {
        id: 'sum_semi',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Consortium Highlights',
          bulletPoints: [
            'Unification of High-NA EUV optical tolerances across major equipment vendors.',
            'Open-standard chiplet interconnect framework targeting under 0.8pJ/bit power dissipation.',
            'Joint pilot lines expected to yield first commercial test wafers by Q2 2027.',
          ],
        },
      },
      {
        id: 'p_semi',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'TAIPEI — In a strategic shift toward interoperable fabrication, a coalition of top semiconductor foundries and research institutes announced a shared framework for 2-nanometer process nodes, aiming to reduce multi-billion-dollar R&D redundancies.',
          format: 'markdown',
        },
      },
    ],
  },
  {
    id: 'sty_fusion_01',
    organizationId: 'org_default',
    slug: 'fusion-reactor-test-reaches-net-energy-gain',
    title: 'Magnetic Fusion Reactor Sustains Net Energy Gain for 120 Seconds',
    summary:
      'High-temperature superconducting magnets maintain steady-state fusion plasma at an unprecedented 1.35x Q-factor.',
    status: 'PUBLISHED',
    articleType: 'science',
    currentVersionNumber: 1,
    currentVersionId: 'ver_fusion_v1',
    topicIds: ['top_clean_energy', 'top_physics'],
    entityIds: ['ent_iter', 'ent_mit'],
    sourceIds: ['src_reuters'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'mcp',
    createdByClient: 'gemini',
    authorId: 'usr_gemini_agent',
    publishedAt: '2026-09-27T05:00:00Z',
    createdAt: '2026-09-27T04:00:00Z',
    updatedAt: '2026-09-27T05:00:00Z',
    blocks: [
      {
        id: 'p_fusion',
        blockType: 'paragraph',
        sortOrder: 0,
        data: {
          text: 'OXFORD — Experimental physicists achieved a major milestone toward grid-scale nuclear fusion, maintaining a plasma burning phase for two full minutes with a net positive energy return.',
          format: 'markdown',
        },
      },
    ],
  },
  {
    id: 'sty_fed_rate_cut',
    organizationId: 'org_default',
    slug: 'fed-rate-cut-signals-global-market-impact',
    title: 'Federal Reserve Signals Neutral Rate Shift as Inflation Moderates to Target',
    summary:
      'Policymakers highlight consistent progress on consumer price stability, opening the door for consecutive quarter-point policy rate reductions.',
    status: 'PUBLISHED',
    articleType: 'business',
    currentVersionNumber: 1,
    currentVersionId: 'ver_fed_v1',
    topicIds: ['top_economy', 'top_markets'],
    entityIds: ['ent_fed', 'ent_us_treasury'],
    sourceIds: ['src_bloomberg'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'web',
    createdByClient: 'human_web',
    authorId: 'usr_elena_vance',
    publishedAt: '2026-09-27T06:30:00Z',
    createdAt: '2026-09-27T05:30:00Z',
    updatedAt: '2026-09-27T06:30:00Z',
    blocks: [
      {
        id: 'sum_fed',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Monetary Policy Snapshot',
          bulletPoints: [
            'Core PCE inflation measures decline to 2.4% annualized rate.',
            'Benchmark Fed funds rate projected to reach 3.75% by mid-2027.',
            'Emerging market central banks gain currency leeway to lower domestic borrowing costs.',
          ],
        },
      },
      {
        id: 'p_fed',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'WASHINGTON — The Federal Open Market Committee minutes confirmed a synchronized pivot toward a neutral monetary stance, citing sustained labor market equilibrium and moderating shelter costs.',
          format: 'markdown',
        },
      },
    ],
  },
  {
    id: 'sty_sodium_battery',
    organizationId: 'org_default',
    slug: 'sodium-ion-battery-breakthrough-ev-costs',
    title: 'Automakers Accelerate Sodium-Ion Battery Rollout to Cut EV Prices by 25%',
    summary:
      'Commercial energy density breakthroughs eliminate lithium and cobalt dependence in mass-market city electric vehicles.',
    status: 'PUBLISHED',
    articleType: 'technology',
    currentVersionNumber: 1,
    currentVersionId: 'ver_na_v1',
    topicIds: ['top_clean_energy', 'top_automotive'],
    entityIds: ['ent_catl', 'ent_byd', 'ent_tata'],
    sourceIds: ['src_bloomberg'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1558441719-74375b47a164?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'web',
    createdByClient: 'human_web',
    authorId: 'usr_vikram_roy',
    publishedAt: '2026-09-27T04:30:00Z',
    createdAt: '2026-09-27T03:30:00Z',
    updatedAt: '2026-09-27T04:30:00Z',
    blocks: [
      {
        id: 'sum_na',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Battery Innovation Breakdown',
          bulletPoints: [
            'Gravimetric density reaches 185 Wh/kg, sufficient for 320km city commute ranges.',
            'Raw material costs drop by over 60% compared to nickel-manganese-cobalt (NMC) cells.',
            'Superior cold-weather discharge performance retains 88% capacity at -20°C.',
          ],
        },
      },
      {
        id: 'p_na',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'SHANGHAI/PUNE — Major automotive manufacturers have kicked off volume assembly of sodium-ion battery packs, targeting sub-$12,000 compact electric passenger cars by late 2026.',
          format: 'markdown',
        },
      },
    ],
  },
  {
    id: 'sty_et_explainer_clearing',
    organizationId: 'org_default',
    slug: 'et-explainer-how-bilateral-clearing-works',
    title: 'Explainer: How Sovereign Bilateral Currency Clearing Works',
    summary:
      'A deep dive into cross-border local currency settlement: How rupees, dirhams, yuan, and reals clear without third-party correspondent banks.',
    status: 'PUBLISHED',
    articleType: 'explainer',
    currentVersionNumber: 1,
    currentVersionId: 'ver_exp_v1',
    topicIds: ['top_economy', 'top_markets'],
    entityIds: ['ent_rbi', 'ent_brics'],
    sourceIds: ['src_official'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'web',
    createdByClient: 'human_web',
    authorId: 'usr_ananya_sen',
    publishedAt: '2026-09-27T03:00:00Z',
    createdAt: '2026-09-27T02:00:00Z',
    updatedAt: '2026-09-27T03:00:00Z',
    blocks: [
      {
        id: 'p_exp_1',
        blockType: 'paragraph',
        sortOrder: 0,
        data: {
          text: 'Cross-border commerce has historically depended on a web of intermediary correspondent banks in New York or London. Bilateral clearing matches reciprocal trade balances directly through specialized central bank nostro accounts.',
          format: 'markdown',
        },
      },
    ],
  },
  {
    id: 'sty_pick_robotics_01',
    organizationId: 'org_default',
    slug: 'humanoid-robotics-factory-floor-deployment-automotive',
    title: 'Humanoid Robotics Accelerate 24/7 Factory Floor Deployment in Automotive Assembly',
    summary:
      'Autonomous bipedal robots achieve 99.4% task completion rates in high-precision battery pack assembly and chassis wiring.',
    status: 'PUBLISHED',
    articleType: 'technology',
    currentVersionNumber: 1,
    currentVersionId: 'ver_robotics_v1',
    topicIds: ['top_ai_agents', 'top_semiconductors'],
    entityIds: ['ent_demis_hassabis', 'ent_jensen_huang'],
    sourceIds: ['src_techcrunch'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'mcp',
    createdByClient: 'gemini_spark',
    authorId: 'usr_spark_agent',
    publishedAt: '2026-10-02T11:00:00Z',
    createdAt: '2026-10-02T09:00:00Z',
    updatedAt: '2026-10-02T11:00:00Z',
    blocks: [
      {
        id: 'sum_robotics',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Robotics Assembly Milestones',
          bulletPoints: [
            'Continuous 24-hour shift cycle validation across two commercial pilot plants.',
            'Sub-millimeter connector insertion precision using tactile feedback sensors.',
            'Zero safety halts recorded over 120,000 cumulative autonomous production hours.',
          ],
        },
      },
      {
        id: 'p_robotics_lead',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'STUTTGART/DETROIT — Commercial automotive manufacturing reached an autonomous inflection point as bipedal humanoid robots took over continuous battery module wiring across two high-volume assembly lines, operating without human intervention.',
          format: 'markdown',
        },
      },
    ],
  },
  {
    id: 'sty_pick_neuromorphic_01',
    organizationId: 'org_default',
    slug: 'neuromorphic-ai-chips-edge-inference-power-cut',
    title: 'Neuromorphic AI Chips Cut Edge Inference Power by 90% in Drone and Satellite Tests',
    summary:
      'Event-based spiking neural network silicon delivers sub-watt real-time computer vision without thermal throttling in extreme environments.',
    status: 'PUBLISHED',
    articleType: 'technology',
    currentVersionNumber: 1,
    currentVersionId: 'ver_neuro_v1',
    topicIds: ['top_semiconductors', 'top_ai_agents'],
    entityIds: ['ent_demis_hassabis'],
    sourceIds: ['src_nature'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'mcp',
    createdByClient: 'chatgpt',
    authorId: 'usr_chatgpt_agent',
    publishedAt: '2026-10-02T11:15:00Z',
    createdAt: '2026-10-02T09:30:00Z',
    updatedAt: '2026-10-02T11:15:00Z',
    blocks: [
      {
        id: 'p_neuro_lead',
        blockType: 'paragraph',
        sortOrder: 0,
        data: {
          text: 'ZURICH — In high-altitude orbital and atmospheric trials, neuromorphic silicon mimics the synaptic firing of biological retinas, slashing power consumption tenfold while outperforming standard GPU accelerators in high-speed visual tracking.',
          format: 'markdown',
        },
      },
    ],
  },
  {
    id: 'sty_pick_crispr_01',
    organizationId: 'org_default',
    slug: 'in-vivo-crispr-gene-therapy-cardiomyopathy-trial',
    title:
      'Targeted In-Vivo CRISPR Therapy Reverses Rare Hereditary Cardiomyopathy in Clinical Trials',
    summary:
      'Phase 3 clinical trial demonstrates 94% restoration of cardiac muscle protein expression without off-target double-strand breaks.',
    status: 'PUBLISHED',
    articleType: 'science',
    currentVersionNumber: 1,
    currentVersionId: 'ver_crispr_v1',
    topicIds: ['top_biotechnology', 'top_healthcare'],
    entityIds: ['ent_who'],
    sourceIds: ['src_nature'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'web',
    createdByClient: 'human_web',
    authorId: 'usr_journalist_amara',
    publishedAt: '2026-10-02T11:30:00Z',
    createdAt: '2026-10-02T10:00:00Z',
    updatedAt: '2026-10-02T11:30:00Z',
    blocks: [
      {
        id: 'p_crispr_lead',
        blockType: 'paragraph',
        sortOrder: 0,
        data: {
          text: 'BOSTON — Genetic medicine marked a watershed triumph as researchers reported that systemic lipid-nanoparticle infusion successfully corrected hereditary cardiomyopathy in 48 trial patients, reversing progressive ventricular stiffness.',
          format: 'markdown',
        },
      },
    ],
  },
  {
    id: 'sty_pick_space_mining_01',
    organizationId: 'org_default',
    slug: 'lunar-prospector-detects-water-ice-shackleton-rim',
    title:
      'Commercial Lunar Prospector Detects Massive Volatile Water-Ice Deposits at Shackleton Rim',
    summary:
      'Neutron spectrometer radar mapping confirms over 600 million metric tons of extractable water-ice reserves in permanently shadowed craters.',
    status: 'PUBLISHED',
    articleType: 'science',
    currentVersionNumber: 1,
    currentVersionId: 'ver_lunar_v1',
    topicIds: ['top_space_exploration'],
    entityIds: ['ent_isro'],
    sourceIds: ['src_reuters'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'web',
    createdByClient: 'human_web',
    authorId: 'usr_journalist_david',
    publishedAt: '2026-10-02T11:45:00Z',
    createdAt: '2026-10-02T10:15:00Z',
    updatedAt: '2026-10-02T11:45:00Z',
    blocks: [
      {
        id: 'p_lunar_lead',
        blockType: 'paragraph',
        sortOrder: 0,
        data: {
          text: 'BENGALURU/HOUSTON — Deep orbital radar scans of the lunar south pole have confirmed subterranean glaciers exceeding 600 million tons of pure water ice, transforming long-term deep-space exploration economics.',
          format: 'markdown',
        },
      },
    ],
  },
  {
    id: 'sty_pick_grid_storage_01',
    organizationId: 'org_default',
    slug: 'sodium-ion-megapacks-surpass-lithium-grid-storage',
    title:
      'Next-Gen Sodium-Ion Megapacks Surpass Lithium in Long-Duration Grid Frequency Balancing',
    summary:
      'Utility operators deploy 1.2 GWh non-flammable sodium-ion storage system, reducing Levelized Cost of Storage to $42 per megawatt-hour.',
    status: 'PUBLISHED',
    articleType: 'science',
    currentVersionNumber: 1,
    currentVersionId: 'ver_grid_v1',
    topicIds: ['top_clean_energy', 'top_climate_transition'],
    entityIds: ['ent_iter'],
    sourceIds: ['src_bloomberg'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'web',
    createdByClient: 'human_web',
    authorId: 'usr_editor',
    publishedAt: '2026-10-02T12:00:00Z',
    createdAt: '2026-10-02T10:30:00Z',
    updatedAt: '2026-10-02T12:00:00Z',
    blocks: [
      {
        id: 'p_grid_lead',
        blockType: 'paragraph',
        sortOrder: 0,
        data: {
          text: 'MELBOURNE/PHOENIX — In the largest non-lithium utility installation to date, electrical transmission operators interconnected a 1.2 gigawatt-hour sodium-ion battery park, proving that abundant sea-salt derivatives can reliably anchor renewable electrical grids.',
          format: 'markdown',
        },
      },
    ],
  },
  {
    id: 'sty_pick_quantum_crypto_01',
    organizationId: 'org_default',
    slug: 'quantum-key-distribution-satellite-network-banking',
    title: 'Quantum Key Distribution Satellite Network Shields Cross-Border Banking Settlements',
    summary:
      'Entangled photon downlinks achieve 1.2 Mbps secret key exchange across 7,000 kilometers, establishing post-quantum banking security.',
    status: 'PUBLISHED',
    articleType: 'technology',
    currentVersionNumber: 1,
    currentVersionId: 'ver_qkd_v1',
    topicIds: ['top_quantum_computing', 'top_macroeconomics'],
    entityIds: ['ent_cern'],
    sourceIds: ['src_reuters'],
    heroImageUrl:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=80',
    createdVia: 'mcp',
    createdByClient: 'gemini_spark',
    authorId: 'usr_spark_agent',
    publishedAt: '2026-10-02T12:15:00Z',
    createdAt: '2026-10-02T10:45:00Z',
    updatedAt: '2026-10-02T12:15:00Z',
    blocks: [
      {
        id: 'p_qkd_lead',
        blockType: 'paragraph',
        sortOrder: 0,
        data: {
          text: 'GENEVA/LONDON — Multilateral clearing authorities have initiated the first continuous quantum-secured financial communications corridor, using low-Earth orbit satellites transmitting entangled photon pairs to secure inter-bank payment instructions.',
          format: 'markdown',
        },
      },
    ],
  },
];
