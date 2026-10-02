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
    checkedAt: new Date().toISOString(),
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
