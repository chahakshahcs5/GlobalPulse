import type { AuditLog } from '@ai-news/schemas';

export interface AuditFilter {
  clientType?: string;
  action?: string;
  userId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export interface IAuditRepository {
  log(entry: AuditLog): Promise<void>;
  query(orgId: string, filter?: AuditFilter): Promise<AuditLog[]>;
  findById(id: string): Promise<AuditLog | null>;
}
