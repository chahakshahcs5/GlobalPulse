import type { AuditLog } from '@ai-news/schemas';
import type { IAuditRepository, AuditFilter } from '../../interfaces/audit.repository';

export class MemoryAuditRepository implements IAuditRepository {
  private logs: AuditLog[] = [];

  async log(entry: AuditLog): Promise<void> {
    this.logs.unshift({ ...entry });
  }

  async query(orgId: string, filter?: AuditFilter): Promise<AuditLog[]> {
    let result = this.logs.filter((l) => l.organizationId === orgId);

    if (filter) {
      if (filter.clientType) {
        result = result.filter((l) => l.clientType === filter.clientType);
      }
      if (filter.action) {
        result = result.filter((l) => l.action === filter.action);
      }
      if (filter.userId) {
        result = result.filter((l) => l.userId === filter.userId);
      }
      if (filter.status) {
        result = result.filter((l) => l.status === filter.status);
      }
      if (filter.fromDate) {
        const fromTime = new Date(filter.fromDate).getTime();
        result = result.filter((l) => new Date(l.timestamp).getTime() >= fromTime);
      }
      if (filter.toDate) {
        const toTime = new Date(filter.toDate).getTime();
        result = result.filter((l) => new Date(l.timestamp).getTime() <= toTime);
      }
      if (filter.limit && filter.limit > 0) {
        result = result.slice(0, filter.limit);
      }
    }

    return result;
  }

  async findById(id: string): Promise<AuditLog | null> {
    const entry = this.logs.find((l) => l.id === id);
    return entry ? { ...entry } : null;
  }

  snapshot(): AuditLog[] {
    return this.logs.map((l) => ({ ...l }));
  }

  restore(snap: AuditLog[]): void {
    this.logs = snap.map((l) => ({ ...l }));
  }

  clear(): void {
    this.logs = [];
  }
}
