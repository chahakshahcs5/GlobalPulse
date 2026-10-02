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
