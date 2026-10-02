import { randomUUID } from 'crypto';
import type { FactCheckClaim } from '@ai-news/schemas';
import type { IFactCheckRepository, FactCheckFilter } from '../../interfaces/fact-check.repository';

export const BASELINE_FACT_CHECKS: FactCheckClaim[] = [
  {
    id: 'fc_01',
    claim: 'Solar storms completely dismantled international undersea internet cables.',
    claimant: 'Viral Social Media Posts',
    rating: 'FALSE',
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
    rating: 'FALSE',
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
    rating: 'TRUE',
    summary:
      'Peer-reviewed measurements at the Large Hadron Collider confirm unprecedented quantum correlation metrics.',
    checker: 'Science Verification Network',
    sources: ['Physical Review Letters', 'CERN Directorate'],
    checkedAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
  },
  {
    id: 'fc_04',
    claim:
      'Leaked benchmark indicates frontier AI model reached autonomous artificial general intelligence.',
    claimant: 'Anonymous Tech Forum Leak',
    rating: 'FALSE',
    summary:
      'The leaked document was an unverified prompt-engineering benchmark with synthetic evaluations and missing validation telemetry.',
    checker: 'Tech & AI Verification Bureau',
    sources: ['Frontier Model Forum', 'Stanford AI Index Consortium'],
    checkedAt: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
  },
  {
    id: 'fc_05',
    claim: 'Antarctic winter sea ice extent hit an all-time 45-year satellite record high in 2026.',
    claimant: 'Climate Denialist Podcast',
    rating: 'FALSE',
    summary:
      'Copernicus and NSIDC satellite sensor arrays confirmed sea ice extent was 1.2 million sq km below the 1991-2020 climatological mean.',
    checker: 'Global Climate Science Desk',
    sources: ['Copernicus Climate Change Service', 'National Snow and Ice Data Center (NSIDC)'],
    checkedAt: new Date(Date.now() - 3600 * 1000 * 28).toISOString(),
  },
  {
    id: 'fc_06',
    claim:
      'World Health Organization initiated global advisory regarding bioaccumulative microplastics in cardiovascular tissue.',
    claimant: 'Medical Research Digest',
    rating: 'MOSTLY_TRUE',
    summary:
      'WHO published an updated technical advisory urging stricter monitoring of nanoplastics in cardiovascular circulation, but did not declare a binding emergency.',
    checker: 'Health Verification Network',
    sources: ['World Health Organization Bulletin', 'The Lancet Oncology'],
    checkedAt: new Date(Date.now() - 3600 * 1000 * 42).toISOString(),
  },
  {
    id: 'fc_07',
    claim:
      'Commercial nuclear fusion facility achieved continuous net-positive power supply to national electrical grid.',
    claimant: 'Viral Clean Energy Clip',
    rating: 'MIXTURE',
    summary:
      'The pilot reactor achieved transient Q > 1.25 energy gain in a magnetic containment test pulse, but grid interconnection is scheduled for 2029 pilot trials.',
    checker: 'Energy Intelligence Wire',
    sources: ['International Atomic Energy Agency (IAEA)', 'ITER Organization'],
    checkedAt: new Date(Date.now() - 3600 * 1000 * 56).toISOString(),
  },
  {
    id: 'fc_08',
    claim:
      'International Monetary Fund mandated gold-backed reserves for cross-border bilateral settlements.',
    claimant: 'Finance Telegram Channels',
    rating: 'FALSE',
    summary:
      'The IMF Articles of Agreement explicitly maintain Special Drawing Rights (SDRs) and multi-currency foreign exchange reserves without gold mandate.',
    checker: 'Reuters Fact Check',
    sources: ['International Monetary Fund Media Advisory', 'BIS Quarterly Review'],
    checkedAt: new Date(Date.now() - 3600 * 1000 * 70).toISOString(),
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
    checkedAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
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
    checkedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
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
    checkedAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
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
    checkedAt: new Date(Date.now() - 3600 * 1000 * 22).toISOString(),
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
    checkedAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
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
    checkedAt: new Date(Date.now() - 3600 * 1000 * 30).toISOString(),
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
    checkedAt: new Date(Date.now() - 3600 * 1000 * 34).toISOString(),
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
    checkedAt: new Date(Date.now() - 3600 * 1000 * 38).toISOString(),
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
    checkedAt: new Date(Date.now() - 3600 * 1000 * 46).toISOString(),
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
    checkedAt: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
  },
];

export class MemoryFactCheckRepository implements IFactCheckRepository {
  private records = new Map<string, FactCheckClaim>();

  constructor() {
    this.seedBaselineFactChecks();
  }

  private seedBaselineFactChecks(): void {
    for (const fc of BASELINE_FACT_CHECKS) {
      this.records.set(fc.id, { ...fc });
    }
  }

  async list(filter?: FactCheckFilter): Promise<FactCheckClaim[]> {
    let items = Array.from(this.records.values());
    if (filter?.rating) {
      items = items.filter((item) => item.rating === filter.rating);
    }
    items.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
    if (filter?.limit && filter.limit > 0) {
      items = items.slice(0, filter.limit);
    }
    return items.map((i) => ({ ...i }));
  }

  async findById(id: string): Promise<FactCheckClaim | null> {
    const item = this.records.get(id);
    return item ? { ...item } : null;
  }

  async create(claim: FactCheckClaim): Promise<FactCheckClaim> {
    const record: FactCheckClaim = {
      ...claim,
      id: claim.id || `fc_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      checkedAt: claim.checkedAt || new Date().toISOString(),
      sources: claim.sources || [],
    };
    this.records.set(record.id, record);
    return { ...record };
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }

  snapshot(): Map<string, FactCheckClaim> {
    return new Map(this.records);
  }

  restore(snapshot: Map<string, FactCheckClaim>): void {
    this.records = new Map(snapshot);
  }

  clear(): void {
    this.records.clear();
    this.seedBaselineFactChecks();
  }
}
