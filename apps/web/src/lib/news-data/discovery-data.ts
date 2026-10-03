import type { FactCheckItem, GoogleNewsCluster } from './types';

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
