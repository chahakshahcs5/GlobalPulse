import type { Story } from '@ai-news/schemas';

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
      {
        id: 'blk_semi_table',
        blockType: 'table',
        sortOrder: 2,
        data: {
          title: '2nm Node Geometry Comparison Matrix',
          headers: [
            'Process Metric',
            '3nm FinFET Benchmark',
            '2nm GAA Standard',
            'Performance Delta',
          ],
          rows: [
            ['Logic Density (MTr/mm²)', '215', '310', '+44%'],
            ['Operating Voltage (V)', '0.75V', '0.62V', '-17%'],
            ['Interconnect Energy (pJ/bit)', '1.4', '0.78', '-44%'],
          ],
        },
      },
      {
        id: 'blk_semi_quote',
        blockType: 'quote',
        sortOrder: 3,
        data: {
          quote:
            'Accelerated computing and 2nm architecture represent the single largest performance inflection in semiconductor history.',
          attribution: 'Jensen Huang',
          title: 'CEO, NVIDIA',
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
      {
        id: 'blk_fusion_chart',
        blockType: 'chart',
        sortOrder: 1,
        data: {
          chartType: 'line',
          title: 'Steady-State Plasma Core Temperature (keV)',
          xAxis: { key: 'seconds', label: 'Confinement Duration (Seconds)', type: 'linear' },
          yAxis: { label: 'Core Temp (keV)' },
          series: [{ name: 'Plasma Temperature', key: 'temp', color: '#ef4444' }],
          values: [
            { seconds: '0', temp: 2.1 },
            { seconds: '30', temp: 12.8 },
            { seconds: '60', temp: 15.4 },
            { seconds: '90', temp: 15.9 },
            { seconds: '120', temp: 16.1 },
          ],
          sourceAttribution: 'Culham Centre for Fusion Energy & Nature 2026',
        },
      },
      {
        id: 'blk_fusion_stat',
        blockType: 'statistic',
        sortOrder: 2,
        data: {
          value: '1.35x Q-Factor',
          label: 'Empirical Net Energy Output Gain Ratio',
          trend: 'up',
          trendValue: '+35% above breakeven',
          context: 'Continuous high-temperature superconducting magnet stabilization',
        },
      },
      {
        id: 'blk_fusion_citation',
        blockType: 'citation',
        sortOrder: 3,
        data: {
          claim:
            'Steady-state deuterium-tritium plasma sustained continuously beyond 120s with positive Q-factor.',
          sourceIds: ['src_nature_01'],
          quoteExcerpt:
            'Continuous plasma confinement observed without disruptive edge-localized modes.',
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
      {
        id: 'blk_robotics_comparison',
        blockType: 'comparison',
        sortOrder: 2,
        data: {
          title: 'Assembly Architecture Comparison: Bipedal Humanoid vs. Fixed Gantry Arms',
          subjectA: {
            name: 'Bipedal Humanoid System (Gen 3)',
            points: [
              'Dynamic mobility navigates legacy factory walkways without civil refits',
              '22-DoF dexterous multi-finger hands handle flexible wire harness routing',
              'Rapid task retraining via vision-language-action zero-shot foundation models',
              'Shared human-robot workspace safety with compliant impedance force sensing',
            ],
          },
          subjectB: {
            name: 'Traditional Fixed Gantry Automation',
            points: [
              'Requires dedicated protective safety cages and floor excavation footprint',
              'Rigid pneumatic tooling restricted to predefined single-task jigs',
              'Months of mechanical retooling needed for vehicle chassis design revisions',
              'High high-speed repeat accuracy but zero environmental adaptiveness',
            ],
          },
        },
      },
      {
        id: 'blk_robotics_stat',
        blockType: 'statistic',
        sortOrder: 3,
        data: {
          value: '99.4%',
          label: 'Autonomous First-Pass Yield',
          trend: 'up',
          trendValue: '+8.2% vs human manual baseline',
          context: 'Measured over 120,000 cumulative production hours on live assembly lines.',
          sourceAttribution: 'Automotive Manufacturing Robotics Consortium',
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
        id: 'blk_neuro_sum',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Neuromorphic Benchmark Findings',
          bulletPoints: [
            'Dynamic energy consumption under 450 milliwatts at 120 frames per second.',
            'Asynchronous temporal event processing eliminates synchronous clock power loss.',
            'Seamless integration with satellite attitude-control optical navigation arrays.',
          ],
        },
      },
      {
        id: 'p_neuro_lead',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'ZURICH — In high-altitude orbital and atmospheric trials, neuromorphic silicon mimics the synaptic firing of biological retinas, slashing power consumption tenfold while outperforming standard GPU accelerators in high-speed visual tracking.',
          format: 'markdown',
        },
      },
      {
        id: 'blk_neuro_flow',
        blockType: 'flow',
        sortOrder: 2,
        data: {
          title: 'Event-Based Neuromorphic Processing Pipeline',
          steps: [
            {
              stepNumber: 1,
              title: 'Event-Camera Microsecond Sensing',
              description:
                'Asynchronous pixels detect logarithmic changes in luminance with microsecond temporal resolution.',
              status: 'completed',
            },
            {
              stepNumber: 2,
              title: 'Spike Packet Encoding',
              description:
                'Binary action potentials generated only when pixel intensity changes exceed adaptive noise thresholds.',
              status: 'completed',
            },
            {
              stepNumber: 3,
              title: 'Crossbar Synaptic Routing',
              description:
                'Non-volatile memristor crossbars execute in-memory matrix-vector multiply without off-chip DRAM bus latency.',
              status: 'active',
            },
            {
              stepNumber: 4,
              title: 'Sub-Watt Inference Actuation',
              description:
                'Downstream flight control surfaces actuate within 1.2 milliseconds while consuming under 450mW total system power.',
              status: 'pending',
            },
          ],
        },
      },
      {
        id: 'blk_neuro_image',
        blockType: 'image',
        sortOrder: 3,
        data: {
          url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
          altText: 'Micrograph of Neuromorphic Silicon Die',
          caption:
            'Electron microscope scan of the event-based spiking neural network silicon core showing synaptic crossbar arrays.',
          credit: 'ETH Zurich & Fraunhofer Institute',
          aspectRatio: '16:9',
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
        id: 'blk_crispr_sum',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Therapeutic Trial Results',
          bulletPoints: [
            'Lipid nanoparticle delivery system achieves organ-specific cardiac tropism.',
            'Base editing repairs single-nucleotide pathogenic mutation with 94.2% efficiency.',
            'Longitudinal biopsies verify zero off-target genomic insertions across 12-month follow-up.',
          ],
        },
      },
      {
        id: 'p_crispr_lead',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'BOSTON — Genetic medicine marked a watershed triumph as researchers reported that systemic lipid-nanoparticle infusion successfully corrected hereditary cardiomyopathy in 48 trial patients, reversing progressive ventricular stiffness.',
          format: 'markdown',
        },
      },
      {
        id: 'blk_crispr_slides',
        blockType: 'slide_deck',
        sortOrder: 2,
        data: {
          title: 'Phase 3 In-Vivo Base Editing Clinical Dossier',
          slides: [
            {
              slideNumber: 1,
              title: 'Target Mutation & Molecular Mechanism',
              body: 'Hereditary cardiomyopathy is driven by a single point mutation in the MYH7 sarcomeric gene causing myocardial hypertrophy.',
              bullets: [
                'Point mutation c.1208G>A identified in 100% of trial cohort',
                'Engineered adenine base editor targets precise codon without double-strand break',
                'Zero bystander nucleotide deaminations observed in pre-clinical screening',
              ],
              imageUrl:
                'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
              sourceAttribution: 'New England Journal of Medicine 2026',
            },
            {
              slideNumber: 2,
              title: 'Organ-Specific Nanoparticle Delivery',
              body: 'Ionizable lipid nanoparticles engineered with cardiac-tropic peptide ligands achieve selective cardiomyocyte uptake.',
              bullets: [
                '87% myocardial uptake with hepatic clearance below 12%',
                'Single intravenous infusion administration without invasive catheterization',
                'Transient mRNA expression clears within 48 hours post-infusion',
              ],
              sourceAttribution: 'Bioengineered Therapeutics Consortium',
            },
            {
              slideNumber: 3,
              title: 'Longitudinal Patient Recovery Outcomes',
              body: 'Echocardiograms and exercise stress testing demonstrate dramatic reversal of diastolic dysfunction at 12-month evaluation.',
              bullets: [
                'Left ventricular wall thickness reduced by 3.8mm on average',
                'Peak VO2 exercise capacity improved by 42% across all 48 patients',
                '100% patient survival with zero arrhythmic adverse events recorded',
              ],
              sourceAttribution: 'Global Phase 3 Safety Monitoring Board',
            },
          ],
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
        id: 'blk_lunar_sum',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Prospecting Mission Discoveries',
          bulletPoints: [
            'Synthetic aperture radar penetrates 8 meters beneath lunar regolith.',
            'Estimated propellant production capacity equivalent to 1,200 Mars transit missions.',
            'International commercial mining consortium files joint extraction claims under Artemis Accords.',
          ],
        },
      },
      {
        id: 'p_lunar_lead',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'BENGALURU/HOUSTON — Deep orbital radar scans of the lunar south pole have confirmed subterranean glaciers exceeding 600 million tons of pure water ice, transforming long-term deep-space exploration economics.',
          format: 'markdown',
        },
      },
      {
        id: 'blk_lunar_gallery',
        blockType: 'gallery',
        sortOrder: 2,
        data: {
          title: 'South Pole Radar Cartography & Prospecting Scans',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80',
              altText: 'Shackleton Crater Rim Elevation Profile',
              caption:
                'Synthetic aperture radar topographic mapping showing permanently shadowed interior basins.',
              credit: 'Lunar Reconnaissance Orbiter / ISRO Chandrayaan Data',
            },
            {
              url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
              altText: 'Subsurface Hydrogen Abundance Map',
              caption:
                'Neutron spectrometer readings highlighting volatile hydrogen deposits exceeding 4.2% water equivalent by mass.',
              credit: 'Planetary Science Institute',
            },
          ],
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
        id: 'blk_grid_sum',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Storage Economics & Safety',
          bulletPoints: [
            'Abundant non-toxic raw material eliminates cobalt and nickel supply chain bottlenecks.',
            'Thermal runaway risk reduced to near zero through Prussian blue analogue cathode chemistry.',
            'Round-trip efficiency verified at 91.5% across 4,000 accelerated stress cycles.',
          ],
        },
      },
      {
        id: 'p_grid_lead',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'MELBOURNE/PHOENIX — In the largest non-lithium utility installation to date, electrical transmission operators interconnected a 1.2 gigawatt-hour sodium-ion battery park, proving that abundant sea-salt derivatives can reliably anchor renewable electrical grids.',
          format: 'markdown',
        },
      },
      {
        id: 'blk_grid_imagediff',
        blockType: 'image_diff',
        sortOrder: 2,
        data: {
          beforeUrl:
            'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
          afterUrl:
            'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
          beforeLabel: 'Conventional LFP Under Stress',
          afterLabel: 'Prussian Blue Sodium-Ion (Cold Run)',
          caption:
            'Comparative thermal imaging under 3C continuous discharge: Sodium-ion cells show zero thermal hotspots with a 38°C lower core operating temperature.',
          orientation: 'horizontal',
          defaultSplitPercent: 50,
          credit: 'Renewable Energy Systems Laboratory',
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
        id: 'blk_qkd_sum',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Quantum Encryption Highlights',
          bulletPoints: [
            'Information-theoretic security immune to Shor’s quantum algorithm attacks.',
            'Satellite-to-ground optical tracking locks beam drift within 1.4 microradians.',
            'Immediate failover adoption across 14 central and commercial clearing nodes.',
          ],
        },
      },
      {
        id: 'p_qkd_lead',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'GENEVA/LONDON — Multilateral clearing authorities have initiated the first continuous quantum-secured financial communications corridor, using low-Earth orbit satellites transmitting entangled photon pairs to secure inter-bank payment instructions.',
          format: 'markdown',
        },
      },
      {
        id: 'blk_qkd_diagram',
        blockType: 'diagram',
        sortOrder: 2,
        data: {
          title: 'Satellite-to-Ground Entangled QKD Architecture',
          format: 'mermaid',
          definition:
            'graph LR\n  SAT[LEO QKD Satellite] -->|Downlink Beam 1| GS1[Frankfurt Ground Station]\n  SAT -->|Downlink Beam 2| GS2[London Ground Station]\n  GS1 -->|Encrypted Session Key| BB1[Bundesbank Node]\n  GS2 -->|Encrypted Session Key| BB2[Bank of England Node]\n  BB1 <-->|Post-Quantum Interbank Corridor| BB2',
          caption:
            'Synchronized photon-entanglement distribution downlinks establishing cryptographic one-time pad verification between Frankfurt and London clearing nodes.',
        },
      },
    ],
  },
];
