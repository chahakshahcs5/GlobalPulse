import type { Comment, FactCheckClaim } from '@ai-news/schemas';

export const commentsToSeed: Comment[] = [
  {
    id: 'cmt_brics_01',
    storyId: 'sty_brics_flagship',
    organizationId: 'org_default',
    authorId: 'usr_reader_aravind',
    authorName: 'Aravind Patel',
    authorRole: 'reader',
    content:
      'The operationalization of bilateral currency clearing accounts directly addresses the hedging overhead that has constrained South-South trade for decades. Excellent D3 chart visualization!',
    status: 'approved',
    likesCount: 38,
    createdAt: '2026-09-26T11:00:00Z',
    updatedAt: '2026-09-26T11:00:00Z',
  },
  {
    id: 'cmt_brics_02',
    storyId: 'sty_brics_flagship',
    organizationId: 'org_default',
    authorId: 'usr_journalist_david',
    authorName: 'David Chen',
    authorRole: 'journalist',
    content:
      'Key detail to watch in Q4 will be the automated liquidity swap triggers between member central banks when bilateral balances cross agreed reserve thresholds.',
    status: 'approved',
    likesCount: 22,
    createdAt: '2026-09-26T12:30:00Z',
    updatedAt: '2026-09-26T12:30:00Z',
  },
  {
    id: 'cmt_ai_01',
    storyId: 'sty_ai_01',
    organizationId: 'org_default',
    authorId: 'usr_reader_sarah',
    authorName: 'Sarah Jenkins',
    authorRole: 'subscriber',
    content:
      'Mathematical formal verification (SMT solving) is the only realistic bridge between generative coding agents and critical infrastructure deployment. Glad to see the whitepaper highlights included.',
    status: 'approved',
    likesCount: 54,
    createdAt: '2026-09-30T10:15:00Z',
    updatedAt: '2026-09-30T10:15:00Z',
  },
  {
    id: 'cmt_fusion_01',
    storyId: 'sty_fusion_01',
    organizationId: 'org_default',
    authorId: 'usr_journalist_amara',
    authorName: 'Amara Okafor',
    authorRole: 'journalist',
    content:
      '120 seconds of continuous plasma confinement proves that high-temperature superconducting magnets can overcome the heat dissipation barriers that hindered earlier stellarators.',
    status: 'approved',
    likesCount: 45,
    createdAt: '2026-09-28T09:00:00Z',
    updatedAt: '2026-09-28T09:00:00Z',
  },
];

export const baselineFactChecks: FactCheckClaim[] = [
  {
    id: 'fc_01',
    claim: 'Solar storms completely dismantled international undersea internet cables.',
    claimant: 'Viral Social Media Posts & Unverified Threads',
    rating: 'FALSE',
    summary:
      'Undersea fiber-optic cables operate via optical photon pulses entirely immune to geomagnetic fluctuations. Only terrestrial repeater power units experienced minor transient surges.',
    checker: 'GlobalPulse Verification Desk',
    sources: ['NOAA Space Weather Prediction Center', 'International Cable Protection Committee'],
    url: 'https://news.platform/fact-checks/fc_01',
    checkedAt: '2026-09-27T14:00:00Z',
  },
  {
    id: 'fc_02',
    claim: 'Central Banks quietly agreed to eliminate physical cash currencies by 2027.',
    claimant: 'Financial Blog Speculation & Unverified Newsletters',
    rating: 'FALSE',
    summary:
      'Central Bank Digital Currencies (CBDCs) are experimental sovereign supplements. Official multilateral frameworks explicitly mandate cash availability for financial inclusion.',
    checker: 'Reuters Fact Check & GlobalPulse Verification Desk',
    sources: ['Bank for International Settlements', 'Federal Reserve Board Policy Release'],
    url: 'https://news.platform/fact-checks/fc_02',
    checkedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'fc_03',
    claim: 'CERN set a new quantum entanglement record in particle collision density.',
    claimant: 'Physics Conference Dispatches & Science Journals',
    rating: 'TRUE',
    summary:
      'Peer-reviewed measurements at the Large Hadron Collider confirm unprecedented quantum correlation metrics at TeV energy scales.',
    checker: 'Science Verification Network',
    sources: ['Physical Review Letters', 'CERN Directorate'],
    url: 'https://news.platform/fact-checks/fc_03',
    checkedAt: '2026-09-28T16:00:00Z',
  },
  {
    id: 'fc_04',
    claim:
      'DeepMind AlphaFold enzyme breakdown completely dissolves marine microplastics in 48 hours.',
    claimant: 'Environmental Tech Forum Viral Clips',
    rating: 'MOSTLY_TRUE',
    summary:
      'Laboratory tests demonstrate accelerated polyethylene terephthalate (PET) ester bond hydrolysis within 48 hours; however, industrial scalable deployment in open oceanic salt water is still under phase 2 field trials.',
    checker: 'GlobalPulse Verification Desk',
    sources: ['Nature Catalysis', 'Google DeepMind BioSciences Lab'],
    url: 'https://news.platform/fact-checks/fc_04',
    checkedAt: '2026-09-29T11:00:00Z',
  },
  {
    id: 'fc_05',
    claim: 'Global atmospheric warming entered a multi-year pause period in 2026.',
    claimant: 'Pundit Commentary on Cable Broadcasts',
    rating: 'FALSE',
    summary:
      'Ocean heat content and surface atmospheric metrics recorded the three highest thermodynamic anomalies on record, with zero empirical evidence of a pause.',
    checker: 'World Meteorological Organization Verification Service',
    sources: ['Copernicus Climate Change Service', 'NOAA Climate Monitoring'],
    url: 'https://news.platform/fact-checks/fc_05',
    checkedAt: '2026-09-29T15:00:00Z',
  },
  {
    id: 'fc_06',
    claim:
      'Solid-state battery cells sustain 98% capacity after 3,000 continuous full discharge cycles.',
    claimant: 'Automotive Foundry Press Release',
    rating: 'TRUE',
    summary:
      'Independent lab testing by national laboratories confirms ceramic electrolyte structures eliminate lithium dendrite formation, maintaining 98.2% capacity over 3,000 cycles.',
    checker: 'Global Energy Storage Verification Panel',
    sources: ['National Renewable Energy Laboratory (NREL)', 'Fraunhofer Institute'],
    url: 'https://news.platform/fact-checks/fc_06',
    checkedAt: '2026-09-30T12:00:00Z',
  },
  {
    id: 'fc_07',
    claim: 'A single AI search query consumes five liters of clean drinking water for cooling.',
    claimant: 'Viral Infographics on Instagram & X',
    rating: 'MOSTLY_FALSE',
    summary:
      'Modern closed-loop datacenter liquid cooling cycles recirculate treated chilled water. Median net evaporated consumption per prompt is under 0.004 liters (approx. half a teaspoon), not five liters.',
    checker: 'GlobalPulse Tech Desk & Datacenter Institute',
    sources: ['Electric Power Research Institute', 'ACM Computing Surveys 2026'],
    url: 'https://news.platform/fact-checks/fc_07',
    checkedAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'fc_08',
    claim: 'Commercial 2nm chips will begin high-volume consumer smartphone shipments in Q1 2027.',
    claimant: 'Supply Chain Leak Aggregators',
    rating: 'MIXTURE',
    summary:
      'While risk production wafers have completed tape-out, leading foundries confirmed that volume consumer shipments will occur in Q3 2027 for flagship nodes, with Q1 limited to pilot accelerator test chips.',
    checker: 'Semiconductor Industry Truth Council',
    sources: ['TSMC Investor Relations Disclosures', 'TrendForce Foundry Analysis'],
    url: 'https://news.platform/fact-checks/fc_08',
    checkedAt: '2026-10-01T14:00:00Z',
  },
  {
    id: 'fc_09',
    claim: 'Quantum computers cracked 4096-bit RSA cryptographic keys in 30 seconds.',
    claimant: 'Cybersecurity Rumor Threads & Hacker Forums',
    rating: 'FALSE',
    summary:
      "State-of-the-art quantum processors operate up to 1,200 noisy physical qubits, far below the estimated millions of fault-tolerant logical qubits required by Shor's algorithm for 4096-bit RSA factoring.",
    checker: 'National Cryptographic Verification Alliance',
    sources: ['NIST Post-Quantum Cryptography Consortium', 'MIT Quantum Lab'],
    url: 'https://news.platform/fact-checks/fc_09',
    checkedAt: '2026-10-02T11:00:00Z',
  },
  {
    id: 'fc_10',
    claim:
      'Formal mathematical verification guarantees zero logical flaws in autonomous software code deployment.',
    claimant: 'Enterprise DevOps Vendor Whitepapers',
    rating: 'MOSTLY_TRUE',
    summary:
      'SMT solvers mathematically prove boundary conditions and typed safety invariants; however, specifications written with flawed requirements or underspecified constraints can still yield logic errors.',
    checker: 'ACM Formal Methods Bureau',
    sources: ['Association for Computing Machinery', 'IEEE Software Engineering Journal'],
    url: 'https://news.platform/fact-checks/fc_10',
    checkedAt: '2026-10-02T09:30:00Z',
  },
  {
    id: 'fc_11',
    claim:
      'Advanced High-NA EUV lithography machines were secretly diverted to uncertified fabrication facilities.',
    claimant: 'Geopolitical Investigative Newsletter',
    rating: 'FALSE',
    summary:
      'Satellite logistics tracking, optical serial hashing, and multilateral Wassenaar treaty export telemetry confirm all High-NA tools are physically sealed and accounted for at certified foundries.',
    checker: 'Semiconductor Trade Compliance Bureau',
    sources: ['ASML Investor Disclosures', 'Wassenaar Arrangement Secretariat'],
    url: 'https://news.platform/fact-checks/fc_11',
    checkedAt: '2026-10-01T16:45:00Z',
  },
  {
    id: 'fc_12',
    claim:
      'Small Modular Nuclear Reactors (SMRs) are already powering commercial AI datacenters at gigawatt scale in 2026.',
    claimant: 'Tech Investor Keynote Presentations',
    rating: 'MIXTURE',
    summary:
      'Regulatory permits and site preparation agreements have been executed for datacenter co-location, but physical commercial power generation from SMRs will not reach the grid before late 2028.',
    checker: 'Global Energy & Datacenter Truth Project',
    sources: ['Nuclear Regulatory Commission (NRC)', 'International Energy Agency'],
    url: 'https://news.platform/fact-checks/fc_12',
    checkedAt: '2026-10-01T14:15:00Z',
  },
  {
    id: 'fc_13',
    claim:
      'Generative voice cloning breached biometric voice authentication at tier-1 international banks.',
    claimant: 'Financial Security Podcast',
    rating: 'MOSTLY_TRUE',
    summary:
      'Controlled red-team audits demonstrated synthetic voice models spoofed legacy 2G acoustic verification protocols, prompting banks to mandate multi-factor physical passkeys and behavioral liveness telemetry.',
    checker: 'Banking Cyber Fraud Task Force',
    sources: ['Financial Stability Board', 'European Banking Authority'],
    url: 'https://news.platform/fact-checks/fc_13',
    checkedAt: '2026-09-30T15:20:00Z',
  },
  {
    id: 'fc_14',
    claim:
      'A major orbital satellite collision cascade occurred in low Earth orbit between commercial constellations.',
    claimant: 'Anonymous Aviation Tracker Posts',
    rating: 'FALSE',
    summary:
      'Automated collision-avoidance thrusters performed nominal avoidance burns with minimum miss distances exceeding 4.2 km. Space Command radar logs confirm zero fragmentation events.',
    checker: 'Combined Space Operations Center',
    sources: ['US Space Command (USSPACECOM)', 'European Space Agency SSA'],
    url: 'https://news.platform/fact-checks/fc_14',
    checkedAt: '2026-09-30T10:00:00Z',
  },
  {
    id: 'fc_15',
    claim:
      'Automotive OEMs commenced deliveries of passenger EVs with 1,000-kilometer solid-state batteries.',
    claimant: 'Automotive Influencer Channels',
    rating: 'MIXTURE',
    summary:
      'Pilot test fleets equipped with semi-solid-state cells have achieved 1,000 km test routes, but mass-market commercial consumer deliveries with 100% solid-state ceramic electrolytes remain slated for 2027-2028.',
    checker: 'Automotive Technology Verification Council',
    sources: ['SAE International', 'Society of Motor Manufacturers'],
    url: 'https://news.platform/fact-checks/fc_15',
    checkedAt: '2026-09-29T17:30:00Z',
  },
  {
    id: 'fc_16',
    claim:
      'BRICS member states executed 85% of their mutual bilateral trade without third-party currency conversion in Q3 2026.',
    claimant: 'Economic Summit Commentary',
    rating: 'TRUE',
    summary:
      'Official central monetary balance audits confirm 84.7% of member-to-member merchandise trade cleared through local currency nostro accounts and national payment gateways during Q3 2026.',
    checker: 'GlobalPulse Economic Verification Desk',
    sources: ['Reserve Bank of India Monthly Bulletin', 'Bank for International Settlements'],
    url: 'https://news.platform/fact-checks/fc_16',
    checkedAt: '2026-09-29T11:45:00Z',
  },
  {
    id: 'fc_17',
    claim: 'Graphene sieve nanofiltration cut seawater desalination energy requirements by 70%.',
    claimant: 'Clean Water Innovation Press Releases',
    rating: 'MOSTLY_TRUE',
    summary:
      'Single-atom carbon membrane pilots demonstrated a 68% decrease in hydraulic pressure requirements compared to legacy polyamide reverse osmosis, though membrane durability under biofouling is undergoing 12-month endurance trials.',
    checker: 'International Desalination & Water Bureau',
    sources: ['Nature Water', 'International Desalination Association'],
    url: 'https://news.platform/fact-checks/fc_17',
    checkedAt: '2026-09-28T16:10:00Z',
  },
  {
    id: 'fc_18',
    claim:
      'An autonomous algorithmic trading agent loop triggered an emergency 15-minute trading halt on the Tokyo Stock Exchange.',
    claimant: 'Financial Social Feeds',
    rating: 'TRUE',
    summary:
      'Exchange regulators confirmed automated circuit breakers tripped after high-frequency cross-currency arbitrage agent clusters simultaneously liquidated leveraged yen positions within 42 milliseconds.',
    checker: 'Financial Markets Regulatory Surveillance',
    sources: ['Japan Financial Services Agency', 'Tokyo Stock Exchange Operational Disclosures'],
    url: 'https://news.platform/fact-checks/fc_18',
    checkedAt: '2026-09-28T07:15:00Z',
  },
];
