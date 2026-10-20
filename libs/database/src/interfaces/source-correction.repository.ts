import type { SourceCorrection } from '@ai-news/schemas';

export interface SourceCorrectionFilter {
  publisherId?: string;
  sourceId?: string;
  storyId?: string;
  limit?: number;
}

export interface ISourceCorrectionRepository {
  list(orgId: string, filter?: SourceCorrectionFilter): Promise<SourceCorrection[]>;
  findById(id: string, orgId: string): Promise<SourceCorrection | null>;
  create(correction: SourceCorrection): Promise<SourceCorrection>;
  delete(id: string, orgId: string): Promise<boolean>;
}
