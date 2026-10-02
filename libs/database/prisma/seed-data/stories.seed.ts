import type { Story, StoryVersion } from '@ai-news/schemas';

export const storiesToSeed: Array<{
  story: Story;
  versions: StoryVersion[];
}> = [
  // Story 1: BRICS Flagship Story (13 blocks: summary, what_changed, 5 paragraphs, 2 headings, chart, timeline, quote, document_viewer)
  {
    story: {
      id: 'sty_brics_flagship',
      organizationId: 'org_default',
      slug: 'brics-expansion-2026-global-economic-realignment',
      title: 'BRICS Expansion 2026: Historic Geoeconomic Shift Finalized in New Delhi',
      summary:
        'Ten member nations formally ratify expansion protocols and introduce a multi-currency trade clearing architecture, reshaping the global economic order.',
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
      topicIds: ['top_brics_2026', 'top_geopolitics', 'top_macroeconomics'],
      entityIds: ['ent_india', 'ent_eu'],
      sourceIds: ['src_reuters_01', 'src_mea_gov', 'src_hindu_01', 'src_ft_01'],
      blocks: [
        {
          id: 'blk_brics_sum',
          blockType: 'summary',
          sortOrder: 0,
          data: {
            headline: 'Executive Briefing: New Delhi Declaration Takeaways',
            bulletPoints: [
              'Ten member nations ratify the 2026 accession protocols, welcoming four new strategic emerging economies into the bloc.',
              'Introduction of the Multilateral Currency Clearing Mesh (MCCM), establishing direct sovereign central bank liquidity swap channels without intermediary third-party conversion.',
              'Combined member GDP now surpasses $41.8 trillion in purchasing-power-parity terms, accounting for 38.4% of total global economic output.',
            ],
          },
        },
        {
          id: 'blk_brics_what_changed',
          blockType: 'what_changed',
          sortOrder: 1,
          data: {
            previousVersionNumber: 1,
            updatedAt: '2026-09-26T10:00:00Z',
            items: [
              {
                changeType: 'added',
                description:
                  'Incorporated ratified New Delhi Declaration official excerpts and legal settlement protocols.',
              },
              {
                changeType: 'updated',
                description:
                  'Updated D3 economic projection chart reflecting revised purchasing-power output figures.',
              },
              {
                changeType: 'added',
                description:
                  'Included interactive timeline of ministerial negotiations and plenary voting results.',
              },
            ],
          },
        },
        {
          id: 'blk_brics_p1',
          blockType: 'paragraph',
          sortOrder: 2,
          data: {
            text: 'NEW DELHI — In a historic unanimous vote at the Bharat Mandapam convention complex, member states of the expanded BRICS alliance formally ratified their comprehensive accession protocols on Saturday morning, concluding twelve months of intensive diplomatic haggling. The landmark accord not only brings four major energy and manufacturing powerhouses into the multilateral fold, but also enacts the long-anticipated New Delhi Declaration, establishing an autonomous local-currency trade clearing architecture designed to insulate South-South commercial corridors from external monetary volatility.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_brics_h1',
          blockType: 'heading',
          sortOrder: 3,
          data: { text: 'Multilateral Clearing Mechanics and Sovereign Swaps', level: 2 },
        },
        {
          id: 'blk_brics_p2',
          blockType: 'paragraph',
          sortOrder: 4,
          data: {
            text: 'At the heart of the technical annexes is the Multilateral Currency Clearing Mesh (MCCM), a distributed interbank messaging and collateral system linking member central banks. Under the ratified framework, bilateral trade contracts in crude energy, industrial fertilizers, and agricultural staples will settle directly across designated sovereign nostro accounts, bypassing legacy correspondent banking corridors in Western financial centers. Participating central monetary authorities will maintain bilateral swap lines backed by pledged sovereign securities, minimizing foreign exchange hedging overhead that has historically burdened emerging market trade.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_brics_chart',
          blockType: 'chart',
          sortOrder: 5,
          data: {
            chartType: 'bar',
            title: 'Combined Member Economic Output ($ Trillion PPP)',
            xAxis: { key: 'year', label: 'Fiscal Year', type: 'category' },
            yAxis: { label: 'Trillion USD Equivalent' },
            series: [{ name: 'Purchasing-Power Output', key: 'gdp', color: '#3b82f6' }],
            values: [
              { year: '2020', gdp: 24.8 },
              { year: '2022', gdp: 29.5 },
              { year: '2024', gdp: 35.2 },
              { year: '2026 Proj', gdp: 41.8 },
            ],
            sourceAttribution: 'World Bank & BRICS Secretariat New Delhi 2026',
          },
        },
        {
          id: 'blk_brics_p3',
          blockType: 'paragraph',
          sortOrder: 6,
          data: {
            text: 'Trade ministers highlighted that merchandise trade between participating economies expanded by 26% year-on-year over the past eighteen months, creating urgent structural demand for friction-free clearing mechanisms. Independent macroeconomic models published by the Bank for International Settlements indicate that avoiding third-currency conversion steps will compress settlement transaction costs by an estimated 140 basis points on volume merchandise shipments, yielding tens of billions in annual working capital efficiencies for participating enterprises.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_brics_timeline',
          blockType: 'timeline',
          sortOrder: 7,
          data: {
            title: 'Summit Progression & Ratification Milestones',
            items: [
              {
                date: '07:30 UTC',
                headline: 'Ministerial Legal Drafting Finalized',
                body: 'Diplomatic envoys reconciled final language across the 48-page technical annex regarding sovereign liquidity swap dispute resolution.',
              },
              {
                date: '08:45 UTC',
                headline: 'Central Bank Governors Endorse Clearing Mesh',
                body: 'The heads of member central monetary authorities executed the operational liquidity protocols behind closed doors.',
              },
              {
                date: '10:00 UTC',
                headline: 'Heads of State Ratify New Delhi Declaration',
                body: 'Unanimous signing ceremony concluded at the plenary hall, formally activating the multilateral accession provisions.',
              },
            ],
          },
        },
        {
          id: 'blk_brics_h2',
          blockType: 'heading',
          sortOrder: 8,
          data: { text: 'Global Capital Repercussions and Currency Dynamics', level: 2 },
        },
        {
          id: 'blk_brics_p4',
          blockType: 'paragraph',
          sortOrder: 9,
          data: {
            text: 'While summit leaders stressed that the initiative does not seek to establish a single synthetic reserve currency, international financial markets responded swiftly. Sovereign bond yields across member nations compressed between 12 and 18 basis points, reflecting anticipated declines in cross-border liquidity risk. Commercial banks in London and Singapore noted an immediate surge in inquiries from institutional trade desks preparing to configure direct bilateral clearing accounts across Asian and Middle Eastern financial nodes.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_brics_quote',
          blockType: 'quote',
          sortOrder: 10,
          data: {
            quote:
              'The operationalization of bilateral currency clearing accounts directly addresses the structural hedging overhead that has constrained South-South trade for decades. This is an evolutionary upgrade to global commercial infrastructure.',
            attribution: 'Aravind Patel',
            title: 'Senior Macroeconomics Fellow, New Delhi Center for Global Policy',
          },
        },
        {
          id: 'blk_brics_p5',
          blockType: 'paragraph',
          sortOrder: 11,
          data: {
            text: 'Looking ahead to the implementation roadmap, the New Delhi Secretariat announced that the first commercial transactions on the Multilateral Currency Clearing Mesh will commence in Q1 2027, starting with maritime energy and fertilizer contracts. A standing technical committee will convene monthly in Mumbai and Dubai to oversee liquidity reserve ratios, ensuring that cross-border clearing balances remain fully collateralized and resistant to speculative foreign exchange contagion.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_brics_doc',
          blockType: 'document_viewer',
          sortOrder: 12,
          data: {
            documentUrl: 'https://mea.gov.in/brics-declaration-2026.htm',
            title: 'Official Treaty: 2026 New Delhi Declaration & Settlement Protocols',
            pageCount: 48,
            documentType: 'treaty',
            description:
              'Certified diplomatic declaration ratified by the plenary heads of state establishing the multilateral currency clearing architecture.',
            highlights: [
              {
                page: 12,
                excerpt:
                  'Article 4.2: Cross-border settlements among participating central monetary authorities shall be denominated in sovereign currencies of the contracting parties.',
                note: 'Core legal basis for local currency clearing',
              },
              {
                page: 29,
                excerpt:
                  'Annex C: Standing swap facilities shall automatically execute liquidity injections when net settlement imbalances exceed five billion SDR-equivalent.',
                note: 'Automated liquidity stabilization rule',
              },
            ],
            sourceAttribution: 'Ministry of External Affairs Secretariat',
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

  // Story 2: Semiconductors & Advanced Lithography (Summary, Paragraph, Table, Quote)
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
      isSubscriberOnly: true,
      entityIds: ['ent_tsmc', 'ent_nvidia'],
      sourceIds: ['src_techcrunch_01', 'src_reuters_01'],
      blocks: [
        {
          id: 'blk_semi_sum',
          blockType: 'summary',
          sortOrder: 0,
          data: {
            headline: 'Consortium Highlights & Technical Breakthroughs',
            bulletPoints: [
              'Unification of High-NA EUV optical tolerances across major equipment vendors and commercial foundries.',
              'Open-standard chiplet interconnect framework targeting under 0.78 pJ/bit power dissipation at multi-terabit bandwidths.',
              'Shared patent pool of 1,400 process patents covers nanosheet gate-all-around (GAA) channel release techniques.',
            ],
          },
        },
        {
          id: 'blk_semi_p1',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: 'TAIPEI — In a strategic shift toward interoperable silicon fabrication, an unprecedented coalition of premier semiconductor foundries, tool manufacturers, and materials science institutes announced the formal ratification of the 2-Nanometer GAA Open Lithography Standard on Sunday. The alliance brings together global foundry titans alongside European optics leaders and American fabless chip architects to establish a unified design-technology co-optimization (DTCO) specification, seeking to curb multi-billion-dollar R&D redundancies as node shrink physics approaches sub-atomic quantum barriers.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_semi_h1',
          blockType: 'heading',
          sortOrder: 2,
          data: { text: 'Gate-All-Around Physics and High-NA Optics', level: 2 },
        },
        {
          id: 'blk_semi_p2',
          blockType: 'paragraph',
          sortOrder: 3,
          data: {
            text: 'Transitioning from three-dimensional FinFETs to horizontal nanosheet Gate-All-Around (GAA) structures represents the most radical device architecture overhaul since the introduction of high-k metal gates in 2007. By enclosing the conducting silicon channel on all four sides, GAA eliminates subthreshold leakage currents that plague sub-3nm geometries. Under the newly ratified standard, foundries agreed to align their anamorphic High-NA EUV 0.55 numerical aperture optical settings, standardizing reticle magnification splits to prevent wafer distortion across disparate international production lines.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_semi_table',
          blockType: 'table',
          sortOrder: 4,
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
              ['Interconnect Energy (pJ/bit)', '1.40', '0.78', '-44%'],
              ['Static Gate Leakage (nA/µm)', '4.2', '0.6', '-86%'],
            ],
          },
        },
        {
          id: 'blk_semi_p3',
          blockType: 'paragraph',
          sortOrder: 5,
          data: {
            text: 'The shared specifications also govern advanced 2.5D and 3D heterogeneous packaging, codifying micro-bump pitches down to 10 micrometers and monolithic hybrid bonding interfaces. In practical computing applications, this will allow hyperscale AI accelerator designers to combine high-density 2nm compute dies directly with high-bandwidth memory stacks using standard interconnect protocols, reducing thermal throttling and memory-wall latencies that currently throttle large-language model training workloads.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_semi_diagram',
          blockType: 'diagram',
          sortOrder: 6,
          data: {
            title: 'Unified 2nm GAAFET Transistor & Chiplet Interconnect Topology',
            format: 'mermaid',
            definition:
              'flowchart LR\n  EUV[High-NA EUV Scanner] -->|Pattern Transfer| NS[Nanosheet Channel Growth]\n  NS -->|Channel Release| HK[High-k Gate Dielectric]\n  NS -->|Buried Power Rail| BSPDN[Backside Power Delivery]\n  HK -->|Die-to-Wafer| HYB[Hybrid Direct-Bond Interconnect]',
            caption: 'Process flow for 2nm nanosheet transistors and backside power rails.',
          },
        },
        {
          id: 'blk_semi_h2',
          blockType: 'heading',
          sortOrder: 7,
          data: { text: 'Venture Capital and Supply Chain Ecosystems', level: 2 },
        },
        {
          id: 'blk_semi_p4',
          blockType: 'paragraph',
          sortOrder: 8,
          data: {
            text: 'Industry reaction to the standard was overwhelmingly positive across technology capitals. By decoupling proprietary IP blocks from rigid fab-specific lithography constraints, fabless startup ecosystems in Europe, the United States, and East Asia gain predictable tape-out targets. Equipment vendors project that standardization will accelerate volume wafer yields by as much as three quarters, dramatically lowering the financial barrier to producing custom silicon for autonomous edge devices and robotics.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_semi_quote',
          blockType: 'quote',
          sortOrder: 9,
          data: {
            quote:
              'Accelerated computing and 2nm architecture represent the single largest performance inflection in semiconductor history. Standardizing nanosheet lithography ensures our next-generation AI architectures deploy at unprecedented energy efficiency.',
            attribution: 'Jensen Huang',
            title: 'Chief Executive Officer, NVIDIA Corporation',
          },
        },
        {
          id: 'blk_semi_p5',
          blockType: 'paragraph',
          sortOrder: 10,
          data: {
            text: 'Pilot wafer runs utilizing the standardized GAA design rules are scheduled to begin in Hsinchu and Dresden in early 2027, with high-volume consumer smartphone and hyperscale datacenter silicon deliveries slated for the second half of that year. Analysts at TrendForce estimate the standard will safeguard over $80 billion in planned fab expansions against custom tooling obsolescence.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_semi_stat',
          blockType: 'statistic',
          sortOrder: 11,
          data: {
            value: '310 MTr/mm²',
            label: 'Peak Logic Density Achieved on 2nm GAA Test Vehicles',
            trend: 'up',
            trendValue: '+44% over 3nm',
            context: 'Standardized High-NA EUV dual-patterning run',
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

  // Story 3: Nuclear Fusion (Paragraph, D3 Line Chart, Statistic, Citation)
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
      topicIds: ['top_energy_fusion', 'top_climate_transition'],
      isSubscriberOnly: true,
      entityIds: ['ent_iter'],
      sourceIds: ['src_nature_01'],
      blocks: [
        {
          id: 'blk_fusion_sum',
          blockType: 'summary',
          sortOrder: 0,
          data: {
            headline: 'Key Scientific Discoveries: 120-Second Steady State Run',
            bulletPoints: [
              'Experimental tokamak maintains burning deuterium-tritium plasma core for 120 continuous seconds.',
              'Achieved an energy multiplication factor of Q = 1.35, generating 24.3 MW thermal output from 18.0 MW injected heating power.',
              'High-temperature rare-earth barium copper oxide (REBCO) superconducting tape magnets withstood intense neutron flux with zero thermal quenching.',
            ],
          },
        },
        {
          id: 'blk_fusion_p1',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: 'OXFORD — In what international nuclear physicists are describing as the most significant practical milestone toward commercial fusion energy since the inception of magnetic confinement research, the experimental compact tokamak facility in Oxfordshire successfully maintained a burning deuterium-tritium plasma for two full minutes on Sunday evening, demonstrating a sustained net energy gain factor of Q = 1.35 under rigorous diagnostic validation.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_fusion_h1',
          blockType: 'heading',
          sortOrder: 2,
          data: { text: 'High-Temperature Superconductors and Magnetic Stability', level: 2 },
        },
        {
          id: 'blk_fusion_p2',
          blockType: 'paragraph',
          sortOrder: 3,
          data: {
            text: 'Unlike older legacy stellarators and copper-wound tokamaks that could only pulse for fractions of a second before thermal dissipation forced a shutdown, this reactor leverages advanced high-temperature superconducting (HTS) tape composed of rare-earth barium copper oxide. Operating at 20 Kelvin rather than near absolute zero, the magnetic coils generated a toroidal field strength exceeding 12.4 Tesla, suppressing turbulent heat loss along magnetic field lines and preventing localized edge-localized modes (ELMs) from eroding the tungsten divertor armor.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_fusion_chart',
          blockType: 'chart',
          sortOrder: 4,
          data: {
            chartType: 'line',
            title: 'Steady-State Plasma Core Temperature Profile (keV)',
            xAxis: { key: 'seconds', label: 'Confinement Duration (Seconds)', type: 'linear' },
            yAxis: { label: 'Core Temp (keV)' },
            series: [{ name: 'Plasma Core Temp', key: 'temp', color: '#ef4444' }],
            values: [
              { seconds: '0', temp: 2.1 },
              { seconds: '20', temp: 8.9 },
              { seconds: '40', temp: 13.5 },
              { seconds: '60', temp: 15.4 },
              { seconds: '80', temp: 15.8 },
              { seconds: '100', temp: 16.0 },
              { seconds: '120', temp: 16.1 },
            ],
            sourceAttribution: 'Culham Centre for Fusion Energy & Nature 2026',
          },
        },
        {
          id: 'blk_fusion_p3',
          blockType: 'paragraph',
          sortOrder: 5,
          data: {
            text: 'Continuous neutral beam injection and electron cyclotron resonance heating were coupled seamlessly with real-time plasma shape control algorithms running on microsecond control loops. Core temperatures peaked at 185 million degrees Celsius—over ten times hotter than the center of the Sun—without generating instabilities that have historically collapsed earlier burning plasma experiments.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_fusion_stat',
          blockType: 'statistic',
          sortOrder: 6,
          data: {
            value: '1.35x Q-Factor',
            label: 'Empirical Net Energy Output Gain Ratio',
            trend: 'up',
            trendValue: '+35% above breakeven',
            context: 'Continuous high-temperature superconducting magnet stabilization',
          },
        },
        {
          id: 'blk_fusion_h2',
          blockType: 'heading',
          sortOrder: 7,
          data: { text: 'Commercial Grid Integration and Pilot Plant Timelines', level: 2 },
        },
        {
          id: 'blk_fusion_p4',
          blockType: 'paragraph',
          sortOrder: 8,
          data: {
            text: 'The sustained run offers vital empirical proof-of-concept for commercial fusion ventures currently raising billions in private capital. While national laboratory experiments at the National Ignition Facility achieved scientific breakeven via laser inertial confinement, magnetic confinement offers the only proven engineering path to continuous, round-the-clock baseload electrical power without requiring repetitive target pellet manufacturing.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_fusion_callout',
          blockType: 'callout',
          sortOrder: 9,
          data: {
            style: 'tip',
            title: 'Engineering Landmark: Tritium Breeding Verification',
            text: 'Secondary lithium-lead blanket modules captured 98.4% of emitted 14.1 MeV neutrons, confirming that future commercial reactors can breed their own tritium fuel inventory without external dependency.',
          },
        },
        {
          id: 'blk_fusion_p5',
          blockType: 'paragraph',
          sortOrder: 10,
          data: {
            text: 'The consortium stated that the experimental tokamak will now undergo scheduled maintenance and neutron tomography inspections before commencing an extended 1,000-second demonstration shot scheduled for Q3 2027. Engineering plans for a 200 MW grid-connected pilot plant in northern England are currently under regulatory review with the UK Atomic Energy Authority.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_fusion_citation',
          blockType: 'citation',
          sortOrder: 11,
          data: {
            claim:
              'Steady-state deuterium-tritium plasma sustained continuously beyond 120s with positive Q-factor.',
            sourceIds: ['src_nature_01'],
            quoteExcerpt:
              'We report continuous plasma confinement exceeding 120 seconds with energy multiplication factor Q = 1.35, validating the thermodynamic viability of high-field HTS magnet configurations.',
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

  // Story 4: Macroeconomics & FX Liquidity (Paragraph, D3 Area Chart, Quote)
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
      topicIds: ['top_macroeconomics', 'top_geopolitics', 'top_digital_currency'],
      entityIds: ['ent_india', 'ent_eu'],
      sourceIds: ['src_bloomberg_01', 'src_hindu_02', 'src_ft_01'],
      blocks: [
        {
          id: 'blk_markets_sum',
          blockType: 'summary',
          sortOrder: 0,
          data: {
            headline: 'Multilateral Liquidity Facility: Operational Launch',
            bulletPoints: [
              'Cross-border bilateral currency settlement volumes surged from $14.2B to $72.1B daily within five months.',
              'Automated collateral management eliminates intermediate USD conversion, compressing transaction costs by 140 basis points.',
              'Twelve central banks across G20 and emerging economies completed technical interoperability testing.',
            ],
          },
        },
        {
          id: 'blk_markets_p1',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: 'BASEL — The Bank for International Settlements confirmed on Monday that twelve sovereign central monetary authorities have completed rigorous technical interoperability testing and formally activated the Multilateral Liquidity Facility (MLF), a distributed settlement architecture enabling real-time bilateral currency clearing without routing through legacy USD correspondent banking networks. The system went live at 06:00 UTC, processing its first cross-border energy commodity settlement between two Asian central banks within forty-seven seconds of activation.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_markets_h1',
          blockType: 'heading',
          sortOrder: 2,
          data: { text: 'Clearing Architecture and Collateral Mechanics', level: 2 },
        },
        {
          id: 'blk_markets_p2',
          blockType: 'paragraph',
          sortOrder: 3,
          data: {
            text: 'The MLF operates through a tiered hierarchy of central bank nodes, each maintaining pledged sovereign security pools denominated in local currencies. When a trade settlement request enters the network, the automated collateral engine performs instantaneous mark-to-market valuations across pledged bond portfolios, releasing settlement finality in under two seconds. By eliminating the traditional T+2 settlement lag and the associated foreign exchange hedging overhead, the facility compresses transaction costs by an estimated 140 basis points on volume merchandise shipments—a savings that translates to tens of billions in annual working capital efficiencies.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_markets_chart',
          blockType: 'chart',
          sortOrder: 4,
          data: {
            chartType: 'area',
            title: 'Daily Bilateral Currency Settlement Volume ($ Billions)',
            xAxis: { key: 'month', label: 'Month', type: 'category' },
            yAxis: { label: 'Billion USD Equivalent' },
            series: [{ name: 'Direct Bilateral Volume', key: 'volume', color: '#10b981' }],
            values: [
              { month: 'Apr 26', volume: 14.2 },
              { month: 'May 26', volume: 19.8 },
              { month: 'Jun 26', volume: 28.6 },
              { month: 'Jul 26', volume: 38.5 },
              { month: 'Aug 26', volume: 49.3 },
              { month: 'Sep 26', volume: 72.1 },
            ],
            sourceAttribution: 'Bank for International Settlements 2026',
          },
        },
        {
          id: 'blk_markets_map',
          blockType: 'map',
          sortOrder: 5,
          data: {
            title: 'Participating Central Bank Nodes',
            style: 'dark',
            center: [55.0, 25.0],
            zoom: 2,
            markers: [
              {
                coordinates: [77.209, 28.6139],
                title: 'Reserve Bank of India',
                description: 'Anchor node for South Asian clearing corridor',
              },
              {
                coordinates: [116.4074, 39.9042],
                title: "People's Bank of China",
                description: 'Largest bilateral volume counterparty',
              },
              {
                coordinates: [-46.6333, -23.5505],
                title: 'Central Bank of Brazil',
                description: 'Latin American commodity settlement hub',
              },
              {
                coordinates: [7.4474, 46.948],
                title: 'Bank for International Settlements',
                description: 'Technical coordination and dispute resolution',
              },
              {
                coordinates: [54.3773, 24.4539],
                title: 'Central Bank of UAE',
                description: 'Energy trade denomination anchor',
              },
            ],
          },
        },
        {
          id: 'blk_markets_h2',
          blockType: 'heading',
          sortOrder: 6,
          data: { text: 'Market Impact and Institutional Response', level: 2 },
        },
        {
          id: 'blk_markets_p3',
          blockType: 'paragraph',
          sortOrder: 7,
          data: {
            text: 'Financial markets responded with notable positioning shifts. Sovereign bond yields across participating nations compressed by 12 to 18 basis points within hours of the announcement, reflecting anticipated declines in cross-border liquidity risk premiums. Commercial banks in London and Singapore reported an immediate surge in inquiries from institutional trade desks preparing to configure direct bilateral clearing accounts for Asian and Middle Eastern commodity corridors.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_markets_quote',
          blockType: 'quote',
          sortOrder: 8,
          data: {
            quote:
              'Automated collateralized clearing corridors eliminate intermediate conversion friction and re-anchor sovereign trade settlement on a foundation of direct bilateral trust. This represents a structural evolution in how the global economy processes cross-border commerce.',
            attribution: 'Secretariat for International Settlements',
            title: 'Basel Policy Declaration, September 2026',
          },
        },
        {
          id: 'blk_markets_p4',
          blockType: 'paragraph',
          sortOrder: 9,
          data: {
            text: 'The BIS coordination secretariat confirmed that an additional eight central banks have formally applied for technical onboarding, with the second tranche of participating monetary authorities expected to achieve production readiness by Q2 2027. Operational oversight will be managed through a standing committee meeting monthly in Basel and Dubai, ensuring continuous monitoring of net settlement imbalances and collateral adequacy ratios.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_markets_stat',
          blockType: 'statistic',
          sortOrder: 10,
          data: {
            value: '$72.1B',
            label: 'Daily Bilateral Settlement Volume (September 2026)',
            trend: 'up',
            trendValue: '+408% since April',
            context: 'Direct sovereign currency settlement without USD intermediation',
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

  // Story 5: Autonomous AI Agents & Verification (Paragraph, Interactive Poll, Document Viewer)
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
      topicIds: ['top_ai_agents', 'top_cybersecurity'],
      isSubscriberOnly: false,
      entityIds: ['ent_deepmind', 'ent_openai'],
      sourceIds: ['src_mit_tech_01', 'src_techcrunch_01'],
      blocks: [
        {
          id: 'blk_ai_sum',
          blockType: 'summary',
          sortOrder: 0,
          data: {
            headline: 'Autonomous Agent Verification: Key Findings',
            bulletPoints: [
              'Multi-agent verification loops achieve a 99.98% zero-defect rate across 14 million lines of critical infrastructure code.',
              'Formal abstract-interpretation passes detect semantic errors invisible to conventional static analysis or human code review.',
              'Treaty negotiations in Geneva establish mandatory verification gates for frontier model deployments in regulated sectors.',
            ],
          },
        },
        {
          id: 'blk_ai_p1',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: 'SAN FRANCISCO — In a landmark evaluation that may permanently reshape the regulatory landscape for artificial intelligence in critical systems, autonomous agent teams operating under formal mathematical verification architectures have demonstrated zero-defect deployment across multi-tier production telemetry systems in both the telecommunications and electrical power grid sectors. The results, validated independently by MIT CSAIL and the Fraunhofer Institute, show that multi-agent verification loops consistently outperform traditional human code-review benchmarks by two orders of magnitude in defect detection sensitivity.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_ai_h1',
          blockType: 'heading',
          sortOrder: 2,
          data: { text: 'Formal Verification Architecture and SMT Solvers', level: 2 },
        },
        {
          id: 'blk_ai_p2',
          blockType: 'paragraph',
          sortOrder: 3,
          data: {
            text: 'The verification framework operates through a cascading multi-agent pipeline. A primary generative agent produces candidate code patches, which are then subjected to abstract interpretation by a secondary verifier agent that constructs formal proofs of correctness using SMT (Satisfiability Modulo Theories) solvers. A tertiary adversarial agent attempts targeted fault injection—simulating power fluctuation edge cases, network partitioning, and Byzantine failure scenarios—to stress-test resilience. Only patches that survive all three gates enter the deployment staging environment.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_ai_chart',
          blockType: 'chart',
          sortOrder: 4,
          data: {
            chartType: 'bar',
            title: 'Defect Detection Rate: Autonomous Agents vs. Human Review',
            xAxis: { key: 'category', label: 'Infrastructure Domain', type: 'category' },
            yAxis: { label: 'Defects per Million Lines of Code' },
            series: [
              { name: 'Human Review', key: 'human', color: '#f97316' },
              { name: 'Multi-Agent Verification', key: 'agent', color: '#3b82f6' },
            ],
            values: [
              { category: 'Power Grid SCADA', human: 42, agent: 0.2 },
              { category: 'Telecom Switching', human: 38, agent: 0.1 },
              { category: 'Financial Settlement', human: 55, agent: 0.4 },
              { category: 'Medical Devices', human: 67, agent: 0.3 },
            ],
            sourceAttribution: 'MIT CSAIL & Fraunhofer AISEC Joint Evaluation 2026',
          },
        },
        {
          id: 'blk_ai_p3',
          blockType: 'paragraph',
          sortOrder: 5,
          data: {
            text: 'Regulatory bodies are now grappling with the implications. At a concurrent session at the Geneva Convention on AI Safety, delegates from 42 nations debated mandatory verification gates for frontier model deployments in regulated infrastructure sectors. Proponents argue that formal mathematical proofs provide stronger safety guarantees than any human review process; critics counter that automated systems may develop correlated blind spots invisible to their own verification chains.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_ai_poll',
          blockType: 'poll',
          sortOrder: 6,
          data: {
            pollId: 'poll_ai_critical_infra',
            question:
              'Should power grid and telecommunications infrastructure allow direct autonomous agent deployments?',
            options: [
              {
                id: 'opt_1',
                text: 'Yes, if validated by formal mathematical verification',
                voteCount: 420,
              },
              {
                id: 'opt_2',
                text: 'Hybrid only: Mandatory human air-gap signoff',
                voteCount: 890,
              },
              {
                id: 'opt_3',
                text: 'No, mission-critical infrastructure must remain 100% human-operated',
                voteCount: 310,
              },
            ],
            totalVotes: 1620,
            closed: false,
          },
        },
        {
          id: 'blk_ai_h2',
          blockType: 'heading',
          sortOrder: 7,
          data: { text: 'Industry Adoption and Safety Treaty Negotiations', level: 2 },
        },
        {
          id: 'blk_ai_p4',
          blockType: 'paragraph',
          sortOrder: 8,
          data: {
            text: 'Major hyperscale cloud providers have already begun integrating the multi-agent verification pipeline into their managed infrastructure offerings, with at least three providers planning commercial availability by Q1 2027. The compute overhead for running formal verification passes adds approximately 12% to deployment time but reduces post-deployment incident response costs by an estimated 94%, according to internal analyses shared with this publication.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_ai_quote',
          blockType: 'quote',
          sortOrder: 9,
          data: {
            quote:
              'When a multi-agent system can mathematically prove that its output is correct before deployment, we are no longer discussing whether AI should manage infrastructure—we are discussing the irresponsibility of not using it.',
            attribution: 'Dr. Sarah Chen',
            title: 'Director of Formal Methods, MIT Computer Science & AI Laboratory',
          },
        },
        {
          id: 'blk_ai_doc',
          blockType: 'document_viewer',
          sortOrder: 10,
          data: {
            documentUrl:
              'https://news.platform/docs/benchmarks/agent-verification-protocol-2026.pdf',
            title: 'Formal Multi-Agent Telemetry Verification Specification (v2.4)',
            pageCount: 24,
            documentType: 'whitepaper',
            description:
              'Peer-reviewed technical specification defining formal verification gates, automated test generation, and adversarial fault-injection protocols.',
            highlights: [
              {
                page: 4,
                excerpt:
                  'Zero-defect boundary criteria enforced via abstract interpretation and SMT-solver verification passes.',
                note: 'Core safety theorem',
              },
              {
                page: 11,
                excerpt:
                  'Adversarial fault injection simulates 2,400 Byzantine failure modes including network partitioning, clock drift, and power fluctuation edge cases.',
                note: 'Stress testing methodology',
              },
            ],
            sourceAttribution: 'MIT Computer Science & AI Lab',
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

  // Story 6: Quantum Computing Breakthrough (Paragraph, Audio Player Dispatch, D3 Scatter Chart)
  {
    story: {
      id: 'sty_quantum_01',
      organizationId: 'org_default',
      slug: 'topological-quantum-processor-10k-qubits-fault-tolerant',
      title: 'Topological Quantum Processor Surpasses 10,000 Fault-Tolerant Logical Qubits',
      summary:
        'Majorana zero-mode braiding achieves two orders of magnitude lower error rates, opening the pathway to full molecular simulations.',
      status: 'PUBLISHED',
      articleType: 'science',
      authorId: 'usr_journalist_david',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-01T06:00:00Z',
      createdAt: '2026-10-01T04:30:00Z',
      updatedAt: '2026-10-01T06:00:00Z',
      topicIds: ['top_quantum_computing', 'top_semiconductors'],
      isSubscriberOnly: true,
      entityIds: ['ent_cern'],
      sourceIds: ['src_cern_01'],
      blocks: [
        {
          id: 'blk_quantum_sum',
          blockType: 'summary',
          sortOrder: 0,
          data: {
            headline: 'Topological Quantum Breakthrough: Key Results',
            bulletPoints: [
              '10,240 fault-tolerant logical qubits achieved using Majorana zero-mode braiding on a single cryogenic module.',
              'Gate error rates reduced to 8 × 10⁻⁸, two orders of magnitude below conventional superconducting transmon architectures.',
              'First-ever full simulation of the cytochrome P450 enzyme folding pathway completed in 47 minutes—a task estimated to require 10,000 years on classical supercomputers.',
            ],
          },
        },
        {
          id: 'blk_quantum_p1',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: 'COPENHAGEN — In a research achievement that fundamentally redefines the practical horizon for quantum computing, the Copenhagen Quantum Foundry announced on Wednesday that its topological quantum processor has surpassed the 10,000 fault-tolerant logical qubit threshold—the long-theorized milestone at which quantum machines become capable of performing molecular-scale simulations that are utterly intractable on any classical computer architecture, regardless of parallelization strategy.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_quantum_h1',
          blockType: 'heading',
          sortOrder: 2,
          data: { text: 'Majorana Zero-Mode Braiding and Topological Protection', level: 2 },
        },
        {
          id: 'blk_quantum_p2',
          blockType: 'paragraph',
          sortOrder: 3,
          data: {
            text: 'The breakthrough rests on a fundamentally different approach to quantum error correction. Rather than wrapping each logical qubit in a cage of thousands of noisy physical qubits, the topological architecture encodes quantum information in the braiding patterns of Majorana zero-mode quasiparticles—exotic excitations that exist at the boundaries of specially engineered semiconductor nanowires. Because the information is stored non-locally across the braid topology, it is inherently immune to the local environmental decoherence events that plague conventional superconducting transmon and trapped-ion systems.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_quantum_audio',
          blockType: 'audio',
          sortOrder: 4,
          data: {
            url: '/audio/quantum-topological-qubits-briefing.mp3',
            title: 'GlobalPulse Deep Dive: Inside the Majorana Topological Qubit Breakthrough',
            narrator: 'Elena Rostova & David Chen',
            durationSeconds: 245,
            transcript:
              'Welcome to this GlobalPulse Special Report. Today, we break down how topological braid protection neutralizes environmental decoherence without requiring thousands of redundant physical qubits per logical unit. The implications for drug discovery, materials science, and cryptographic security are staggering.',
            language: 'en',
          },
        },
        {
          id: 'blk_quantum_chart',
          blockType: 'chart',
          sortOrder: 5,
          data: {
            chartType: 'scatter',
            title: 'Logical Gate Error Rate vs. Operating Temperature',
            xAxis: { key: 'tempKelvin', label: 'Cryostat Temp (Kelvin)', type: 'linear' },
            yAxis: { label: 'Gate Error Rate (10⁻⁶)' },
            series: [{ name: 'Topological Architecture', key: 'errorRate', color: '#8b5cf6' }],
            values: [
              { tempKelvin: '0.010', errorRate: 0.06 },
              { tempKelvin: '0.015', errorRate: 0.08 },
              { tempKelvin: '0.050', errorRate: 0.12 },
              { tempKelvin: '0.100', errorRate: 0.25 },
              { tempKelvin: '0.250', errorRate: 0.94 },
              { tempKelvin: '0.500', errorRate: 3.8 },
            ],
            sourceAttribution: 'Copenhagen Quantum Foundry & Physical Review Letters 2026',
          },
        },
        {
          id: 'blk_quantum_h2',
          blockType: 'heading',
          sortOrder: 6,
          data: {
            text: 'Drug Discovery, Materials Science, and Cryptographic Implications',
            level: 2,
          },
        },
        {
          id: 'blk_quantum_p3',
          blockType: 'paragraph',
          sortOrder: 7,
          data: {
            text: "The research team demonstrated the processor's capability by executing the first-ever complete quantum simulation of the cytochrome P450 enzyme folding pathway—a problem of immense importance to pharmaceutical drug metabolism prediction. The simulation, which accurately modeled electron orbital interactions across 1,847 atoms, completed in 47 minutes. Classical density functional theory estimates placed the equivalent computation at over 10,000 years on the world's fastest exascale supercomputer.",
            format: 'markdown',
          },
        },
        {
          id: 'blk_quantum_callout',
          blockType: 'callout',
          sortOrder: 8,
          data: {
            style: 'warning',
            title: 'Cryptographic Security Advisory',
            text: 'With 10,000+ logical qubits, the processor approaches the theoretical threshold for breaking RSA-2048 encryption. NIST has accelerated its post-quantum cryptography migration timeline, urging all federal agencies to complete algorithm transitions by 2028.',
          },
        },
        {
          id: 'blk_quantum_p4',
          blockType: 'paragraph',
          sortOrder: 9,
          data: {
            text: 'Commercial licensing of the topological architecture has been secured by three major cloud providers, with managed quantum computing services expected to enter public preview by mid-2027. The Copenhagen team emphasized that manufacturing the specialized indium antimonide nanowires at scale remains the primary engineering bottleneck, but noted that partnership agreements with semiconductor foundries in the Netherlands are progressing toward pilot production.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_quantum_quote',
          blockType: 'quote',
          sortOrder: 10,
          data: {
            quote:
              'We have crossed the threshold from quantum curiosity to quantum utility. The cytochrome simulation proves that topological qubits can solve real-world problems that no classical machine will ever touch.',
            attribution: 'Prof. Annika Sørensen',
            title: 'Director, Copenhagen Quantum Foundry',
          },
        },
      ],
    },
    versions: [
      {
        id: 'ver_quantum_v1',
        storyId: 'sty_quantum_01',
        versionNumber: 1,
        title: 'Topological Quantum Processor Surpasses 10,000 Fault-Tolerant Logical Qubits',
        summary:
          'Majorana zero-mode braiding achieves two orders of magnitude lower error rates, opening the pathway to full molecular simulations.',
        changeSummary: 'Initial research dispatch.',
        blocks: [],
        authorId: 'usr_journalist_david',
        clientType: 'human_web',
        createdAt: '2026-10-01T06:00:00Z',
      },
    ],
  },

  // Story 7: Deep Space & Lunar Gateway (Paragraph, Map, Timeline, Gallery)
  {
    story: {
      id: 'sty_space_01',
      organizationId: 'org_default',
      slug: 'international-lunar-gateway-enters-polar-halo-orbit',
      title: 'International Lunar Gateway Completes Final Orbit Insertion Maneuver',
      summary:
        'Astronauts and autonomous robotics modules finalize docking protocols in the Moon’s near-rectilinear halo orbit ahead of crewed surface landings.',
      status: 'PUBLISHED',
      articleType: 'explainer',
      authorId: 'usr_editor',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-01T12:00:00Z',
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T12:00:00Z',
      topicIds: ['top_space_exploration'],
      entityIds: ['ent_usa', 'ent_eu', 'ent_isro'],
      sourceIds: ['src_esa_01'],
      blocks: [
        {
          id: 'blk_space_sum',
          blockType: 'summary',
          sortOrder: 0,
          data: {
            headline: 'Lunar Gateway: Orbit Insertion Mission Status',
            bulletPoints: [
              'Gateway station successfully locked into 7-day near-rectilinear halo orbit above the lunar south pole.',
              'Solar Electric Propulsion thrusters completed an 18-hour continuous burn for trans-lunar injection.',
              'Optical laser communication terminal established 1.2 Gbps high-bandwidth data downlink to terrestrial stations.',
            ],
          },
        },
        {
          id: 'blk_space_p1',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: "HOUSTON & DARMSTADT — Flight directors at NASA Johnson Space Center and ESA's European Space Operations Centre confirmed on Tuesday morning that the International Lunar Gateway space station completed its final high-precision trajectory correction burn, settling into its planned near-rectilinear halo orbit approximately 3,000 kilometers above the Moon's south pole. The maneuver marks the culmination of a 14-month transit from low Earth orbit and establishes the first permanent crew-tended outpost beyond cislunar space.",
            format: 'markdown',
          },
        },
        {
          id: 'blk_space_h1',
          blockType: 'heading',
          sortOrder: 2,
          data: { text: 'Propulsion Systems and Orbital Mechanics', level: 2 },
        },
        {
          id: 'blk_space_p2',
          blockType: 'paragraph',
          sortOrder: 3,
          data: {
            text: "The Gateway's ion-driven Solar Electric Propulsion system, powered by two 30-kilowatt roll-out solar array wings, executed the insertion burn with sub-centimeter navigation accuracy validated by the Deep Space Network's three tracking complexes in Goldstone, Madrid, and Canberra. The near-rectilinear halo orbit was selected because it provides continuous line-of-sight communications with both Earth and the lunar south pole landing sites while consuming minimal station-keeping propellant—estimated at less than 10 kilograms of xenon per year.",
            format: 'markdown',
          },
        },
        {
          id: 'blk_space_map',
          blockType: 'map',
          sortOrder: 4,
          data: {
            title: 'Artemis Surface Communications & Launch Tracking Network',
            style: 'dark',
            center: [-80.6077, 28.3922],
            zoom: 2,
            markers: [
              {
                coordinates: [-80.6077, 28.3922],
                title: 'Kennedy Space Center LC-39B',
                description: 'Primary terrestrial heavy-lift departure point',
              },
              {
                coordinates: [8.65, 49.87],
                title: 'ESOC Darmstadt',
                description: 'Gateway telemetry navigation & propulsion control',
              },
              {
                coordinates: [130.97, 30.4],
                title: 'Tanegashima Space Center',
                description: 'JAXA Pacific tracking & logistics resupply staging',
              },
              {
                coordinates: [80.23, 13.72],
                title: 'ISRO ISTRAC Sriharikota',
                description: 'Indian deep-space tracking antenna station',
              },
            ],
          },
        },
        {
          id: 'blk_space_timeline',
          blockType: 'timeline',
          sortOrder: 5,
          data: {
            title: 'Gateway Insertion Flight Progression',
            items: [
              {
                date: '14:20 UTC',
                headline: 'Trans-Lunar Injection Verified',
                body: 'Solar Electric Propulsion thrusters fired for 18 continuous hours to achieve escape velocity from Earth gravitational influence.',
              },
              {
                date: '18:22 UTC',
                headline: 'Near-Rectilinear Halo Insertion',
                body: 'Habitation and Logistics Outpost module safely locked into the target 7-day lunar polar halo orbit corridor with sub-centimeter accuracy.',
              },
              {
                date: '21:45 UTC',
                headline: 'Optical Laser Link Initialized',
                body: 'Terrestrial optical communication terminals at Goldstone and Madrid established ultra-high-bandwidth 1.2 Gbps data downlink.',
              },
            ],
          },
        },
        {
          id: 'blk_space_h2',
          blockType: 'heading',
          sortOrder: 6,
          data: { text: 'International Cooperation and Next Mission Phases', level: 2 },
        },
        {
          id: 'blk_space_p3',
          blockType: 'paragraph',
          sortOrder: 7,
          data: {
            text: 'The Gateway represents an unprecedented multinational collaboration, with habitation modules contributed by ESA and JAXA, propulsion elements from NASA, robotic arms from CSA, and deep-space tracking support from ISRO. The outpost will serve as a staging point for crewed Artemis lunar surface missions targeting the permanently shadowed craters of Shackleton and Haworth, where water ice deposits could be extracted to produce rocket propellant and life support consumables.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_space_img',
          blockType: 'image',
          sortOrder: 8,
          data: {
            url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
            altText: 'Lunar Gateway Station in Near-Rectilinear Halo Orbit',
            caption:
              "High-resolution rendering of the International Lunar Gateway orbiting above the Moon's south polar region, showing deployed solar arrays and docked logistics modules.",
            credit: 'NASA / ESA / JAXA Aerospace Consortium',
            aspectRatio: '16:9',
          },
        },
        {
          id: 'blk_space_p4',
          blockType: 'paragraph',
          sortOrder: 9,
          data: {
            text: "The first crewed rotation aboard the Gateway is scheduled for Q2 2027, with a four-person international crew spending 30 days conducting scientific experiments and preparing surface descent systems. Mission planners emphasized that the station's autonomous systems successfully maintained all life support parameters throughout the uncrewed transit, validating the closed-loop environmental control architecture for extended deep-space habitation.",
            format: 'markdown',
          },
        },
        {
          id: 'blk_space_stat',
          blockType: 'statistic',
          sortOrder: 10,
          data: {
            value: '7 Days',
            label: 'Near-Rectilinear Halo Orbital Period',
            trend: 'neutral',
            context:
              'Continuous line-of-sight communications with Earth and lunar south pole landing sites.',
            sourceAttribution: 'NASA Deep Space Network Telemetry',
          },
        },
      ],
    },
    versions: [
      {
        id: 'ver_space_v1',
        storyId: 'sty_space_01',
        versionNumber: 1,
        title: 'International Lunar Gateway Completes Final Orbit Insertion Maneuver',
        summary:
          'Astronauts and autonomous robotics modules finalize docking protocols in the Moon’s near-rectilinear halo orbit ahead of crewed surface landings.',
        changeSummary: 'Insertion confirmation bulletin.',
        blocks: [],
        authorId: 'usr_editor',
        clientType: 'human_web',
        createdAt: '2026-10-01T12:00:00Z',
      },
    ],
  },

  // Story 8: Clean Energy Grid Transition (Summary, Paragraph, D3 Donut Chart, Callout)
  {
    story: {
      id: 'sty_climate_01',
      organizationId: 'org_default',
      slug: 'global-grid-integrates-500gwh-solid-state-storage',
      title: 'Global Energy Grid Connects First 500 GWh of Solid-State Storage',
      summary:
        'Non-flammable solid electrolyte batteries overcome thermal runaways, enabling 24/7 baseload renewable integration across three continents.',
      status: 'PUBLISHED',
      articleType: 'analysis',
      authorId: 'usr_journalist_amara',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-01T15:00:00Z',
      createdAt: '2026-10-01T13:00:00Z',
      updatedAt: '2026-10-01T15:00:00Z',
      topicIds: ['top_climate_transition', 'top_macroeconomics'],
      entityIds: ['ent_eu', 'ent_india'],
      sourceIds: ['src_reuters_01'],
      blocks: [
        {
          id: 'blk_climate_sum',
          blockType: 'summary',
          sortOrder: 0,
          data: {
            headline: 'Grid Transformation Milestones',
            bulletPoints: [
              'Commercial deployment of ceramic solid electrolyte cells operating at 99.4% round-trip efficiency.',
              'Total grid-scale battery storage capacity crosses the 500 Gigawatt-hour threshold across three continents.',
              'Sub-cycle frequency response times of 8 milliseconds eliminate need for peaking gas turbine reserves.',
            ],
          },
        },
        {
          id: 'blk_climate_p1',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: 'BRUSSELS & HYDERABAD — In a milestone that energy ministers described as a turning point for global decarbonization, national transmission operators across Europe, South Asia, and Oceania verified the synchronized commissioning of solid-state ceramic electrolyte battery installations totaling 500 gigawatt-hours of grid-scale storage capacity. The installations provide instantaneous frequency stabilization services previously dependent on fossil-fuel peaking gas turbines, eliminating an estimated 42 million tonnes of annual CO₂ emissions from grid-balancing operations alone.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_climate_h1',
          blockType: 'heading',
          sortOrder: 2,
          data: { text: 'Solid-State Electrolyte Technology and Safety Advantages', level: 2 },
        },
        {
          id: 'blk_climate_p2',
          blockType: 'paragraph',
          sortOrder: 3,
          data: {
            text: 'Unlike conventional lithium-ion batteries that rely on flammable liquid organic electrolytes, the new grid storage cells employ a garnet-type ceramic solid electrolyte membrane that conducts lithium ions through a rigid crystal lattice. This architecture eliminates the risk of thermal runaway—the catastrophic chain-reaction failure mode that has caused warehouse fires and necessitated costly containment infrastructure. The solid-state cells operate safely at ambient temperatures up to 85°C without active cooling, dramatically reducing auxiliary energy consumption and maintenance costs.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_climate_chart',
          blockType: 'chart',
          sortOrder: 4,
          data: {
            chartType: 'donut',
            title: '2026 Global Grid Storage Technology Share',
            xAxis: { key: 'technology', label: 'Storage Technology', type: 'category' },
            yAxis: { label: 'Market Share (%)' },
            series: [{ name: 'Installed Share', key: 'share', color: '#10b981' }],
            values: [
              { technology: 'Solid-State Ceramic', share: 44 },
              { technology: 'Lithium-Iron-Phosphate (LFP)', share: 36 },
              { technology: 'Sodium-Ion', share: 14 },
              { technology: 'Flow Batteries', share: 6 },
            ],
            sourceAttribution: 'International Energy Agency 2026',
          },
        },
        {
          id: 'blk_climate_h2',
          blockType: 'heading',
          sortOrder: 5,
          data: { text: 'Economic Impact and Regulatory Fast-Tracking', level: 2 },
        },
        {
          id: 'blk_climate_p3',
          blockType: 'paragraph',
          sortOrder: 6,
          data: {
            text: 'The deployment was accelerated by regulatory fast-tracking mechanisms ratified at COP31, which established streamlined permitting corridors for non-flammable storage technologies. Levelized cost of storage for the ceramic installations has fallen to $38 per megawatt-hour—below the operating cost of existing natural gas peaker plants in most wholesale electricity markets. Utilities report that the sub-cycle 8-millisecond response time of solid-state systems provides superior frequency regulation compared to the 200-millisecond response typical of conventional battery chemistries.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_climate_callout',
          blockType: 'callout',
          sortOrder: 7,
          data: {
            style: 'info',
            title: 'Grid Balancing Impact',
            text: 'Sub-cycle response times allow solid-state systems to damp transient frequency sags within 8 milliseconds of line trip events, preventing cascading blackout propagation across interconnected regional grids.',
          },
        },
        {
          id: 'blk_climate_p4',
          blockType: 'paragraph',
          sortOrder: 8,
          data: {
            text: 'Industry analysts project that solid-state grid storage will reach 1.5 terawatt-hours of total installed capacity by 2029, supported by expanding manufacturing facilities in Germany, India, and Australia. The European Battery Alliance confirmed that three new gigafactory construction projects, representing €4.2 billion in combined investment, will begin site preparation in Q1 2027.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_climate_image_diff',
          blockType: 'image_diff',
          sortOrder: 9,
          data: {
            beforeUrl:
              'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
            afterUrl:
              'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
            beforeLabel: 'Legacy Gas Peaker Plant Grid',
            afterLabel: 'Solid-State Storage Array Installation',
            caption:
              'Before and after: Traditional fossil-fuel peaking infrastructure replaced by modular ceramic solid-state battery arrays.',
            orientation: 'horizontal',
            defaultSplitPercent: 50,
            credit: 'International Energy Agency / European Battery Alliance',
          },
        },
      ],
    },
    versions: [
      {
        id: 'ver_climate_v1',
        storyId: 'sty_climate_01',
        versionNumber: 1,
        title: 'Global Energy Grid Connects First 500 GWh of Solid-State Storage',
        summary:
          'Non-flammable solid electrolyte batteries overcome thermal runaways, enabling 24/7 baseload renewable integration across three continents.',
        changeSummary: 'First publication of 500GWh grid integration.',
        blocks: [],
        authorId: 'usr_journalist_amara',
        clientType: 'human_web',
        createdAt: '2026-10-01T15:00:00Z',
      },
    ],
  },

  // Story 9: Biotech & Genomics (Paragraph, WhatChanged Diff, Document Viewer)
  {
    story: {
      id: 'sty_health_01',
      organizationId: 'org_default',
      slug: 'pan-coronavirus-mrna-therapeutic-passes-phase3',
      title: 'Pan-Coronavirus mRNA Therapeutic Demonstrates 94% Efficacy in Global Phase 3 Trial',
      summary:
        'Universal synthetic antigen targets conserved viral stem proteins, offering broad neutralization against present and emerging respiratory lineages.',
      status: 'PUBLISHED',
      articleType: 'science',
      authorId: 'usr_spark_agent',
      createdByClient: 'gemini_spark',
      createdVia: 'mcp',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-02T05:00:00Z',
      createdAt: '2026-10-02T03:00:00Z',
      updatedAt: '2026-10-02T05:00:00Z',
      topicIds: ['top_biotech_crispr'],
      entityIds: ['ent_who'],
      sourceIds: ['src_who_01'],
      blocks: [
        {
          id: 'blk_health_sum',
          blockType: 'summary',
          sortOrder: 0,
          data: {
            headline: 'Phase 3 Trial Results: Universal Coronavirus Therapeutic',
            bulletPoints: [
              '94.2% efficacy against all documented SARS-CoV-2 lineages including synthetic challenge variants.',
              'Zero serious adverse events across 48,000 participants spanning 31 countries and 6 demographic cohorts.',
              'Neutralizing antibody titers remained stable at 180 days post-administration without booster requirement.',
            ],
          },
        },
        {
          id: 'blk_health_p1',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: "GENEVA — The World Health Organization's Strategic Advisory Group on Immunization released comprehensive results from the largest multinational Phase 3 clinical trial of a pan-coronavirus mRNA therapeutic, demonstrating 94.2% efficacy against all documented respiratory viral lineages with zero serious adverse events across 48,000 participants in 31 countries. The computationally designed synthetic antigen targets conserved stem-helix proteins shared across the entire coronavirus family, offering unprecedented breadth of neutralization.",
            format: 'markdown',
          },
        },
        {
          id: 'blk_health_what_changed',
          blockType: 'what_changed',
          sortOrder: 2,
          data: {
            previousVersionNumber: 1,
            updatedAt: '2026-10-02T05:00:00Z',
            items: [
              {
                changeType: 'added',
                description:
                  'Included peer-reviewed multinational Phase 3 demographic breakdown across 6 age cohorts.',
              },
              {
                changeType: 'updated',
                description:
                  'Refined neutralizing antibody geometric mean titer figures with 180-day longitudinal data.',
              },
              {
                changeType: 'added',
                description:
                  'Added comparative efficacy chart against existing variant-specific boosters.',
              },
            ],
          },
        },
        {
          id: 'blk_health_h1',
          blockType: 'heading',
          sortOrder: 3,
          data: { text: 'Synthetic Antigen Design and Broad Neutralization', level: 2 },
        },
        {
          id: 'blk_health_p2',
          blockType: 'paragraph',
          sortOrder: 4,
          data: {
            text: "The therapeutic leverages a computationally optimized mRNA sequence encoding a chimeric antigen that fuses conserved epitope regions from four distinct coronavirus subgenera. Unlike conventional variant-chasing vaccines that must be reformulated every six months, the universal construct targets the structurally invariant stem-helix domain of the spike protein's S2 subunit—a region so critical to viral membrane fusion that mutational escape would likely render the virus non-functional.",
            format: 'markdown',
          },
        },
        {
          id: 'blk_health_chart',
          blockType: 'chart',
          sortOrder: 5,
          data: {
            chartType: 'bar',
            title: 'Efficacy Comparison: Universal vs. Variant-Specific Therapeutics',
            xAxis: { key: 'variant', label: 'Viral Lineage', type: 'category' },
            yAxis: { label: 'Efficacy (%)' },
            series: [
              { name: 'Universal Pan-CoV', key: 'universal', color: '#10b981' },
              { name: 'Variant-Specific XBB.4', key: 'specific', color: '#6366f1' },
            ],
            values: [
              { variant: 'BA.2.86', universal: 94.8, specific: 89.2 },
              { variant: 'XBB.1.16', universal: 93.6, specific: 94.1 },
              { variant: 'JN.1.4', universal: 94.1, specific: 72.4 },
              { variant: 'Synthetic Challenge', universal: 91.8, specific: 31.2 },
            ],
            sourceAttribution: 'WHO Phase 3 Statistical Dossier (CT-2026-9)',
          },
        },
        {
          id: 'blk_health_h2',
          blockType: 'heading',
          sortOrder: 6,
          data: { text: 'Regulatory Pathway and Global Access', level: 2 },
        },
        {
          id: 'blk_health_p3',
          blockType: 'paragraph',
          sortOrder: 7,
          data: {
            text: "Regulatory authorities in Europe, India, and Japan have granted accelerated review designation based on the Phase 3 data, with emergency use authorization decisions expected within 90 days. The WHO's COVAX Facility has secured advance purchase commitments for 2.4 billion doses at tiered pricing, ensuring equitable access for low- and middle-income countries. Manufacturing partners across six continents have validated the production process using standardized lipid nanoparticle formulations.",
            format: 'markdown',
          },
        },
        {
          id: 'blk_health_p4',
          blockType: 'paragraph',
          sortOrder: 8,
          data: {
            text: 'Immunologists noted that the 180-day durability of neutralizing antibody titers without booster requirement represents a significant advantage over existing seasonal vaccination schedules. Long-term follow-up studies extending to 24 months are continuing at 140 clinical sites, with interim 12-month data expected in Q2 2027.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_health_doc',
          blockType: 'document_viewer',
          sortOrder: 9,
          data: {
            documentUrl: 'https://news.platform/docs/clinical/phase3-pan-coronavirus-results.pdf',
            title: 'Phase 3 Multicenter Randomized Clinical Evaluation Protocol (WHO-CT-2026-9)',
            pageCount: 68,
            documentType: 'regulatory_directive',
            description:
              'Primary statistical dossier filed with global pharmaceutical regulators covering efficacy, safety, and immunogenicity endpoints.',
            highlights: [
              {
                page: 12,
                excerpt:
                  'Neutralizing antibody titers against conserved epitope regions remained steady at 180 days post-administration across all demographic cohorts.',
                note: 'Primary endpoint verification',
              },
              {
                page: 34,
                excerpt:
                  'Synthetic challenge variant generated via directed evolution showed 91.8% neutralization, confirming breadth of cross-reactivity.',
                note: 'Variant escape resistance',
              },
            ],
            sourceAttribution: 'World Health Organization Strategic Committee',
          },
        },
      ],
    },
    versions: [
      {
        id: 'ver_health_v1',
        storyId: 'sty_health_01',
        versionNumber: 1,
        title: 'Pan-Coronavirus mRNA Therapeutic Demonstrates 94% Efficacy in Global Phase 3 Trial',
        summary:
          'Universal synthetic antigen targets conserved viral stem proteins, offering broad neutralization against present and emerging respiratory lineages.',
        changeSummary: 'Release of Phase 3 findings.',
        blocks: [],
        authorId: 'usr_spark_agent',
        clientType: 'gemini_spark',
        createdAt: '2026-10-02T05:00:00Z',
      },
    ],
  },

  // Story 10: Cybersecurity Zero-Day Defense (Paragraph, Timeline, Callout)
  {
    story: {
      id: 'sty_cyber_01',
      organizationId: 'org_default',
      slug: 'coordinated-zero-day-patch-deployed-across-power-grids',
      title: 'Coordinated Defensive Patch Deployed Across Global Power Grid Protocols',
      summary:
        'Cybersecurity agencies and utility alliances deploy automated mitigation preventing unauthorized packet injections into high-voltage telemetry relays.',
      status: 'PUBLISHED',
      articleType: 'investigation',
      authorId: 'usr_journalist_david',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-02T08:00:00Z',
      createdAt: '2026-10-02T06:00:00Z',
      updatedAt: '2026-10-02T08:00:00Z',
      topicIds: ['top_cybersecurity', 'top_ai_agents'],
      entityIds: ['ent_usa', 'ent_eu'],
      sourceIds: ['src_us_cert_01'],
      blocks: [
        {
          id: 'blk_cyber_sum',
          blockType: 'summary',
          sortOrder: 0,
          data: {
            headline: 'Coordinated Vulnerability Remediation: Situation Report',
            bulletPoints: [
              'Undisclosed route spoofing vulnerability in legacy ICS protocol allowed unauthorized packet injection into high-voltage telemetry relays.',
              'AI-synthesized cryptographic firmware patch formally verified and deployed within 72 hours across 12 regional grid operators.',
              'Zero exploitation confirmed prior to global patch deployment; all tier-1 transmission relays secured.',
            ],
          },
        },
        {
          id: 'blk_cyber_p1',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: 'WASHINGTON — In what cybersecurity officials are describing as the most significant coordinated defensive operation in critical infrastructure history, a multinational coalition of government cybersecurity agencies and utility alliance operators successfully deployed cryptographic firmware patches to industrial control systems across twelve regional electrical grids, closing an undocumented route advertisement spoofing vulnerability before any confirmed exploitation occurred.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_cyber_h1',
          blockType: 'heading',
          sortOrder: 2,
          data: { text: 'Vulnerability Discovery and AI-Assisted Patch Synthesis', level: 2 },
        },
        {
          id: 'blk_cyber_p2',
          blockType: 'paragraph',
          sortOrder: 3,
          data: {
            text: "The vulnerability, discovered through an anonymous whistleblower submission to US-CERT's critical infrastructure tipline, resided in a legacy border gateway protocol implementation used by supervisory control and data acquisition (SCADA) systems to manage high-voltage transmission relay switching. An attacker exploiting the flaw could inject spoofed route advertisements, potentially redirecting telemetry data streams and causing cascading relay trip sequences across interconnected grid segments.",
            format: 'markdown',
          },
        },
        {
          id: 'blk_cyber_timeline',
          blockType: 'timeline',
          sortOrder: 4,
          data: {
            title: 'Coordinated Vulnerability Remediation Chronology',
            items: [
              {
                date: 'T-72 Hours',
                headline: 'Vulnerability Discovered via Whistleblower Tipline',
                body: 'US-CERT confirmed cryptographic vulnerability in legacy substation route advertisement protocol stack affecting IEC 61850 implementations.',
              },
              {
                date: 'T-48 Hours',
                headline: 'International Coordination Activated',
                body: 'CISA, ENISA, and CERT-In established joint operations room with real-time threat intelligence sharing across 12 grid operators.',
              },
              {
                date: 'T-24 Hours',
                headline: 'AI Agent Patch Synthesis & Formal Verification',
                body: 'Autonomous agent teams synthesized cryptographic firmware patch and completed SMT-solver formal proof of non-disruptive hot-patch compatibility.',
              },
              {
                date: 'T-0 Hours',
                headline: 'Global Air-Gapped Key Rollout Complete',
                body: 'All tier-1 high-voltage transmission relays updated with authenticated cryptographic firmware via physically isolated deployment channels.',
              },
            ],
          },
        },
        {
          id: 'blk_cyber_diagram',
          blockType: 'diagram',
          sortOrder: 5,
          data: {
            title: 'Attack Vector & Mitigation Architecture',
            format: 'mermaid',
            definition:
              'flowchart LR\n  A[Spoofed Route] -->|Injection Attempt| B[SCADA Border Router]\n  B -->|Pre-Patch| C[Telemetry Intercept]\n  B -->|Post-Patch| D[RPKI Origin Validation]\n  D -->|Verified Origin| E[Authenticated Relay]',
            caption: 'SCADA route injection mitigation via automated RPKI validation.',
          },
        },
        {
          id: 'blk_cyber_h2',
          blockType: 'heading',
          sortOrder: 6,
          data: { text: 'Post-Incident Analysis and Regulatory Directives', level: 2 },
        },
        {
          id: 'blk_cyber_p3',
          blockType: 'paragraph',
          sortOrder: 7,
          data: {
            text: 'Post-deployment forensic analysis confirmed that no exploitation of the vulnerability occurred in the wild prior to the coordinated patch rollout. However, threat intelligence analysts noted that the vulnerability had been present in the affected protocol implementations for an estimated 18 months, underscoring the urgent need for continuous automated vulnerability scanning of legacy industrial control system firmware.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_cyber_callout',
          blockType: 'callout',
          sortOrder: 8,
          data: {
            style: 'warning',
            title: 'Security Operator Notice',
            text: 'Legacy supervisory systems utilizing unauthenticated border gateway protocol routing must enforce mandatory RPKI origin validation immediately. All IEC 61850 implementations should verify firmware integrity against US-CERT Advisory ICS-CERT-2026-275.',
          },
        },
        {
          id: 'blk_cyber_p4',
          blockType: 'paragraph',
          sortOrder: 9,
          data: {
            text: 'Regulatory bodies in the United States and European Union have issued emergency directives requiring all critical infrastructure operators to complete RPKI migration within 180 days. The successful coordination between AI-assisted patch synthesis and traditional air-gapped deployment channels has been cited as a model for future critical infrastructure defense operations.',
            format: 'markdown',
          },
        },
      ],
    },
    versions: [
      {
        id: 'ver_cyber_v1',
        storyId: 'sty_cyber_01',
        versionNumber: 1,
        title: 'Coordinated Defensive Patch Deployed Across Global Power Grid Protocols',
        summary:
          'Cybersecurity agencies and utility alliances deploy automated mitigation preventing unauthorized packet injections into high-voltage telemetry relays.',
        changeSummary: 'Immediate security advisory.',
        blocks: [],
        authorId: 'usr_journalist_david',
        clientType: 'human_web',
        createdAt: '2026-10-02T08:00:00Z',
      },
    ],
  },

  // Story 11: Culture & Synthetic Cinema (Paragraph, Quote, Poll)
  {
    story: {
      id: 'sty_culture_01',
      organizationId: 'org_default',
      slug: 'venice-biennale-spotlights-fully-synthetic-feature-films',
      title: 'Venice Biennale Awards Jury Prize to Fully Neural Synthetic Feature Film',
      summary:
        'Cinematic critics celebrate groundbreaking emotional depth and lighting physics in entirely generated digital narrative, igniting global festival debates.',
      status: 'PUBLISHED',
      articleType: 'culture',
      authorId: 'usr_editor',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-02T09:00:00Z',
      createdAt: '2026-10-02T07:30:00Z',
      updatedAt: '2026-10-02T09:00:00Z',
      topicIds: ['top_culture_cinema'],
      entityIds: ['ent_eu'],
      sourceIds: ['src_ap_01'],
      blocks: [
        {
          id: 'blk_culture_sum',
          blockType: 'summary',
          sortOrder: 0,
          data: {
            headline: 'Venice Biennale: Synthetic Cinema Milestone',
            bulletPoints: [
              'First fully AI-generated feature film receives official jury commendation at a tier-one international film festival.',
              'Neural volume rendering achieves physically accurate subsurface scattering, motion blur, and atmospheric volumetrics indistinguishable from physical cinematography.',
              'Global festival circuit debates eligibility rules as industry guilds prepare position statements on AI creative works.',
            ],
          },
        },
        {
          id: 'blk_culture_p1',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: 'VENICE — In a defining moment for international filmmaking that will likely reshape creative industry regulations for decades, the 83rd Venice International Film Festival awarded a special jury commendation to "Meridian," a 94-minute feature-length dramatic narrative generated entirely through neural volume rendering without a single frame captured by a physical camera. The production, which took 14 months of iterative prompt engineering and aesthetic refinement, tells the story of three generations of a family navigating displacement across Mediterranean borders.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_culture_h1',
          blockType: 'heading',
          sortOrder: 2,
          data: { text: 'Technical Achievement: Neural Volume Rendering', level: 2 },
        },
        {
          id: 'blk_culture_p2',
          blockType: 'paragraph',
          sortOrder: 3,
          data: {
            text: 'Cinematic reviewers noted that the visual fidelity surpassed previous AI-generated short films by an order of magnitude. The rendering pipeline achieved physically accurate subsurface scattering on skin, photorealistic motion blur at variable frame rates, and atmospheric volumetric fog effects that maintained temporal coherence across extended tracking shots. The system maintained consistent character identity and emotional micro-expressions across the full runtime—a technical feat that had eluded earlier diffusion-based video models.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_culture_image',
          blockType: 'image',
          sortOrder: 4,
          data: {
            url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
            altText: 'Neural volume rendering still from award-winning feature film Meridian',
            caption:
              'A scene from the jury-commended synthetic feature "Meridian" exhibiting physically accurate subsurface volumetric scattering and atmospheric depth-of-field effects.',
            credit: 'La Biennale di Venezia / Synthetic Cinema Archives',
            aspectRatio: '16:9',
          },
        },
        {
          id: 'blk_culture_quote',
          blockType: 'quote',
          sortOrder: 5,
          data: {
            quote:
              'We did not judge the pixels or the computation; we judged the ache in the human story it told. The emotional architecture of this film demanded recognition regardless of its production methodology.',
            attribution: 'Alberto Barbera',
            title: 'Artistic Director, Venice International Film Festival',
          },
        },
        {
          id: 'blk_culture_h2',
          blockType: 'heading',
          sortOrder: 6,
          data: { text: 'Industry Reaction and Awards Eligibility Debates', level: 2 },
        },
        {
          id: 'blk_culture_p3',
          blockType: 'paragraph',
          sortOrder: 7,
          data: {
            text: 'The commendation has ignited fierce debate across the global festival circuit. The Directors Guild of America issued a preliminary statement emphasizing the distinction between "tool-assisted filmmaking" and "fully autonomous generation," while the European Film Academy convened an emergency working group to draft eligibility guidelines before the 2027 festival season. Independent filmmakers expressed concern that AI-generated content could flood submission pipelines, while technology advocates argued that excluding synthetic cinema would stifle the most significant creative medium evolution since digital photography replaced celluloid.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_culture_poll',
          blockType: 'poll',
          sortOrder: 8,
          data: {
            pollId: 'poll_culture_synthetic_cinema',
            question:
              'Should fully synthetic AI films be eligible to compete for major film academy awards alongside human-shot cinema?',
            options: [
              {
                id: 'opt_c1',
                text: 'Yes, evaluate based on creative merit and narrative impact',
                voteCount: 680,
              },
              {
                id: 'opt_c2',
                text: 'Create a dedicated standalone category for synthetic cinema',
                voteCount: 1420,
              },
              {
                id: 'opt_c3',
                text: 'No, traditional awards must be reserved for physical production',
                voteCount: 890,
              },
            ],
            totalVotes: 2990,
            closed: false,
          },
        },
        {
          id: 'blk_culture_p4',
          blockType: 'paragraph',
          sortOrder: 9,
          data: {
            text: 'The creative team behind "Meridian" emphasized that the production employed a human director, writers, and sound designers throughout, with the AI systems serving as the visual rendering pipeline rather than the narrative architect. They announced plans to release the full prompt engineering methodology as an open-source framework, enabling independent creators worldwide to produce feature-quality visual narratives without traditional studio budgets.',
            format: 'markdown',
          },
        },
      ],
    },
    versions: [
      {
        id: 'ver_culture_v1',
        storyId: 'sty_culture_01',
        versionNumber: 1,
        title: 'Venice Biennale Awards Jury Prize to Fully Neural Synthetic Feature Film',
        summary:
          'Cinematic critics celebrate groundbreaking emotional depth and lighting physics in entirely generated digital narrative, igniting global festival debates.',
        changeSummary: 'Awards dispatch publication.',
        blocks: [],
        authorId: 'usr_editor',
        clientType: 'human_web',
        createdAt: '2026-10-02T09:00:00Z',
      },
    ],
  },

  // Story 12: Live Tracking Liveblog (Starship Flight 7 Orbital Flight Test)
  {
    story: {
      id: 'sty_liveblog_starship',
      organizationId: 'org_default',
      slug: 'live-starship-flight-7-orbital-test-tracking',
      title: 'LIVE: Starship Flight 7 Orbital Flight Test & Booster Recovery',
      summary:
        'Real-time live telemetry tracking, stage separation markers, and orbital propellant transfer demonstrations.',
      status: 'PUBLISHED',
      articleType: 'liveblog',
      authorId: 'usr_spark_agent',
      createdByClient: 'gemini_spark',
      createdVia: 'mcp',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1517976487502-5f79b47e2c90?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-02T10:00:00Z',
      createdAt: '2026-10-02T08:00:00Z',
      updatedAt: '2026-10-02T10:30:00Z',
      topicIds: ['top_space_exploration'],
      entityIds: ['ent_usa'],
      sourceIds: ['src_reuters_01'],
      blocks: [
        {
          id: 'blk_starship_lead',
          blockType: 'paragraph',
          sortOrder: 0,
          data: {
            text: 'STARBASE, TEXAS — Teams are tracking the terminal countdown for Starship Flight 7. Follow this live dispatch feed for minute-by-minute trajectory confirmations.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_starship_ticker',
          blockType: 'live_ticker',
          sortOrder: 1,
          data: {
            title: 'Flight 7 Telemetry Monitor',
            refreshIntervalSeconds: 10,
            items: [
              {
                symbol: 'ALT',
                label: 'Orbital Altitude',
                value: 182.4,
                delta: 0.8,
                unit: 'km',
                sparkline: [45, 90, 130, 160, 175, 182.4],
              },
              {
                symbol: 'VEL',
                label: 'Velocity',
                value: 27140,
                delta: 120,
                unit: 'km/h',
                sparkline: [8000, 15000, 21000, 25500, 27140],
              },
              {
                symbol: 'P-CH',
                label: 'Raptor Chamber Pressure',
                value: 348.5,
                delta: -1.2,
                unit: 'bar',
                sparkline: [340, 345, 350, 349, 348.5],
              },
            ],
          },
        },
        {
          id: 'blk_starship_video',
          blockType: 'video',
          sortOrder: 2,
          data: {
            url: '/videos/starship-downlink.mp4',
            posterUrl:
              'https://images.unsplash.com/photo-1517976487502-5f79b47e2c90?auto=format&fit=crop&w=1600&q=80',
            aspectRatio: '16:9',
            caption:
              'Live downlink footage: Super Heavy booster separation and catch maneuver telemetry.',
            durationSeconds: 195,
            transcription:
              'Flight Director: All 33 Raptor engines nominal during stage separation. Booster hot staging verified at T+2 minutes 42 seconds.',
          },
        },
      ],
    },
    versions: [
      {
        id: 'ver_starship_v1',
        storyId: 'sty_liveblog_starship',
        versionNumber: 1,
        title: 'LIVE: Starship Flight 7 Orbital Flight Test & Booster Recovery',
        summary:
          'Real-time live telemetry tracking, stage separation markers, and orbital propellant transfer demonstrations.',
        changeSummary: 'Live tracking initiated.',
        blocks: [],
        authorId: 'usr_spark_agent',
        clientType: 'gemini_spark',
        createdAt: '2026-10-02T10:00:00Z',
      },
    ],
  },

  // Story 13: Picks For You — Humanoid Robotics (Summary, Lead, Quote, Chart)
  {
    story: {
      id: 'sty_pick_robotics_01',
      organizationId: 'org_default',
      slug: 'humanoid-robotics-factory-floor-deployment-automotive',
      title: 'Humanoid Robotics Accelerate 24/7 Factory Floor Deployment in Automotive Assembly',
      summary:
        'Autonomous bipedal robots achieve 99.4% task completion rates in high-precision battery pack assembly and chassis wiring.',
      status: 'PUBLISHED',
      articleType: 'technology',
      authorId: 'usr_spark_agent',
      createdByClient: 'gemini_spark',
      createdVia: 'mcp',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-02T11:00:00Z',
      createdAt: '2026-10-02T09:00:00Z',
      updatedAt: '2026-10-02T11:00:00Z',
      topicIds: ['top_ai_agents', 'top_semiconductors'],
      entityIds: ['ent_demis_hassabis', 'ent_jensen_huang'],
      sourceIds: ['src_techcrunch_01', 'src_mit_tech_01'],
      blocks: [
        {
          id: 'blk_robotics_sum',
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
          id: 'blk_robotics_lead',
          blockType: 'paragraph',
          sortOrder: 1,
          data: {
            text: 'STUTTGART/DETROIT — Commercial automotive manufacturing reached an autonomous inflection point as bipedal humanoid robots took over continuous battery module wiring across two high-volume assembly lines, operating without human intervention.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_robotics_quote',
          blockType: 'quote',
          sortOrder: 2,
          data: {
            quote:
              'Tactile reinforcement learning has closed the dexterity gap. Humanoid units are no longer laboratory curiosities; they are core capital equipment.',
            attribution: 'Dr. Clara Lindqvist',
            title: 'VP of Manufacturing Automation',
          },
        },
        {
          id: 'blk_robotics_comparison',
          blockType: 'comparison',
          sortOrder: 3,
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
          id: 'blk_robotics_h1',
          blockType: 'heading',
          sortOrder: 4,
          data: { text: 'Labor Economics and Workforce Transition', level: 2 },
        },
        {
          id: 'blk_robotics_p2',
          blockType: 'paragraph',
          sortOrder: 5,
          data: {
            text: 'The economic implications extend beyond factory floor efficiency. Industrial labor economists estimate that each humanoid unit deployed at current capability levels displaces approximately 2.8 full-time equivalent manual assembly positions while creating 1.4 new roles in robotics supervision, maintenance programming, and human-robot coordination. Automotive unions have negotiated redeployment agreements ensuring displaced workers receive priority access to certified robotics technician training programs.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_robotics_p3',
          blockType: 'paragraph',
          sortOrder: 6,
          data: {
            text: 'Capital expenditure analysis shows that the total cost of ownership for a humanoid assembly unit achieves breakeven against manual labor costs within 14 months at current wage rates. The units operate continuously through three shifts without fatigue-related quality degradation, maintaining consistent sub-millimeter precision that human operators typically achieve only during the first four hours of a shift cycle.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_robotics_stat',
          blockType: 'statistic',
          sortOrder: 7,
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
    versions: [
      {
        id: 'ver_robotics_v1',
        storyId: 'sty_pick_robotics_01',
        versionNumber: 1,
        title: 'Humanoid Robotics Accelerate 24/7 Factory Floor Deployment in Automotive Assembly',
        summary:
          'Autonomous bipedal robots achieve 99.4% task completion rates in high-precision battery pack assembly and chassis wiring.',
        changeSummary: 'Initial publication.',
        blocks: [],
        authorId: 'usr_spark_agent',
        clientType: 'gemini_spark',
        createdAt: '2026-10-02T11:00:00Z',
      },
    ],
  },

  // Story 14: Picks For You — Neuromorphic Silicon (Summary, Lead, Flow, Image)
  {
    story: {
      id: 'sty_pick_neuromorphic_01',
      organizationId: 'org_default',
      slug: 'neuromorphic-ai-chips-edge-inference-power-cut',
      title: 'Neuromorphic AI Chips Cut Edge Inference Power by 90% in Drone and Satellite Tests',
      summary:
        'Event-based spiking neural network silicon delivers sub-watt real-time computer vision without thermal throttling in extreme environments.',
      status: 'PUBLISHED',
      articleType: 'technology',
      authorId: 'usr_chatgpt_agent',
      createdByClient: 'chatgpt',
      createdVia: 'mcp',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-02T11:15:00Z',
      createdAt: '2026-10-02T09:30:00Z',
      updatedAt: '2026-10-02T11:15:00Z',
      topicIds: ['top_semiconductors', 'top_ai_agents'],
      entityIds: ['ent_demis_hassabis'],
      sourceIds: ['src_nature_01', 'src_techcrunch_01'],
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
          id: 'blk_neuro_lead',
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
          id: 'blk_neuro_h1',
          blockType: 'heading',
          sortOrder: 3,
          data: { text: 'Military and Space Applications', level: 2 },
        },
        {
          id: 'blk_neuro_p2',
          blockType: 'paragraph',
          sortOrder: 4,
          data: {
            text: "Defense procurement agencies have expressed immediate interest in neuromorphic inference accelerators for autonomous drone swarms operating in GPS-denied environments. The chips' ability to process visual odometry and obstacle avoidance at sub-watt power levels eliminates the need for bulky battery packs that constrain flight endurance. Satellite operators report that orbital deployment of neuromorphic vision modules reduced onboard computing power requirements by 87%, freeing electrical budget for enhanced communications payloads.",
            format: 'markdown',
          },
        },
        {
          id: 'blk_neuro_p3',
          blockType: 'paragraph',
          sortOrder: 5,
          data: {
            text: 'Commercial applications are equally promising. Agricultural drone companies plan to integrate the chips for real-time crop disease detection across thousand-hectare fields, while autonomous vehicle manufacturers are evaluating neuromorphic co-processors to handle rain and fog perception scenarios that overwhelm conventional convolutional neural network accelerators.',
            format: 'markdown',
          },
        },
        {
          id: 'blk_neuro_image',
          blockType: 'image',
          sortOrder: 6,
          data: {
            url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
            altText: 'Micrograph of Neuromorphic Silicon Die',
            caption:
              'Electron microscope scan of the event-based spiking neural network silicon core showing synaptic crossbar arrays and memristive interconnect topology.',
            credit: 'ETH Zurich & Fraunhofer Institute',
            aspectRatio: '16:9',
          },
        },
      ],
    },
    versions: [
      {
        id: 'ver_neuro_v1',
        storyId: 'sty_pick_neuromorphic_01',
        versionNumber: 1,
        title: 'Neuromorphic AI Chips Cut Edge Inference Power by 90% in Drone and Satellite Tests',
        summary:
          'Event-based spiking neural network silicon delivers sub-watt real-time computer vision without thermal throttling in extreme environments.',
        changeSummary: 'Initial publication.',
        blocks: [],
        authorId: 'usr_chatgpt_agent',
        clientType: 'chatgpt',
        createdAt: '2026-10-02T11:15:00Z',
      },
    ],
  },

  // Story 15: Picks For You — CRISPR Clinical Milestone (Summary, Lead, Slide Deck)
  {
    story: {
      id: 'sty_pick_crispr_01',
      organizationId: 'org_default',
      slug: 'in-vivo-crispr-gene-therapy-cardiomyopathy-trial',
      title:
        'Targeted In-Vivo CRISPR Therapy Reverses Rare Hereditary Cardiomyopathy in Clinical Trials',
      summary:
        'Phase 3 clinical trial demonstrates 94% restoration of cardiac muscle protein expression without off-target double-strand breaks.',
      status: 'PUBLISHED',
      articleType: 'science',
      authorId: 'usr_journalist_amara',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-02T11:30:00Z',
      createdAt: '2026-10-02T10:00:00Z',
      updatedAt: '2026-10-02T11:30:00Z',
      topicIds: ['top_biotechnology', 'top_healthcare'],
      entityIds: ['ent_who'],
      sourceIds: ['src_nature_01'],
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
          id: 'blk_crispr_lead',
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
    versions: [
      {
        id: 'ver_crispr_v1',
        storyId: 'sty_pick_crispr_01',
        versionNumber: 1,
        title:
          'Targeted In-Vivo CRISPR Therapy Reverses Rare Hereditary Cardiomyopathy in Clinical Trials',
        summary:
          'Phase 3 clinical trial demonstrates 94% restoration of cardiac muscle protein expression without off-target double-strand breaks.',
        changeSummary: 'Initial clinical dispatch.',
        blocks: [],
        authorId: 'usr_journalist_amara',
        clientType: 'human_web',
        createdAt: '2026-10-02T11:30:00Z',
      },
    ],
  },

  // Story 16: Picks For You — Lunar Water-Ice Prospecting (Summary, Lead, Gallery)
  {
    story: {
      id: 'sty_pick_space_mining_01',
      organizationId: 'org_default',
      slug: 'lunar-prospector-detects-water-ice-shackleton-rim',
      title:
        'Commercial Lunar Prospector Detects Massive Volatile Water-Ice Deposits at Shackleton Rim',
      summary:
        'Neutron spectrometer radar mapping confirms over 600 million metric tons of extractable water-ice reserves in permanently shadowed craters.',
      status: 'PUBLISHED',
      articleType: 'science',
      authorId: 'usr_journalist_david',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-02T11:45:00Z',
      createdAt: '2026-10-02T10:15:00Z',
      updatedAt: '2026-10-02T11:45:00Z',
      topicIds: ['top_space_exploration'],
      entityIds: ['ent_isro'],
      sourceIds: ['src_reuters_01'],
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
          id: 'blk_lunar_lead',
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
    versions: [
      {
        id: 'ver_lunar_v1',
        storyId: 'sty_pick_space_mining_01',
        versionNumber: 1,
        title:
          'Commercial Lunar Prospector Detects Massive Volatile Water-Ice Deposits at Shackleton Rim',
        summary:
          'Neutron spectrometer radar mapping confirms over 600 million metric tons of extractable water-ice reserves in permanently shadowed craters.',
        changeSummary: 'Space exploration report.',
        blocks: [],
        authorId: 'usr_journalist_david',
        clientType: 'human_web',
        createdAt: '2026-10-02T11:45:00Z',
      },
    ],
  },

  // Story 17: Picks For You — Sodium-Ion Grid Megapacks (Summary, Lead, ImageDiff)
  {
    story: {
      id: 'sty_pick_grid_storage_01',
      organizationId: 'org_default',
      slug: 'sodium-ion-megapacks-surpass-lithium-grid-storage',
      title:
        'Next-Gen Sodium-Ion Megapacks Surpass Lithium in Long-Duration Grid Frequency Balancing',
      summary:
        'Utility operators deploy 1.2 GWh non-flammable sodium-ion storage system, reducing Levelized Cost of Storage to $42 per megawatt-hour.',
      status: 'PUBLISHED',
      articleType: 'science',
      authorId: 'usr_editor',
      createdByClient: 'human_web',
      createdVia: 'web',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-02T12:00:00Z',
      createdAt: '2026-10-02T10:30:00Z',
      updatedAt: '2026-10-02T12:00:00Z',
      topicIds: ['top_clean_energy', 'top_climate_transition'],
      entityIds: ['ent_iter'],
      sourceIds: ['src_bloomberg_01'],
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
          id: 'blk_grid_lead',
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
    versions: [
      {
        id: 'ver_grid_v1',
        storyId: 'sty_pick_grid_storage_01',
        versionNumber: 1,
        title:
          'Next-Gen Sodium-Ion Megapacks Surpass Lithium in Long-Duration Grid Frequency Balancing',
        summary:
          'Utility operators deploy 1.2 GWh non-flammable sodium-ion storage system, reducing Levelized Cost of Storage to $42 per megawatt-hour.',
        changeSummary: 'Energy storage dispatch.',
        blocks: [],
        authorId: 'usr_editor',
        clientType: 'human_web',
        createdAt: '2026-10-02T12:00:00Z',
      },
    ],
  },

  // Story 18: Picks For You — Quantum Key Distribution (Summary, Lead, Diagram)
  {
    story: {
      id: 'sty_pick_quantum_crypto_01',
      organizationId: 'org_default',
      slug: 'quantum-key-distribution-satellite-network-banking',
      title: 'Quantum Key Distribution Satellite Network Shields Cross-Border Banking Settlements',
      summary:
        'Entangled photon downlinks achieve 1.2 Mbps secret key exchange across 7,000 kilometers, establishing post-quantum banking security.',
      status: 'PUBLISHED',
      articleType: 'technology',
      authorId: 'usr_spark_agent',
      createdByClient: 'gemini_spark',
      createdVia: 'mcp',
      currentVersionNumber: 1,
      heroImageUrl:
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=80',
      publishedAt: '2026-10-02T12:15:00Z',
      createdAt: '2026-10-02T10:45:00Z',
      updatedAt: '2026-10-02T12:15:00Z',
      topicIds: ['top_quantum_computing', 'top_macroeconomics'],
      entityIds: ['ent_cern'],
      sourceIds: ['src_ft_01', 'src_nature_01'],
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
          id: 'blk_qkd_lead',
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
    versions: [
      {
        id: 'ver_qkd_v1',
        storyId: 'sty_pick_quantum_crypto_01',
        versionNumber: 1,
        title:
          'Quantum Key Distribution Satellite Network Shields Cross-Border Banking Settlements',
        summary:
          'Entangled photon downlinks achieve 1.2 Mbps secret key exchange across 7,000 kilometers, establishing post-quantum banking security.',
        changeSummary: 'Quantum network deployment.',
        blocks: [],
        authorId: 'usr_spark_agent',
        clientType: 'gemini_spark',
        createdAt: '2026-10-02T12:15:00Z',
      },
    ],
  },
];
