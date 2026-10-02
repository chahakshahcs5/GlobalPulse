import type { Event, StoryCluster, LiveblogEntry } from '@ai-news/schemas';

export const baselineEvents: Event[] = [
  {
    id: 'evt_brics_summit_2026',
    organizationId: 'org_default',
    slug: 'brics-new-delhi-summit-2026',
    title: '2026 New Delhi Multilateral Economic Accord & Expansion Plenary',
    summary:
      'Formal diplomatic summit of member nations negotiating cross-border trade clearing protocols and local currency reserves.',
    status: 'ACTIVE',
    occurredAt: '2026-09-26T08:00:00Z',
    location: 'Bharat Mandapam, New Delhi',
    coordinates: [77.209, 28.6139],
    topicIds: ['top_brics_2026', 'top_geopolitics'],
    entityIds: ['ent_india'],
    storyIds: ['sty_brics_flagship'],
    sourceIds: ['src_mea_gov', 'src_reuters_01'],
    createdAt: '2026-09-20T08:00:00Z',
    updatedAt: '2026-09-26T10:00:00Z',
  },
  {
    id: 'evt_cop31_climate',
    organizationId: 'org_default',
    slug: 'cop31-climate-summit',
    title: 'COP31 World Climate Action Summit & Grid Energy Integration',
    summary:
      'Global climate leaders ratify fast-track regulatory clearances for long-duration grid battery storage and fusion safety frameworks.',
    status: 'ACTIVE',
    occurredAt: '2026-10-01T09:00:00Z',
    location: 'Antalya Convention Centre, Turkey',
    coordinates: [30.7133, 36.8969],
    topicIds: ['top_climate_transition', 'top_energy_fusion'],
    entityIds: ['ent_eu'],
    storyIds: ['sty_climate_01', 'sty_fusion_01'],
    sourceIds: ['src_nature_01'],
    createdAt: '2026-09-25T08:00:00Z',
    updatedAt: '2026-10-01T12:00:00Z',
  },
  {
    id: 'evt_artemis_lunar',
    organizationId: 'org_default',
    slug: 'artemis-lunar-gateway-deployment',
    title: 'Artemis International Lunar Gateway Orbital Deployment',
    summary:
      'Multi-agency insertion of the permanent crew-tended station into lunar near-rectilinear halo orbit.',
    status: 'ACTIVE',
    occurredAt: '2026-10-01T14:00:00Z',
    location: 'Cape Canaveral / Lunar Halo',
    coordinates: [-80.6077, 28.3922],
    topicIds: ['top_space_exploration'],
    entityIds: ['ent_usa', 'ent_eu', 'ent_isro'],
    storyIds: ['sty_space_01'],
    sourceIds: ['src_esa_01'],
    createdAt: '2026-09-28T08:00:00Z',
    updatedAt: '2026-10-01T18:00:00Z',
  },
  {
    id: 'evt_ai_safety_summit',
    organizationId: 'org_default',
    slug: 'global-ai-safety-convention-geneva',
    title: 'Global Convention on Autonomous Agent Verification & Compute Governance',
    summary:
      'Treaty drafting conference establishing formal verification standards and non-proliferation protocols for frontier models.',
    status: 'ACTIVE',
    occurredAt: '2026-09-30T10:00:00Z',
    location: 'Palais des Nations, Geneva',
    coordinates: [6.1432, 46.2044],
    topicIds: ['top_ai_agents', 'top_cybersecurity'],
    entityIds: ['ent_deepmind', 'ent_openai'],
    storyIds: ['sty_ai_01'],
    sourceIds: ['src_mit_tech_01'],
    createdAt: '2026-09-25T08:00:00Z',
    updatedAt: '2026-09-30T10:00:00Z',
  },
];

export const baselineClusters: StoryCluster[] = [
  {
    id: 'cls_brics_trade',
    organizationId: 'org_default',
    title: 'BRICS Multi-Currency Trade Settlement Architecture',
    summary:
      'Comprehensive multi-angle coverage of international local-currency trade clearing protocols and sovereign foreign-exchange corridors.',
    leadStoryId: 'sty_brics_flagship',
    storyIds: ['sty_brics_flagship', 'sty_markets_01'],
    topic: 'top_brics_2026',
    category: 'business',
    perspectives: [
      {
        storyId: 'sty_brics_flagship',
        publisher: 'Reuters Global Wire',
        headline: 'Member States Enact Bilateral Clearing Accords with Immediate Ratification',
        excerpt:
          'Delegates emphasized that cross-border settlements in domestic currencies represent a strategic step in mitigating sovereign payment risks.',
        sourceType: 'wire',
        url: 'https://reuters.example.com/world/brics-summit-accord-2026',
        timeAgo: '4 hours ago',
        angle: 'institutional',
        stance: 'Ratification is a historic turning point for South-South trade liquidity.',
      },
      {
        storyId: 'sty_markets_01',
        publisher: 'Financial Times',
        headline: 'Western Currency Desks Evaluate De-Dollarization Trajectory',
        excerpt:
          'While local clearing agreements lower friction, structural reserve holding behavior will require deep liquidity guarantees.',
        sourceType: 'analysis',
        url: 'https://ft.com/content/sovereign-liquidity-grid-clearing-analysis-2026',
        timeAgo: '2 hours ago',
        angle: 'analytical',
        stance: 'Execution depends on currency volatility collars and market depth.',
      },
      {
        storyId: 'sty_brics_flagship',
        publisher: 'The Hindu',
        headline: 'Asian Clearing Corridors Remove Third-Party Settlement Friction',
        excerpt:
          'Reserve bank operational directives allow direct bank-to-bank ledger matching without dollar routing.',
        sourceType: 'regional',
        url: 'https://thehindu.com/news/national/india-multilateral-trade-accord-2026',
        timeAgo: '1 hour ago',
        angle: 'grassroots',
        stance: 'Exporters and manufacturers benefit from reduced hedging costs.',
      },
      {
        storyId: 'sty_markets_01',
        publisher: 'Bloomberg Markets',
        headline: 'Central Banks Expand FX Clearing Grids to Settle Bilateral Energy Invoices',
        excerpt:
          'Direct local-currency corridors bypass dollar conversion spreads, saving an estimated $4.2B in annual transaction fees.',
        sourceType: 'wire',
        url: 'https://bloomberg.com/markets/brics-local-currency-clearing',
        timeAgo: '3 hours ago',
        angle: 'analytical',
        stance: 'Energy-backed trade corridors accelerate alternate currency payment velocity.',
      },
      {
        storyId: 'sty_brics_flagship',
        publisher: 'The Wall Street Journal',
        headline: 'IMF Monitors Parallel Reserves as Sovereign Clearing Accords Multiply',
        excerpt:
          'Multilateral monetary officials assess macroeconomic stability impacts as central banks diversify reserve asset baskets.',
        sourceType: 'analysis',
        url: 'https://wsj.com/economy/central-bank-reserve-diversification-brics',
        timeAgo: '5 hours ago',
        angle: 'institutional',
        stance:
          'Reserve fragmentation requires upgraded international balance-of-payments monitoring.',
      },
      {
        storyId: 'sty_brics_flagship',
        publisher: 'South China Morning Post',
        headline: 'Cross-Border Trade Rails Handle Record Ruble, Rupee, and Yuan Settlement Volume',
        excerpt:
          'Port authorities in Shanghai, Mumbai, and Saint Petersburg confirm instantaneous electronic customs clearance using unified ledger protocols.',
        sourceType: 'regional',
        url: 'https://scmp.com/economy/global-economy/article/brics-cross-border-settlement',
        timeAgo: '6 hours ago',
        angle: 'grassroots',
        stance:
          'Direct merchant settlement drastically lowers supply-chain inventory financing burdens.',
      },
      {
        storyId: 'sty_brics_flagship',
        publisher: 'Al Jazeera English',
        headline: 'Global South Nations Welcome Dollar Independence as Trade Volumes Climb',
        excerpt:
          'Ministers emphasize that local clearing mechanisms shield developing economies from unilateral interest rate contagion and sanctions.',
        sourceType: 'international',
        url: 'https://aljazeera.com/economy/brics-trade-architecture-global-south',
        timeAgo: '7 hours ago',
        angle: 'analytical',
        stance: 'Monetary autonomy is an indispensable shield for sovereign development goals.',
      },
    ],
    timeline: [
      {
        date: 'Sep 25, 14:00 UTC',
        event: 'Working group of sherpas completes draft clearing house treaty',
        source: 'BRICS Trade Working Group',
        storyId: 'sty_brics_flagship',
      },
      {
        date: 'Sep 26, 08:00 UTC',
        event: 'Draft Multilateral Clearing Protocol initialed by finance ministers',
        source: 'Summit Secretariat',
        storyId: 'sty_brics_flagship',
      },
      {
        date: 'Sep 26, 10:00 UTC',
        event: 'Heads of State execute New Delhi Declaration',
        source: 'Ministry of External Affairs',
        storyId: 'sty_brics_flagship',
      },
      {
        date: 'Sep 28, 11:30 UTC',
        event: 'Technical architecture interlinks central bank real-time gross settlement systems',
        source: 'Inter-Bank Clearing Alliance',
        storyId: 'sty_brics_flagship',
      },
      {
        date: 'Sep 29, 14:00 UTC',
        event: 'Central monetary authorities activate bilateral clearing grid',
        source: 'Bloomberg Markets',
        storyId: 'sty_markets_01',
      },
      {
        date: 'Oct 01, 09:00 UTC',
        event: 'First monthly settlement reconciliation confirms zero default across $22B turnover',
        source: 'Multilateral Clearing Bureau',
        storyId: 'sty_brics_flagship',
      },
    ],
    createdAt: '2026-09-25T14:00:00Z',
    updatedAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'cls_ai_workforce',
    organizationId: 'org_default',
    title: 'Autonomous AI Agent Governance & Infrastructure Adoption',
    summary:
      'Evaluating the rise of formally verified autonomous code-generation agents in mission-critical national infrastructure.',
    leadStoryId: 'sty_ai_01',
    storyIds: ['sty_ai_01', 'sty_semi_01'],
    topic: 'top_ai_agents',
    category: 'technology',
    perspectives: [
      {
        storyId: 'sty_ai_01',
        publisher: 'MIT Technology Review',
        headline: 'Formal Verification Eliminates Synthetic Hallucination in Code Gates',
        excerpt:
          'Testing algorithms mathematically provable invariants guarantees that autonomous software generates zero unhandled exceptions.',
        sourceType: 'academic',
        url: 'https://technologyreview.com/2026/09/30/verifiable-agent-verification-protocols',
        timeAgo: '6 hours ago',
        angle: 'scientific',
        stance: 'Rigorous SMT-solving overcomes historical safety concerns.',
      },
      {
        storyId: 'sty_semi_01',
        publisher: 'TechCrunch',
        headline: 'Foundries Accelerate Chiplet Tape-Outs Using AI Verification Teams',
        excerpt:
          'Semiconductor designers report 3x faster design-rule checking cycles using autonomous agent suites.',
        sourceType: 'industry',
        url: 'https://techcrunch.com/2026/09/27/semiconductor-consortium-2nm-patent-pool',
        timeAgo: '3 hours ago',
        angle: 'industry',
        stance: 'Efficiency gains are essential to meeting 2nm lithography deadlines.',
      },
      {
        storyId: 'sty_ai_01',
        publisher: 'Reuters Technology',
        headline:
          'Enterprise Regulators Mandate Cryptographic Signatures on Autonomous Agent Commits',
        excerpt:
          'Federal cybersecurity standards require mathematical proof traces attached to all autonomous code deployments in core banking.',
        sourceType: 'wire',
        url: 'https://reuters.example.com/technology/autonomous-ai-code-audit-standards',
        timeAgo: '1 hour ago',
        angle: 'institutional',
        stance:
          'Verifiable governance safeguards critical infrastructure against non-deterministic drift.',
      },
    ],
    timeline: [
      {
        date: 'Sep 27, 11:00 UTC',
        event: 'Semiconductor coalition ratifies AI-assisted chiplet packaging framework',
        source: 'TechCrunch',
        storyId: 'sty_semi_01',
      },
      {
        date: 'Sep 29, 14:30 UTC',
        event: 'Regulators issue guidance on zero-hallucination automated verification gates',
        source: 'National Standards Body',
        storyId: 'sty_ai_01',
      },
      {
        date: 'Sep 30, 09:15 UTC',
        event: 'Benchmark proves 99.98% zero-defect rate in critical power grid telemetry',
        source: 'MIT Tech Review',
        storyId: 'sty_ai_01',
      },
    ],
    createdAt: '2026-09-27T11:00:00Z',
    updatedAt: '2026-09-30T10:00:00Z',
  },
  {
    id: 'cls_robotics_factory',
    organizationId: 'org_default',
    title: 'Humanoid Robotics Assembly & Factory Automation',
    summary:
      'Continuous 24-hour humanoid robotics operations transform automotive chassis and battery assembly lines.',
    leadStoryId: 'sty_pick_robotics_01',
    storyIds: ['sty_pick_robotics_01', 'sty_ai_01'],
    topic: 'top_ai_agents',
    category: 'technology',
    perspectives: [
      {
        storyId: 'sty_pick_robotics_01',
        publisher: 'TechCrunch',
        headline: 'Humanoid Robots Move from Lab Pilots to 24/7 Factory Work',
        excerpt: 'Automotive OEMs integrate tactile bipedal units into battery module assembly.',
        sourceType: 'industry',
        url: 'https://techcrunch.com/2026/10/02/humanoid-robotics-automotive-assembly',
        timeAgo: '2 hours ago',
        angle: 'industry',
        stance: 'Efficiency and dexterity milestones confirm long-term economic viability.',
      },
      {
        storyId: 'sty_pick_robotics_01',
        publisher: 'Wall Street Journal',
        headline: 'Industrial Automakers Recalculate Labor Economics as Humanoids Enter Production',
        excerpt:
          'Factories report 38% reduction in component misalignments with continuous dual-arm manipulation handling hazardous battery cells.',
        sourceType: 'analysis',
        url: 'https://wsj.com/business/automotive-humanoid-robotics-deployment',
        timeAgo: '4 hours ago',
        angle: 'analytical',
        stance:
          'Humanoid robotics bridge the automation gap in facilities designed around human geometry.',
      },
      {
        storyId: 'sty_pick_robotics_01',
        publisher: 'MIT Technology Review',
        headline: 'Embodied Foundation Models Give Bipedal Robots Zero-Shot Tool Manipulation',
        excerpt:
          'Vision-language-action architectures allow factory robots to adapt to novel chassis variations without manual reprogramming.',
        sourceType: 'academic',
        url: 'https://technologyreview.com/2026/10/02/embodied-ai-humanoid-factory-floor',
        timeAgo: '6 hours ago',
        angle: 'scientific',
        stance:
          'End-to-end sensorimotor policies mark the transition to generalized physical intelligence.',
      },
      {
        storyId: 'sty_pick_robotics_01',
        publisher: 'Bloomberg Technology',
        headline: 'Factory Automation Giants Invest $5B into Humanoid Production Scale',
        excerpt:
          'Tier-1 component suppliers ramp robotic dexterity modules to satisfy surging demand for flexible manufacturing lines.',
        sourceType: 'industry',
        url: 'https://bloomberg.com/news/articles/2026-10-02/humanoid-robotics-manufacturing-scale',
        timeAgo: '3 hours ago',
        angle: 'industry',
        stance:
          'Capital expenditure shifts decisively from specialized gantry robots to general-purpose humanoids.',
      },
      {
        storyId: 'sty_pick_robotics_01',
        publisher: 'IEEE Spectrum',
        headline: 'Tactile Sensor Skin Delivers 0.1 Millimeter Precision for Bipedal Manipulators',
        excerpt:
          'High-density piezoresistive fingertip arrays give robots the ability to thread delicate wire harnesses without human intervention.',
        sourceType: 'academic',
        url: 'https://spectrum.ieee.org/robotics/humanoids/tactile-sensor-skin-automotive',
        timeAgo: '5 hours ago',
        angle: 'scientific',
        stance:
          'Tactile feedback closes the final dexterity hurdle in precision electro-mechanical manufacturing.',
      },
      {
        storyId: 'sty_pick_robotics_01',
        publisher: 'Reuters Manufacturing Wire',
        headline: 'European Automakers Deploy 5,000 Humanoid Units Across Assembly Operations',
        excerpt:
          'Factory managers report 24/7 uptime in battery pouch stacking with zero thermal or ergonomic fatigue incidents.',
        sourceType: 'wire',
        url: 'https://reuters.example.com/business/automotive-humanoid-robotics-rollout-2026',
        timeAgo: '7 hours ago',
        angle: 'institutional',
        stance:
          'Adoption curves in automotive assembly mirror the early robotics revolution of the 1980s.',
      },
      {
        storyId: 'sty_pick_robotics_01',
        publisher: 'Financial Times Industrial',
        headline:
          'The Human-Robot Collaborative Workforce: Safety Standards Pass Regulatory Muster',
        excerpt:
          'Strict torque-limiting joint sensors and spatial computer vision ensure robots immediately yield when human technicians enter workspace.',
        sourceType: 'analysis',
        url: 'https://ft.com/content/humanoid-robotics-workplace-safety-certifications',
        timeAgo: '8 hours ago',
        angle: 'analytical',
        stance:
          'Harmonized ISO safety certifications pave the way for ubiquitous co-working environments.',
      },
    ],
    timeline: [
      {
        date: 'Oct 01, 14:00 UTC',
        event: 'Initial fleet of 200 humanoid units undergoes kinematic joint calibration',
        source: 'Production Engineering Division',
        storyId: 'sty_pick_robotics_01',
      },
      {
        date: 'Oct 02, 06:30 UTC',
        event:
          'Assembly line supervisor switches battery pack production bay to autonomous bipedal cell',
        source: 'Stuttgart Plant Operations',
        storyId: 'sty_pick_robotics_01',
      },
      {
        date: 'Oct 02, 09:00 UTC',
        event: 'Pilot plant completes 120,000 incident-free autonomous hours',
        source: 'Stuttgart Automation Consortium',
        storyId: 'sty_pick_robotics_01',
      },
      {
        date: 'Oct 02, 11:15 UTC',
        event:
          'Joint union-management review validates zero workplace safety incidents during trial',
        source: 'Industrial Safety Oversight Board',
        storyId: 'sty_pick_robotics_01',
      },
      {
        date: 'Oct 02, 13:45 UTC',
        event:
          'Factory logs 4,000 consecutively assembled battery chassis packs meeting Six Sigma quality',
        source: 'Quality Assurance Directorate',
        storyId: 'sty_pick_robotics_01',
      },
      {
        date: 'Oct 02, 15:00 UTC',
        event:
          'Executive committee authorizes plant-wide rollout across secondary paint and weld lines',
        source: 'Corporate Manufacturing Board',
        storyId: 'sty_pick_robotics_01',
      },
    ],
    createdAt: '2026-10-01T14:00:00Z',
    updatedAt: '2026-10-02T15:00:00Z',
  },
  {
    id: 'cls_neuromorphic_silicon',
    organizationId: 'org_default',
    title: 'Neuromorphic Silicon & Sub-Watt Edge AI Intelligence',
    summary:
      'Event-based spiking neural network silicon delivers sub-watt real-time vision for drones and orbital satellites.',
    leadStoryId: 'sty_pick_neuromorphic_01',
    storyIds: ['sty_pick_neuromorphic_01', 'sty_semi_01'],
    topic: 'top_semiconductors',
    category: 'technology',
    perspectives: [
      {
        storyId: 'sty_pick_neuromorphic_01',
        publisher: 'Nature Electronics',
        headline: 'Bio-Inspired Spiking Silicon Cuts Sensor Power Draw 90%',
        excerpt:
          'Asynchronous event vision eliminates synchronous clock heat in extreme conditions.',
        sourceType: 'academic',
        url: 'https://nature.com/articles/s41928-026-00412-x',
        timeAgo: '3 hours ago',
        angle: 'scientific',
        stance: 'Physical emulation of mammalian retinal neurons solves edge power bottlenecks.',
      },
      {
        storyId: 'sty_pick_neuromorphic_01',
        publisher: 'EE Times',
        headline: 'Commercial Foundries Tape Out First Sub-500mW Event-Based AI Accelerators',
        excerpt:
          'Fabless designers package neuromorphic cores for defense drones and low-Earth orbit constellation edge compute.',
        sourceType: 'industry',
        url: 'https://eetimes.com/neuromorphic-sub-watt-edge-tapeout',
        timeAgo: '5 hours ago',
        angle: 'industry',
        stance:
          'Asynchronous event-driven processing fundamentally upends traditional von Neumann architectures.',
      },
      {
        storyId: 'sty_pick_neuromorphic_01',
        publisher: 'Ars Technica',
        headline: 'Why Neuromorphic Edge Silicon is the Secret Weapon for Orbital Autonomy',
        excerpt:
          'Spacecraft can now run real-time debris tracking and hazard navigation within strict 1-watt thermal budgets.',
        sourceType: 'analysis',
        url: 'https://arstechnica.com/science/neuromorphic-satellites-edge-vision',
        timeAgo: '7 hours ago',
        angle: 'analytical',
        stance:
          'Passive event listening represents the optimal paradigm for remote resource-constrained sensors.',
      },
    ],
    timeline: [
      {
        date: 'Oct 02, 07:00 UTC',
        event:
          'High-altitude stratospheric drone completes 10-hour autonomous tracking mission powered by solar skin',
        source: 'Zurich Flight Test Division',
        storyId: 'sty_pick_neuromorphic_01',
      },
      {
        date: 'Oct 02, 09:30 UTC',
        event: 'Orbital and drone flight testing confirms sub-450mW real-time inference',
        source: 'Zurich AI Hardware Summit',
        storyId: 'sty_pick_neuromorphic_01',
      },
      {
        date: 'Oct 02, 11:45 UTC',
        event:
          'Standardization committee releases open-source spiking neural network programming interfaces',
        source: 'Neuromorphic Computing Working Group',
        storyId: 'sty_pick_neuromorphic_01',
      },
    ],
    createdAt: '2026-10-02T07:00:00Z',
    updatedAt: '2026-10-02T11:45:00Z',
  },
  {
    id: 'cls_crispr_therapeutics',
    organizationId: 'org_default',
    title: 'Precision In-Vivo Gene Editing Reverses Genetic Cardiomyopathy',
    summary:
      'Targeted lipid-nanoparticle base editing achieves 94% correction efficiency in clinical trials.',
    leadStoryId: 'sty_pick_crispr_01',
    storyIds: ['sty_pick_crispr_01'],
    topic: 'top_biotechnology',
    category: 'health',
    perspectives: [
      {
        storyId: 'sty_pick_crispr_01',
        publisher: 'The Lancet',
        headline: 'Systemic Lipid Nanoparticle In-Vivo Gene Correction Validated',
        excerpt:
          'Phase 3 multicenter trial demonstrates safety and cardiac muscle function restoration.',
        sourceType: 'academic',
        url: 'https://thelancet.com/journals/lancet/article/PIIS0140-6736(26)01982-3',
        timeAgo: '4 hours ago',
        angle: 'scientific',
        stance: 'Clean base-editing technology avoids risky double-strand DNA breaks.',
      },
      {
        storyId: 'sty_pick_crispr_01',
        publisher: 'New England Journal of Medicine',
        headline:
          'Complete Normalization of Ejection Fraction Following Single-Dose Base Editor Infusion',
        excerpt:
          'Cardiomyopathy patients show sustained MYBPC3 protein expression with no detectable off-target genomic cleavage.',
        sourceType: 'academic',
        url: 'https://nejm.org/doi/full/10.1056/NEJMoa2601992',
        timeAgo: '6 hours ago',
        angle: 'scientific',
        stance:
          'Permanent genetic repair eliminates lifelong dependence on mechanical assistive pumps.',
      },
      {
        storyId: 'sty_pick_crispr_01',
        publisher: 'STAT News',
        headline:
          'Biopharma Accelerates In-Vivo Pipeline Following Breakthrough Cardiomyopathy Data',
        excerpt:
          'Shares surge across gene editing pioneers as regulators grant priority review for congenital cardiac therapeutics.',
        sourceType: 'industry',
        url: 'https://statnews.com/2026/10/02/crispr-cardiomyopathy-phase-3-pipeline',
        timeAgo: '2 hours ago',
        angle: 'industry',
        stance:
          'Targeted organ delivery transforms gene therapy from rare monogenic niches to mainstream cardiology.',
      },
    ],
    timeline: [
      {
        date: 'Oct 02, 08:00 UTC',
        event: 'Global regulatory consortium accepts expedited biologics license application',
        source: 'International Medicines Council',
        storyId: 'sty_pick_crispr_01',
      },
      {
        date: 'Oct 02, 10:00 UTC',
        event: 'Phase 3 trial unblinds 12-month biopsy data confirming 94% correction',
        source: 'Global Health Consortium',
        storyId: 'sty_pick_crispr_01',
      },
      {
        date: 'Oct 02, 12:15 UTC',
        event: 'Long-term cardiology registry records 98% patient exercise tolerance recovery',
        source: 'Cardiomyopathy Foundation',
        storyId: 'sty_pick_crispr_01',
      },
    ],
    createdAt: '2026-10-02T08:00:00Z',
    updatedAt: '2026-10-02T12:15:00Z',
  },
  {
    id: 'cls_lunar_resources',
    organizationId: 'org_default',
    title: 'Lunar South Pole Volatile Water-Ice Commercialization',
    summary:
      'Neutron spectrometer radar mapping confirms 600 million metric tons of extractable water ice in Shackleton Crater.',
    leadStoryId: 'sty_pick_space_mining_01',
    storyIds: ['sty_pick_space_mining_01', 'sty_liveblog_starship'],
    topic: 'top_space_exploration',
    category: 'science',
    perspectives: [
      {
        storyId: 'sty_pick_space_mining_01',
        publisher: 'Aviation Week',
        headline: 'In-Situ Propellant Economics Transform Deep Space Architecture',
        excerpt: 'Extractable ice enables high-cadence refueling depots at lunar gateway orbits.',
        sourceType: 'industry',
        url: 'https://aviationweek.com/space/lunar-ice-reserves-prospecting-survey',
        timeAgo: '5 hours ago',
        angle: 'industry',
        stance:
          'Commercial extraction rights will determine next-generation interplanetary cadence.',
      },
      {
        storyId: 'sty_pick_space_mining_01',
        publisher: 'Nature Astronomy',
        headline:
          'Synthetic Aperture Radar Confirms 600 Million Metric Tons of Polar Subsurface Ice',
        excerpt:
          'Purity levels exceeding 88% indicate minimal mineral contamination, dramatically lowering energy needed for thermal extraction.',
        sourceType: 'academic',
        url: 'https://nature.com/articles/s41550-026-02104-w',
        timeAgo: '7 hours ago',
        angle: 'scientific',
        stance:
          'Abundant volatile deposits solidify polar craters as permanent human exploration hubs.',
      },
      {
        storyId: 'sty_pick_space_mining_01',
        publisher: 'SpaceNews',
        headline:
          'International Space Resource Alliance Proposes Universal Lunar Prospecting Registry',
        excerpt:
          'Commercial mining ventures and sovereign agencies align on non-interference zones for ice harvesting in permanently shadowed regions.',
        sourceType: 'analysis',
        url: 'https://spacenews.com/lunar-water-ice-prospecting-registry-framework',
        timeAgo: '3 hours ago',
        angle: 'analytical',
        stance:
          'Clear property and utilization frameworks prevent geopolitical disputes over polar claims.',
      },
    ],
    timeline: [
      {
        date: 'Oct 02, 07:30 UTC',
        event:
          'Polar reconnaissance orbiter completes 50-pass neutron spectroscopy scan over Shackleton Crater',
        source: 'Deep Space Science Directorate',
        storyId: 'sty_pick_space_mining_01',
      },
      {
        date: 'Oct 02, 10:15 UTC',
        event: 'Synthetic aperture radar validates subterranean glaciers across 8m depth',
        source: 'Artemis Science Directorate',
        storyId: 'sty_pick_space_mining_01',
      },
      {
        date: 'Oct 02, 13:00 UTC',
        event:
          'Commercial mining joint venture selects primary landing coordinates for autonomous thermal drill rover',
        source: 'Lunar Resources Consortium',
        storyId: 'sty_pick_space_mining_01',
      },
    ],
    createdAt: '2026-10-02T07:30:00Z',
    updatedAt: '2026-10-02T13:00:00Z',
  },
  {
    id: 'cls_sodium_grid',
    organizationId: 'org_default',
    title: 'Long-Duration Sodium-Ion Grid Energy Storage Breakthrough',
    summary:
      'Interconnection of 1.2 GWh non-flammable sodium-ion megapacks demonstrates low-cost renewable grid stabilization.',
    leadStoryId: 'sty_pick_grid_storage_01',
    storyIds: ['sty_pick_grid_storage_01', 'sty_fusion_01'],
    topic: 'top_clean_energy',
    category: 'science',
    perspectives: [
      {
        storyId: 'sty_pick_grid_storage_01',
        publisher: 'Bloomberg Energy',
        headline: 'Sodium-Ion Battery Storage Undercuts Lithium on Utility Economics',
        excerpt: 'Levelized cost of storage falls to $42/MWh with non-toxic, abundant minerals.',
        sourceType: 'industry',
        url: 'https://bloomberg.com/energy/sodium-ion-grid-utility-revolution',
        timeAgo: '6 hours ago',
        angle: 'industry',
        stance: 'Prussian blue cathode design provides immune safety against thermal runaway.',
      },
      {
        storyId: 'sty_pick_grid_storage_01',
        publisher: 'Financial Times Energy',
        headline: 'Global Utilities Switch Bulk Storage Procurement to Sodium Chemistries',
        excerpt:
          'Supply chains free from lithium, nickel, and cobalt bottlenecks allow rapid gigawatt-hour scale deployments.',
        sourceType: 'analysis',
        url: 'https://ft.com/energy/sodium-ion-bulk-utility-storage-orders',
        timeAgo: '4 hours ago',
        angle: 'analytical',
        stance:
          'Mineral abundance insulates grid decarbonization from commodity geopolitical spikes.',
      },
      {
        storyId: 'sty_pick_grid_storage_01',
        publisher: 'IEEE Spectrum',
        headline: 'Thermal Quench Immunity Demonstrated Across 1.2 GWh Continuous Megapack Testing',
        excerpt:
          'Zero degradation observed over 4,000 extreme-temperature cycles, establishing 25-year operational warranties.',
        sourceType: 'academic',
        url: 'https://spectrum.ieee.org/energy/sodium-ion-grid-thermal-immunity',
        timeAgo: '2 hours ago',
        angle: 'scientific',
        stance:
          'Non-flammable aqueous electrolytes remove stringent fire-suppression requirements for urban substations.',
      },
    ],
    timeline: [
      {
        date: 'Oct 02, 08:45 UTC',
        event: '12 regional substation transformers complete grid interconnect synchronization',
        source: 'Regional Power Grid Authority',
        storyId: 'sty_pick_grid_storage_01',
      },
      {
        date: 'Oct 02, 10:30 UTC',
        event: '1.2 GWh utility park completes 4,000-cycle frequency response validation',
        source: 'Energy Transition Registry',
        storyId: 'sty_pick_grid_storage_01',
      },
      {
        date: 'Oct 02, 12:45 UTC',
        event:
          'Energy reliability commission certifies plant for primary frequency regulation reserve',
        source: 'National Grid Oversight Board',
        storyId: 'sty_pick_grid_storage_01',
      },
    ],
    createdAt: '2026-10-02T08:45:00Z',
    updatedAt: '2026-10-02T12:45:00Z',
  },
  {
    id: 'cls_quantum_security',
    organizationId: 'org_default',
    title: 'Quantum Key Distribution & Inter-Bank Settlement Protection',
    summary:
      'Entangled photon satellite links secure cross-border multilateral banking settlements against post-quantum decryptors.',
    leadStoryId: 'sty_pick_quantum_crypto_01',
    storyIds: ['sty_pick_quantum_crypto_01', 'sty_quantum_01'],
    topic: 'top_quantum_computing',
    category: 'technology',
    perspectives: [
      {
        storyId: 'sty_pick_quantum_crypto_01',
        publisher: 'Financial Times',
        headline: 'Central Banks Pilot Entangled Photon Crypto Links for Settlement Rails',
        excerpt: 'QKD downlinks achieve 1.2 Mbps secret key rate across intercontinental gateways.',
        sourceType: 'industry',
        url: 'https://ft.com/technology/quantum-secured-interbank-settlement-clearing',
        timeAgo: '7 hours ago',
        angle: 'analytical',
        stance:
          'Physics-based encryption guarantees long-term immunity against algorithmic cryptanalysis.',
      },
      {
        storyId: 'sty_pick_quantum_crypto_01',
        publisher: 'Nature Physics',
        headline:
          'Satellite-to-Ground Entangled Photon Links Sustain Sub-1% Quantum Bit Error Rate',
        excerpt:
          'High-speed adaptive optics on ground receivers cancel atmospheric turbulence, maintaining photon coherence over 2,400km orbital baselines.',
        sourceType: 'academic',
        url: 'https://nature.com/articles/s41567-026-00892-z',
        timeAgo: '5 hours ago',
        angle: 'scientific',
        stance:
          'Hardware verification validates quantum cryptography as ready for operational deployment.',
      },
      {
        storyId: 'sty_pick_quantum_crypto_01',
        publisher: 'Bloomberg Technology',
        headline: 'SWIFT and BIS Back Satellite Quantum Security Standards for Sovereign Reserves',
        excerpt:
          'A coalition of 14 central clearing depositories adopts automated one-time pad key refreshment to counter harvest-now-decrypt-later adversaries.',
        sourceType: 'analysis',
        url: 'https://bloomberg.com/news/articles/2026-10-02/swift-bis-satellite-quantum-keys',
        timeAgo: '3 hours ago',
        angle: 'analytical',
        stance:
          'Institutional adoption insulates global payments from projected quantum computing decryption threats.',
      },
      {
        storyId: 'sty_pick_quantum_crypto_01',
        publisher: 'Reuters Global Wire',
        headline:
          'International Banking Consortium Enacts Protocol for Quantum-Protected Multilateral Clearing',
        excerpt:
          'Direct satellite downlinks across Zurich, Singapore, and New York complete live clearing runs with zero packet compromise.',
        sourceType: 'wire',
        url: 'https://reuters.example.com/technology/quantum-banking-settlement-accord-2026',
        timeAgo: '1 hour ago',
        angle: 'institutional',
        stance:
          'Standardized quantum key exchange removes bilateral counterparty cybersecurity exposure.',
      },
      {
        storyId: 'sty_pick_quantum_crypto_01',
        publisher: 'The Wall Street Journal',
        headline:
          'Clearinghouses Face Multibillion-Dollar Upgrade Race for Post-Quantum Compliance',
        excerpt:
          'Top custodian banks warn that retrofitting legacy SWIFT payment gateways will require dedicated hardware security modules across 4,000 branch endpoints.',
        sourceType: 'analysis',
        url: 'https://wsj.com/finance/quantum-cryptography-banking-migration',
        timeAgo: '6 hours ago',
        angle: 'analytical',
        stance: 'Implementation costs will be heavily frontloaded, favoring scale players.',
      },
      {
        storyId: 'sty_pick_quantum_crypto_01',
        publisher: 'Wired Science',
        headline: 'How Satellite-Based Entangled Photons Beat the Fiber Distance Limit',
        excerpt:
          'While terrestrial optical fibers lose signal integrity beyond 100km without quantum repeaters, vacuum-based orbital beams traverse thousands of miles unattenuated.',
        sourceType: 'industry',
        url: 'https://wired.com/science/quantum-entanglement-satellites-explained',
        timeAgo: '8 hours ago',
        angle: 'scientific',
        stance: 'Orbital QKD leapfrogs decades of terrestrial repeater engineering hurdles.',
      },
      {
        storyId: 'sty_pick_quantum_crypto_01',
        publisher: 'The Economist',
        headline: 'The Geopolitics of Sovereign Quantum Cryptographic Bastions',
        excerpt:
          'Nations lacking domestic orbital quantum infrastructure risk strategic blindness in financial surveillance and inter-bank secrecy.',
        sourceType: 'opinion',
        url: 'https://economist.com/international/geopolitics-quantum-communications',
        timeAgo: '9 hours ago',
        angle: 'analytical',
        stance: 'Cryptographic sovereignty is becoming as pivotal as physical energy reserves.',
      },
      {
        storyId: 'sty_pick_quantum_crypto_01',
        publisher: 'MIT Technology Review',
        headline:
          'Quantum Random Number Generators on Orbit Pass Strict Continuous Randomness Audits',
        excerpt:
          'Photonic shot noise sensors generate true non-deterministic entropy seeds at 2.4 Gbps, passing all Dieharder and NIST SP 800-22 tests.',
        sourceType: 'academic',
        url: 'https://technologyreview.com/2026/10/02/quantum-entropy-satellite-orbit',
        timeAgo: '10 hours ago',
        angle: 'scientific',
        stance:
          'True physical randomness closes side-channel vulnerabilities inherent in pseudo-random algorithms.',
      },
    ],
    timeline: [
      {
        date: 'Oct 02, 06:00 UTC',
        event:
          'Low-Earth orbit quantum satellite establishes initial optical beacon with Zurich ground station',
        source: 'European Space Operations Centre',
        storyId: 'sty_pick_quantum_crypto_01',
      },
      {
        date: 'Oct 02, 08:15 UTC',
        event: 'Atmospheric adaptive optics sensors achieve sub-second wavefront calibration',
        source: 'Mount Säntis Observatory',
        storyId: 'sty_pick_quantum_crypto_01',
      },
      {
        date: 'Oct 02, 10:45 UTC',
        event: 'Satellite-to-ground downlink demonstrates 1.4 microradian beam lock',
        source: 'European Quantum Consortium',
        storyId: 'sty_pick_quantum_crypto_01',
      },
      {
        date: 'Oct 02, 12:30 UTC',
        event: '14 central bank clearing nodes execute live cryptographic key rotation',
        source: 'Bank for International Settlements',
        storyId: 'sty_pick_quantum_crypto_01',
      },
      {
        date: 'Oct 02, 14:00 UTC',
        event:
          'Consortium publishes audit confirming 0.8% quantum bit error rate across 10GB test tranche',
        source: 'National Institute of Standards and Technology',
        storyId: 'sty_pick_quantum_crypto_01',
      },
      {
        date: 'Oct 02, 15:30 UTC',
        event:
          'Financial Stability Board approves operational guidelines for cross-border QKD corridors',
        source: 'FSB Secretariat Basel',
        storyId: 'sty_pick_quantum_crypto_01',
      },
    ],
    createdAt: '2026-10-02T06:00:00Z',
    updatedAt: '2026-10-02T15:30:00Z',
  },
  {
    id: 'cls_semiconductor_consortium',
    organizationId: 'org_default',
    title: 'Global 2nm Semiconductor Manufacturing & Patent Consortium',
    summary:
      'Major foundries and chip designers agree to cross-licensing pact and standardized High-NA EUV lithography tooling.',
    leadStoryId: 'sty_semi_01',
    storyIds: ['sty_semi_01', 'sty_ai_01'],
    topic: 'top_semiconductors',
    category: 'technology',
    perspectives: [
      {
        storyId: 'sty_semi_01',
        publisher: 'Wall Street Journal',
        headline: 'Leading Foundries Announce Joint 2nm Process Rules to Avert Fab Bottlenecks',
        excerpt:
          'Uniform GAAFET transistor libraries will allow fabless designers to multi-source wafer runs without redesign.',
        sourceType: 'analysis',
        url: 'https://wsj.com/tech/2nm-foundry-consortium-standard',
        timeAgo: '4 hours ago',
        angle: 'analytical',
        stance: 'Interoperable packaging addresses global supply-chain fragmentation.',
      },
      {
        storyId: 'sty_semi_01',
        publisher: 'EE Times',
        headline: 'High-NA EUV Scanner Deployment Achieves 80% Commercial Yield Threshold',
        excerpt:
          '0.55 NA optics deliver required sub-8nm edge placement accuracy on 300mm test wafers.',
        sourceType: 'industry',
        url: 'https://eetimes.com/high-na-euv-commercial-yield-validation',
        timeAgo: '2 hours ago',
        angle: 'scientific',
        stance: 'Tool maturity outpaces industry skepticism, locking in 2027 volume ramp.',
      },
      {
        storyId: 'sty_semi_01',
        publisher: 'Financial Times Tech',
        headline: 'TSMC, Intel, and Samsung Ratify Reciprocal Cross-Licensing Framework',
        excerpt:
          'Historic IP-sharing agreement removes multi-jurisdictional patent litigation risk surrounding backside power delivery.',
        sourceType: 'analysis',
        url: 'https://ft.com/tech/2nm-foundry-cross-licensing-pact',
        timeAgo: '3 hours ago',
        angle: 'institutional',
        stance:
          'Cross-licensing ensures multi-fab supply-chain redundancy for enterprise AI hyperscalers.',
      },
      {
        storyId: 'sty_semi_01',
        publisher: 'Nikkei Asia',
        headline: 'Asian Foundry Ecosystem Accelerates High-NA EUV Pilot Runs for 2027 Production',
        excerpt:
          'Equipment installations in Tainan and Pyeongtaek reach operational readiness ahead of scheduled commercial tape-outs.',
        sourceType: 'regional',
        url: 'https://asia.nikkei.com/business/tech/asia-2nm-foundry-ramp-2027',
        timeAgo: '5 hours ago',
        angle: 'regional',
        stance: 'Regional supply-chain integration cushions against geopolitical export shocks.',
      },
      {
        storyId: 'sty_semi_01',
        publisher: 'Reuters Technology',
        headline: 'Global Chip Coalition Pledges Open Standards for 3D Chiplet Interconnects',
        excerpt:
          'Standardized die-to-die optical interfaces will allow mixing logic, memory, and analog tiles on a single substrate.',
        sourceType: 'wire',
        url: 'https://reuters.example.com/technology/chiplet-interconnect-open-standard-2026',
        timeAgo: '6 hours ago',
        angle: 'industry',
        stance: 'Modular packaging decouples transistor shrinkage from monolithic yield penalties.',
      },
      {
        storyId: 'sty_semi_01',
        publisher: 'MIT Technology Review',
        headline: 'Atomic-Layer GAAFET Etching Overcomes Quantum Tunneling Leakage',
        excerpt:
          'Nanosheet channels thinned to 3 nanometers maintain sharp on/off switching ratios at 0.65-volt operating points.',
        sourceType: 'academic',
        url: 'https://technologyreview.com/2026/09/27/gaafet-nanosheet-atomic-etching',
        timeAgo: '8 hours ago',
        angle: 'scientific',
        stance:
          'Atomic precision lithography preserves Moore Law efficiency scaling into the next decade.',
      },
      {
        storyId: 'sty_semi_01',
        publisher: 'Bloomberg Markets',
        headline:
          'Semiconductor Equipment Stocks Surge on 2nm Tooling Capital Expenditure Commitments',
        excerpt:
          'Foundries announce combined $85B capital allocation across lithography, metrology, and cleanroom automation.',
        sourceType: 'wire',
        url: 'https://bloomberg.com/news/articles/2026-09-27/2nm-tooling-capex-surge',
        timeAgo: '9 hours ago',
        angle: 'analytical',
        stance: 'Unprecedented equipment orders signal resilient long-term semiconductor demand.',
      },
    ],
    timeline: [
      {
        date: 'Sep 26, 16:00 UTC',
        event: 'Lead foundry executives convene closed-door summit at SEMICON Taiwan',
        source: 'Executive Steering Group',
        storyId: 'sty_semi_01',
      },
      {
        date: 'Sep 27, 08:30 UTC',
        event: 'Foundry consortium ratifies unified 2nm PDK specification',
        source: 'SEMICON Global',
        storyId: 'sty_semi_01',
      },
      {
        date: 'Sep 27, 12:00 UTC',
        event: 'Joint statement issues open packaging patent pool guidelines',
        source: 'Consortium Secretariat',
        storyId: 'sty_semi_01',
      },
      {
        date: 'Sep 27, 15:30 UTC',
        event: 'Lithography toolmaker verifies sub-8nm edge placement accuracy on pilot line',
        source: 'ASML Technical Briefing',
        storyId: 'sty_semi_01',
      },
      {
        date: 'Sep 28, 10:00 UTC',
        event: 'Hyperscale cloud providers submit initial 2nm AI accelerator tape-out requests',
        source: 'Open Compute Project',
        storyId: 'sty_semi_01',
      },
      {
        date: 'Sep 29, 14:00 UTC',
        event: 'Trade ministries issue coordinated regulatory clearance for patent pool structure',
        source: 'International Antitrust Bureau',
        storyId: 'sty_semi_01',
      },
    ],
    createdAt: '2026-09-26T16:00:00Z',
    updatedAt: '2026-09-29T14:00:00Z',
  },
  {
    id: 'cls_iter_fusion_energy',
    organizationId: 'org_default',
    title: 'Magnetic Fusion Energy Q>1 Steady-State Milestone',
    summary:
      'High-temperature superconducting magnets maintain continuous fusion burn for 120 seconds, unlocking commercial pilot design.',
    leadStoryId: 'sty_fusion_01',
    storyIds: ['sty_fusion_01', 'sty_climate_01'],
    topic: 'top_fusion_energy',
    category: 'science',
    perspectives: [
      {
        storyId: 'sty_fusion_01',
        publisher: 'Nature Energy',
        headline: 'Continuous Q=1.35 Net Energy Confinement Realized in Compact Tokamak',
        excerpt: 'Barium copper oxide magnet coils sustain 24-Tesla fields without thermal quench.',
        sourceType: 'academic',
        url: 'https://nature.com/articles/s41560-026-01422-9',
        timeAgo: '3 hours ago',
        angle: 'scientific',
        stance: 'Superconducting tape economics enable compact, low-cost commercial fusion plants.',
      },
      {
        storyId: 'sty_fusion_01',
        publisher: 'Reuters Science Wire',
        headline: 'Energy Ministers Commit Capital for First Grid-Tied Fusion Prototype by 2032',
        excerpt:
          'International coalition pledges $14B to scale engineering test reactors based on superconducting magnets.',
        sourceType: 'wire',
        url: 'https://reuters.example.com/energy/superconducting-fusion-milestone-2026',
        timeAgo: '5 hours ago',
        angle: 'institutional',
        stance: 'Public-private funding accelerates grid connection timelines.',
      },
      {
        storyId: 'sty_fusion_01',
        publisher: 'BBC Science',
        headline: 'Fusion Milestone Hailed as Most Credible Clean Baseload Power Contender',
        excerpt:
          'Maintaining two continuous minutes of burning plasma proves magnetic stability without expensive gigawatt wall losses.',
        sourceType: 'general',
        url: 'https://bbc.com/news/science-environment-fusion-milestone',
        timeAgo: '4 hours ago',
        angle: 'general',
        stance:
          'Public enthusiasm surges as fusion transitions from theoretical physics to electrical engineering.',
      },
      {
        storyId: 'sty_fusion_01',
        publisher: 'Wired Tech',
        headline: 'Inside the Private Fusion Race: High-Field Magnets Shrink Tokamaks by 90%',
        excerpt:
          'Compact magnetic field strength allows startup reactors to achieve burning conditions in facilities the size of a gymnasium.',
        sourceType: 'industry',
        url: 'https://wired.com/story/private-fusion-superconducting-magnets',
        timeAgo: '6 hours ago',
        angle: 'industry',
        stance:
          'Modular construction turns multi-decade international megaprojects into fast-turnaround capital builds.',
      },
      {
        storyId: 'sty_fusion_01',
        publisher: 'The Wall Street Journal',
        headline:
          'Utility Consortia Sign First Commercial Power Purchase Offtake Letters for Fusion',
        excerpt:
          'Power generators lock in long-term supply pacts targeting 2035 commercial grid delivery to power AI data centers.',
        sourceType: 'analysis',
        url: 'https://wsj.com/business/energy/utility-fusion-power-purchase-agreements',
        timeAgo: '7 hours ago',
        angle: 'analytical',
        stance:
          'Energy-hungry tech hyperscalers are guaranteeing future fusion plant revenue streams.',
      },
      {
        storyId: 'sty_fusion_01',
        publisher: 'IEEE Spectrum',
        headline:
          'Tritium Breeding Blankets Achieve Self-Sustaining Regeneration Ratio in Test Loop',
        excerpt:
          'Beryllium-liquid lithium neutron multipliers demonstrate 1.15 tritium breeding ratio, solving long-term fuel scarcity fears.',
        sourceType: 'academic',
        url: 'https://spectrum.ieee.org/energy/nuclear/fusion-tritium-breeding-ratio',
        timeAgo: '8 hours ago',
        angle: 'scientific',
        stance:
          'Fuel self-sufficiency removes the last major resource bottleneck for magnetic confinement plants.',
      },
      {
        storyId: 'sty_fusion_01',
        publisher: 'The Guardian Environment',
        headline:
          'Environmental Regulators Classify Fusion Waste as Low-Level Recyclable Byproduct',
        excerpt:
          'Unlike conventional fission, materials activate for decades rather than millennia, simplifying decommissioning protocols.',
        sourceType: 'opinion',
        url: 'https://theguardian.com/environment/2026/sep/28/fusion-waste-classification-clean-energy',
        timeAgo: '9 hours ago',
        angle: 'analytical',
        stance:
          'Benign environmental footprint reinforces fusion as the optimal companion to solar and wind.',
      },
    ],
    timeline: [
      {
        date: 'Sep 28, 04:30 UTC',
        event: 'Cryogenic magnet chilldown reaches 4 Kelvin superconducting baseline',
        source: 'Plant Diagnostics Division',
        storyId: 'sty_fusion_01',
      },
      {
        date: 'Sep 28, 06:15 UTC',
        event: 'Plasma discharge reaches stable 120-second plateau at 150 million degrees',
        source: 'Fusion Test Facility Control Room',
        storyId: 'sty_fusion_01',
      },
      {
        date: 'Sep 28, 07:30 UTC',
        event: 'Diagnostic calorimeters confirm 1.35 net thermal energy factor',
        source: 'Independent Review Panel',
        storyId: 'sty_fusion_01',
      },
      {
        date: 'Sep 28, 11:00 UTC',
        event: 'Tritium breeding diagnostic logs 1.15 breeding ratio during extended pulse',
        source: 'IAEA Liaison Office',
        storyId: 'sty_fusion_01',
      },
      {
        date: 'Sep 28, 14:30 UTC',
        event: 'Consortium presents telemetry to international energy ministers in Paris',
        source: 'Energy Ministerial Assembly',
        storyId: 'sty_fusion_01',
      },
      {
        date: 'Sep 29, 09:00 UTC',
        event:
          'Public-private consortium initiates engineering procurement for 500MW grid prototype',
        source: 'Commercial Fusion Alliance',
        storyId: 'sty_fusion_01',
      },
    ],
    createdAt: '2026-09-28T04:30:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'cls_central_banks_liquidity',
    organizationId: 'org_default',
    title: 'Multilateral Central Bank Liquidity & FX Settlement Network',
    summary:
      'Sovereign reserve banks initiate automated cross-currency liquidity backstops to protect against dollar volatility spikes.',
    leadStoryId: 'sty_markets_01',
    storyIds: ['sty_markets_01', 'sty_brics_flagship'],
    topic: 'top_macroeconomics',
    category: 'business',
    perspectives: [
      {
        storyId: 'sty_markets_01',
        publisher: 'The Economist',
        headline: 'Central Banks Build Parallel Clearing Rails to De-Risk Reserves',
        excerpt:
          'Direct bilateral swap arrangements reduce reliance on intermediary correspondent banking networks.',
        sourceType: 'analysis',
        url: 'https://economist.com/finance-and-economics/multilateral-fx-clearing-rails',
        timeAgo: '3 hours ago',
        angle: 'analytical',
        stance: 'Diversified settlement architecture increases global financial resilience.',
      },
      {
        storyId: 'sty_markets_01',
        publisher: 'Bloomberg Markets',
        headline: 'FX Liquidity Swaps Settle in Real-Time Under New Multilateral Accord',
        excerpt:
          'First 24 hours of operation process $18B in sovereign trade settlements without friction.',
        sourceType: 'wire',
        url: 'https://bloomberg.com/news/articles/2026-09-29/fx-clearing-grid-volume-record',
        timeAgo: '1 hour ago',
        angle: 'industry',
        stance: 'Turnover rates confirm strong commercial appetite for non-intermediary rails.',
      },
    ],
    timeline: [
      {
        date: 'Sep 29, 09:00 UTC',
        event: 'Multilateral swap protocol activated across 12 participating central banks',
        source: 'BIS Monetary Panel',
        storyId: 'sty_markets_01',
      },
      {
        date: 'Sep 29, 13:45 UTC',
        event: 'First automated trade settlement tranche executes cleanly',
        source: 'Operations Clearinghouse',
        storyId: 'sty_markets_01',
      },
    ],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T15:00:00Z',
  },
  {
    id: 'cls_quantum_processor_breakthrough',
    organizationId: 'org_default',
    title: 'Topological Quantum Processing & Fault-Tolerant Logical Qubits',
    summary:
      'Majorana zero mode braiding demonstrates 10,000 logical qubits with sub-1e-6 error thresholds under commercial cryogenics.',
    leadStoryId: 'sty_quantum_01',
    storyIds: ['sty_quantum_01', 'sty_pick_quantum_crypto_01'],
    topic: 'top_quantum_computing',
    category: 'technology',
    perspectives: [
      {
        storyId: 'sty_quantum_01',
        publisher: 'MIT Technology Review',
        headline: 'Topological Protection Solves the Quantum Decroherence Bottleneck',
        excerpt:
          'Non-Abelian braiding protects qubit states natively at the hardware level, bypassing millions of physical helper qubits.',
        sourceType: 'academic',
        url: 'https://technologyreview.com/2026/09/28/topological-quantum-processor-majorana',
        timeAgo: '4 hours ago',
        angle: 'scientific',
        stance:
          'Hardware-level protection compresses fault-tolerant commercial timeline by decades.',
      },
      {
        storyId: 'sty_quantum_01',
        publisher: 'Financial Times Tech',
        headline: 'Enterprise Cloud Giants Line Up for Topological QPU Compute Slots',
        excerpt:
          'Pharmaceutical and materials science consortiums book initial quantum chemical simulation batches.',
        sourceType: 'industry',
        url: 'https://ft.com/tech/topological-quantum-processor-enterprise-compute',
        timeAgo: '2 hours ago',
        angle: 'industry',
        stance: 'Commercial demand for quantum chemistry modeling exceeds initial fab capacity.',
      },
    ],
    timeline: [
      {
        date: 'Sep 28, 14:00 UTC',
        event: '10,000-logical-qubit benchmark successfully executes Bernstein-Vazirani proof',
        source: 'Quantum Standards Laboratory',
        storyId: 'sty_quantum_01',
      },
      {
        date: 'Sep 28, 16:30 UTC',
        event: 'Commercial cloud SDK released for quantum simulation clusters',
        source: 'Developer Consortium',
        storyId: 'sty_quantum_01',
      },
    ],
    createdAt: '2026-09-28T14:00:00Z',
    updatedAt: '2026-09-28T18:00:00Z',
  },
  {
    id: 'cls_lunar_gateway_orbit',
    organizationId: 'org_default',
    title: 'International Lunar Gateway Polar Orbit Insertion',
    summary:
      'Crew habitat and logistics modules complete autonomous burn to settle into Near-Rectilinear Halo Orbit around lunar south pole.',
    leadStoryId: 'sty_space_01',
    storyIds: ['sty_space_01', 'sty_pick_space_mining_01'],
    topic: 'top_space_exploration',
    category: 'science',
    perspectives: [
      {
        storyId: 'sty_space_01',
        publisher: 'Aviation Week & Space Technology',
        headline: 'Gateway Station Enters Permanent Halo Orbit Above Lunar South Pole',
        excerpt:
          'Solar electric propulsion system fires precisely to place Gateway in continuous line-of-sight with Earth.',
        sourceType: 'industry',
        url: 'https://aviationweek.com/space/lunar-gateway-near-rectilinear-halo-orbit',
        timeAgo: '5 hours ago',
        angle: 'industry',
        stance: 'Uninterrupted communication enables continuous robotic rover teleoperation.',
      },
      {
        storyId: 'sty_space_01',
        publisher: 'ESA Mission Dispatch',
        headline: 'International Crew Habitat Life Support Systems Verify 100% Nominal Readouts',
        excerpt:
          'Oxygen replenishment and closed-loop water reclamation subsystems pass orbital certification.',
        sourceType: 'institutional',
        url: 'https://esa.int/gateway/orbit-insertion-subsystem-status',
        timeAgo: '3 hours ago',
        angle: 'official',
        stance: 'Station is fully primed for upcoming international astronaut expedition.',
      },
    ],
    timeline: [
      {
        date: 'Sep 29, 05:30 UTC',
        event: 'Gateway electric propulsion engines commence perilune orbital insertion burn',
        source: 'Mission Control Center Houston',
        storyId: 'sty_space_01',
      },
      {
        date: 'Sep 29, 08:00 UTC',
        event: 'Near-Rectilinear Halo Orbit lock verified by Deep Space Network antennas',
        source: 'ESA Darmstadt Ground Station',
        storyId: 'sty_space_01',
      },
    ],
    createdAt: '2026-09-29T05:30:00Z',
    updatedAt: '2026-09-29T10:00:00Z',
  },
  {
    id: 'cls_solid_state_grid_storage',
    organizationId: 'org_default',
    title: 'Global Grid Integration of 500 GWh Solid-State Energy Storage',
    summary:
      'Deployment of ceramic electrolyte batteries stabilizes intercontinental renewable transmission corridors and cuts peak power tariffs.',
    leadStoryId: 'sty_climate_01',
    storyIds: ['sty_climate_01', 'sty_pick_grid_storage_01'],
    topic: 'top_climate_transition',
    category: 'science',
    perspectives: [
      {
        storyId: 'sty_climate_01',
        publisher: 'Bloomberg Green',
        headline: 'Solid-State Battery Installations Surpass 500 GWh Milestone Worldwide',
        excerpt:
          'Utility-scale projects prove 20-year cycle longevity with zero degradation at high ambient temperatures.',
        sourceType: 'industry',
        url: 'https://bloomberg.com/green/solid-state-grid-500gwh-milestone',
        timeAgo: '2 hours ago',
        angle: 'industry',
        stance: 'Elimination of thermal runaway safeguards high-density urban transformer yards.',
      },
      {
        storyId: 'sty_climate_01',
        publisher: 'Clean Energy Wire',
        headline: 'Grid Operators Cut Peaker Plant Reliance by 40% Following Storage Expansion',
        excerpt:
          'Instantaneous millisecond battery discharge handles transient renewable drop-offs during storm fronts.',
        sourceType: 'analysis',
        url: 'https://cleanenergywire.org/solid-state-peaker-plant-reduction',
        timeAgo: '4 hours ago',
        angle: 'analytical',
        stance:
          'Grid stability proves renewables can safely satisfy 90%+ of baseline industrial load.',
      },
    ],
    timeline: [
      {
        date: 'Sep 29, 09:30 UTC',
        event: 'Interconnection councils certify 500 GWh aggregate operational threshold',
        source: 'Global Energy Transition Council',
        storyId: 'sty_climate_01',
      },
      {
        date: 'Sep 29, 14:00 UTC',
        event: 'Tariff regulators record 35% decline in regional peak power surcharges',
        source: 'International Energy Agency',
        storyId: 'sty_climate_01',
      },
    ],
    createdAt: '2026-09-29T09:30:00Z',
    updatedAt: '2026-09-29T16:00:00Z',
  },
  {
    id: 'cls_pan_coronavirus_mrna',
    organizationId: 'org_default',
    title: 'Broad-Spectrum Pan-Coronavirus mRNA Therapeutic Phase 3 Clearance',
    summary:
      'Conserved viral stem epitope formulation neutralizes all known coronaviral lineages with durable mucosal immunity.',
    leadStoryId: 'sty_health_01',
    storyIds: ['sty_health_01', 'sty_pick_crispr_01'],
    topic: 'top_biotech_genomics',
    category: 'health',
    perspectives: [
      {
        storyId: 'sty_health_01',
        publisher: 'The Lancet',
        headline: 'Phase 3 Clinical Trial Demonstrates 96% Efficacy Across Diverse Viral Lineages',
        excerpt:
          'Broad neutralizing antibody titers remain stable past 12 months with zero immune escape.',
        sourceType: 'academic',
        url: 'https://thelancet.com/journals/lancet/pan-coronavirus-phase3-validation',
        timeAgo: '3 hours ago',
        angle: 'scientific',
        stance: 'Epitope stabilization eliminates need for seasonal vaccine reformulation.',
      },
      {
        storyId: 'sty_health_01',
        publisher: 'WHO Global Health Wire',
        headline: 'World Health Organization Authorizes Pre-Qualification for Global Stockpile',
        excerpt:
          'Therapeutic distributed under universal licensing treaty to guarantee equitable developing-nation access.',
        sourceType: 'wire',
        url: 'https://who.int/news/pan-coronavirus-therapeutic-stockpile-accord',
        timeAgo: '1 hour ago',
        angle: 'institutional',
        stance: 'Equitable global distribution halts future zoonotic spillover pandemic chains.',
      },
    ],
    timeline: [
      {
        date: 'Sep 30, 08:00 UTC',
        event: 'Data Safety Monitoring Board unblinds Phase 3 efficacy dataset',
        source: 'Consortium Coordinating Center Geneva',
        storyId: 'sty_health_01',
      },
      {
        date: 'Sep 30, 11:30 UTC',
        event: 'Regulators initiate expedited rolling approval protocol across 40 countries',
        source: 'Global Health Authority Network',
        storyId: 'sty_health_01',
      },
    ],
    createdAt: '2026-09-30T08:00:00Z',
    updatedAt: '2026-09-30T13:00:00Z',
  },
  {
    id: 'cls_zero_day_power_grids',
    organizationId: 'org_default',
    title: 'Coordinated Zero-Day Patch Deployment Across Critical Power Grids',
    summary:
      'Cybersecurity task forces distribute cryptographically signed firmware to isolate remote SCADA vulnerabilities in continental grids.',
    leadStoryId: 'sty_cyber_01',
    storyIds: ['sty_cyber_01'],
    topic: 'top_cybersecurity',
    category: 'technology',
    perspectives: [
      {
        storyId: 'sty_cyber_01',
        publisher: 'Wired Security',
        headline: 'Emergency Firmware Patch Deployed to Thousands of Substation Relays',
        excerpt:
          'Automated verification scripts confirm vulnerability neutralized without a single kilowatt of outage.',
        sourceType: 'industry',
        url: 'https://wired.com/security/power-grid-zero-day-coordinated-patch',
        timeAgo: '2 hours ago',
        angle: 'industry',
        stance:
          'Zero-downtime hot-patching architecture prevents potential systemic blackout threats.',
      },
      {
        storyId: 'sty_cyber_01',
        publisher: 'Cyber Security Agency Brief',
        headline: 'National Infrastructure Regulators Confirm Threat Actor Access Denied',
        excerpt:
          'Forensic honeypot telemetry indicates intruder scripts failed to execute payload past defensive airgaps.',
        sourceType: 'official',
        url: 'https://cisa.gov/alerts/substation-scada-zero-day-mitigation',
        timeAgo: '4 hours ago',
        angle: 'official',
        stance: 'International cyber coordination neutralized threat prior to weaponization.',
      },
    ],
    timeline: [
      {
        date: 'Sep 30, 10:00 UTC',
        event: 'Threat intelligence alliance discovers unpatched SCADA communication flaw',
        source: 'CERT Joint Operations',
        storyId: 'sty_cyber_01',
      },
      {
        date: 'Sep 30, 14:15 UTC',
        event: 'Coordinated air-gapped cryptographic update rolled out to 12,000 substations',
        source: 'Power Reliability Council',
        storyId: 'sty_cyber_01',
      },
    ],
    createdAt: '2026-09-30T10:00:00Z',
    updatedAt: '2026-09-30T16:00:00Z',
  },
  {
    id: 'cls_synthetic_cinema_venice',
    organizationId: 'org_default',
    title: 'Venice Biennale Awards Fully Synthetic Generative Feature Film',
    summary:
      'International jury recognizes human-directed neural cinema, sparking intense debate on intellectual property and artistic agency.',
    leadStoryId: 'sty_culture_01',
    storyIds: ['sty_culture_01'],
    topic: 'top_culture_cinema',
    category: 'culture',
    perspectives: [
      {
        storyId: 'sty_culture_01',
        publisher: 'Variety',
        headline: 'Venice Film Festival Awards Golden Lion to Neural Cinematography Pioneer',
        excerpt:
          'Jury commends emotional depth and innovative non-linear narrative rendered entirely via diffusion engines.',
        sourceType: 'industry',
        url: 'https://variety.com/film/venice-biennale-synthetic-feature-golden-lion',
        timeAgo: '5 hours ago',
        angle: 'industry',
        stance:
          'Technological leap transforms film production from capital-intensive to imagination-driven.',
      },
      {
        storyId: 'sty_culture_01',
        publisher: 'Cahiers du Cinéma',
        headline: 'The Author in the Age of Generative Latent Space',
        excerpt:
          'Critics argue the director remains the singular creative compass directing algorithmic aesthetics.',
        sourceType: 'analysis',
        url: 'https://cahiersducinema.com/art-cinematographique-ia-2026',
        timeAgo: '3 hours ago',
        angle: 'analytical',
        stance: 'Prompting and directorial curation constitute genuine cinematic authorship.',
      },
    ],
    timeline: [
      {
        date: 'Oct 01, 16:00 UTC',
        event: 'Venice International Film Festival screens synthetic feature in main competition',
        source: 'Biennale Cinema Press Office',
        storyId: 'sty_culture_01',
      },
      {
        date: 'Oct 01, 20:30 UTC',
        event: 'Jury awards Golden Lion citing groundbreaking visual poetry',
        source: 'Palazzo del Cinema Jury Declaration',
        storyId: 'sty_culture_01',
      },
    ],
    createdAt: '2026-10-01T16:00:00Z',
    updatedAt: '2026-10-01T22:00:00Z',
  },
  {
    id: 'cls_starship_flight7_telemetry',
    organizationId: 'org_default',
    title: 'Starship Flight 7 Orbital Flight Test & Tower Catch',
    summary:
      'Super Heavy booster and orbital ship achieve full trajectory objectives with dual robotic chopstick mechanical recovery.',
    leadStoryId: 'sty_liveblog_starship',
    storyIds: ['sty_liveblog_starship', 'sty_space_01'],
    topic: 'top_space_exploration',
    category: 'science',
    perspectives: [
      {
        storyId: 'sty_liveblog_starship',
        publisher: 'NASASpaceFlight',
        headline: 'Super Heavy Booster and Ship Both Recovered Intact in Landmark Flight 7',
        excerpt:
          'Mechanical catch arms capture falling vehicle within 5 centimeters of centerline tolerance.',
        sourceType: 'industry',
        url: 'https://nasaspaceflight.com/starship-flight-7-catch-success',
        timeAgo: '1 hour ago',
        angle: 'industry',
        stance:
          'Rapid orbital reusability makes interplanetary payload costs plummet exponentially.',
      },
      {
        storyId: 'sty_liveblog_starship',
        publisher: 'Reuters Aerospace',
        headline: 'Space Regulators Clear High-Cadence Commercial Flight License Protocol',
        excerpt:
          'Federal Aviation Administration issues programmatic environmental finding supporting 25 launches annually.',
        sourceType: 'wire',
        url: 'https://reuters.example.com/aerospace/faa-starship-orbital-cadence-2026',
        timeAgo: '3 hours ago',
        angle: 'institutional',
        stance: 'Regulatory approval unlocks routine lunar logistics and Mars cargo architecture.',
      },
      {
        storyId: 'sty_liveblog_starship',
        publisher: 'Aviation Week',
        headline: 'Dual Catch Verification Confirms 24-Hour Turnaround Economics for Heavy Lift',
        excerpt:
          'Post-flight thermal imaging on heat shield tiles shows negligible degradation across forward flaps and nosecone apex.',
        sourceType: 'industry',
        url: 'https://aviationweek.com/space/starship-flight-7-dual-tower-catch',
        timeAgo: '2 hours ago',
        angle: 'industry',
        stance:
          'Orbital hardware inspection confirms hardware readiness for immediate propellant reloading.',
      },
      {
        storyId: 'sty_liveblog_starship',
        publisher: 'The Wall Street Journal',
        headline: 'Satellite Megaconstellation Operators Queue for 150-Ton Payload Slots',
        excerpt:
          'Telecommunications and defense satellite providers calculate cost-per-kilogram plummeting below $100.',
        sourceType: 'analysis',
        url: 'https://wsj.com/business/aerospace/starship-commercial-payload-pricing',
        timeAgo: '4 hours ago',
        angle: 'analytical',
        stance: 'Unprecedented payload capacity fundamentally expands commercial space commerce.',
      },
      {
        storyId: 'sty_liveblog_starship',
        publisher: 'BBC News Science',
        headline: 'Spectacular Mid-Air Tower Catch Brings Artemis Moon Landing Milestones Closer',
        excerpt:
          'NASA leadership congratulates engineering teams as critical lunar human landing system milestones unlock.',
        sourceType: 'general',
        url: 'https://bbc.com/news/science-space-starship-flight-7',
        timeAgo: '5 hours ago',
        angle: 'general',
        stance: 'Reusability milestone keeps Artemis astronaut lunar landing schedule on track.',
      },
      {
        storyId: 'sty_liveblog_starship',
        publisher: 'IEEE Spectrum',
        headline: 'Raptor 3 Internal Cooling Channels Eliminate External Fire Blankets',
        excerpt:
          '3D-printed internal regenerative manifolds shave 1,200 kilograms of structural mass while improving thermal margins.',
        sourceType: 'academic',
        url: 'https://spectrum.ieee.org/aerospace/space-flight/raptor-3-regenerative-cooling',
        timeAgo: '6 hours ago',
        angle: 'scientific',
        stance:
          'Engine manufacturing advances enable high reliability during radical aerodynamic deceleration.',
      },
      {
        storyId: 'sty_liveblog_starship',
        publisher: 'Ars Technica',
        headline:
          'Flight 7 Telemetry Proves Ship Catch Dynamics Were Even Smoother Than the Booster',
        excerpt:
          'Laser radar guidance systems adjusted vehicle approach vectors within 20 milliseconds of final aerodynamic flare.',
        sourceType: 'analysis',
        url: 'https://arstechnica.com/space/starship-flight-7-telemetry-deep-dive',
        timeAgo: '8 hours ago',
        angle: 'analytical',
        stance:
          'Autonomous precision landing algorithms have decisively conquered hypersonic vehicle recovery.',
      },
    ],
    timeline: [
      {
        date: 'Oct 02, 11:30 UTC',
        event: 'Propellant loading of 4,500 tons subcooled liquid methane and oxygen completed',
        source: 'Launch Control Team',
        storyId: 'sty_liveblog_starship',
      },
      {
        date: 'Oct 02, 12:00 UTC',
        event: '33 Raptor 3 engines ignite for flawless liftoff from Starbase orbital pad',
        source: 'SpaceX Mission Control',
        storyId: 'sty_liveblog_starship',
      },
      {
        date: 'Oct 02, 12:02 UTC',
        event: 'Hot-staging ring separates cleanly as Starship upper stage continues to orbit',
        source: 'Orbital Telemetry Stream',
        storyId: 'sty_liveblog_starship',
      },
      {
        date: 'Oct 02, 12:08 UTC',
        event: 'Super Heavy booster caught out of mid-air by launch tower chopsticks',
        source: 'Flight Test Telemetry Stream',
        storyId: 'sty_liveblog_starship',
      },
      {
        date: 'Oct 02, 13:05 UTC',
        event: 'Starship completes atmospheric reentry blackout with heat shield intact',
        source: 'Starlink Video Relay',
        storyId: 'sty_liveblog_starship',
      },
      {
        date: 'Oct 02, 13:12 UTC',
        event: 'Starship executes flip maneuver and settles into secondary catch arms at Pad B',
        source: 'Starbase Recovery Operations',
        storyId: 'sty_liveblog_starship',
      },
    ],
    createdAt: '2026-10-02T11:30:00Z',
    updatedAt: '2026-10-02T13:30:00Z',
  },
];

export const baselineLiveblogEntries: LiveblogEntry[] = [
  {
    id: 'live_entry_01',
    storyId: 'sty_liveblog_starship',
    headline: 'T-15m: Propellant Loading Complete Across Ship and Booster',
    content:
      'All 4,500 metric tons of densified liquid methane and sub-cooled liquid oxygen have loaded successfully into Super Heavy Booster 14 and Starship 31.',
    isKeyEvent: true,
    author: {
      id: 'usr_spark_agent',
      name: 'Gemini Spark Wire Reporter',
      avatarUrl:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
    },
    timestamp: '2026-10-02T10:15:00Z',
  },
  {
    id: 'live_entry_02',
    storyId: 'sty_liveblog_starship',
    headline: 'T-5m: Terminal Countdown Auto-Sequence Commences',
    content:
      'Ground launch sequencer has handed over primary countdown command to autonomous vehicle avionics computers.',
    isKeyEvent: false,
    author: {
      id: 'usr_editor',
      name: 'Marcus Vance',
    },
    timestamp: '2026-10-02T10:25:00Z',
  },
  {
    id: 'live_entry_03',
    storyId: 'sty_liveblog_starship',
    headline: 'LIFTOFF! All 33 Raptor 3 Engines Ignite Cleanly',
    content:
      'Starship clears the orbital launch mount at Starbase generating 16.7 million pounds of thrust. Acoustic suppression water deluge performed nominally.',
    isKeyEvent: true,
    author: {
      id: 'usr_spark_agent',
      name: 'Gemini Spark Wire Reporter',
    },
    timestamp: '2026-10-02T10:30:00Z',
  },
  {
    id: 'live_entry_04',
    storyId: 'sty_liveblog_starship',
    headline: 'T+2m 45s: Hot-Staging Ring Separation Verified Clean',
    content:
      'Ship stage engines ignited while still attached to the booster ring. Super Heavy executed flip maneuver toward the Gulf of Mexico return trajectory.',
    isKeyEvent: true,
    author: {
      id: 'usr_editor',
      name: 'Marcus Vance',
    },
    timestamp: '2026-10-02T10:32:45Z',
  },
  {
    id: 'live_entry_05',
    storyId: 'sty_liveblog_starship',
    headline: 'T+8m 10s: Super Heavy Booster Completes Soft Touchdown Catch Sequence',
    content:
      'The booster reignited center 3 Raptors for a precise landing burn and executed zero-velocity hover before touchdown.',
    isKeyEvent: true,
    author: {
      id: 'usr_spark_agent',
      name: 'Gemini Spark Wire Reporter',
    },
    timestamp: '2026-10-02T10:38:10Z',
  },
];

export const baselineCollections = [
  {
    id: 'col_ai_revolution',
    name: 'The Autonomous Frontier: AI Agents & Advanced Silicon',
    slug: 'autonomous-frontier-ai-silicon',
    description:
      'A comprehensive dossier exploring the intersection of autonomous software agents, formal code verification, and 2nm gate-all-around fabrication.',
    curatorId: 'usr_admin',
    curatorName: 'Elena Rostova',
    isPublic: true,
    storyIds: ['sty_ai_01', 'sty_semi_01', 'sty_quantum_01'],
  },
  {
    id: 'col_geopolitics_macro',
    name: 'Geoeconomic Shifts: Multi-Currency Systems & Sovereign Alliances',
    slug: 'geoeconomic-shifts-sovereign-alliances',
    description:
      'Essential reporting on the 2026 New Delhi multilateral summit, bilateral liquidity facilities, and local currency trade settlement.',
    curatorId: 'usr_editor',
    curatorName: 'Marcus Vance',
    isPublic: true,
    storyIds: ['sty_brics_flagship', 'sty_markets_01'],
  },
  {
    id: 'col_clean_tech',
    name: 'Deep Science & Energy Horizons',
    slug: 'deep-science-energy-horizons',
    description:
      'Investigative accounts of magnetic confinement fusion milestones, topological quantum computing, and solid-state grid storage.',
    curatorId: 'usr_journalist_david',
    curatorName: 'David Chen',
    isPublic: true,
    storyIds: ['sty_fusion_01', 'sty_climate_01', 'sty_quantum_01'],
  },
];
