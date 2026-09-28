import type { AIStoryProvenance } from '@ai-news/schemas';

export interface IProvenanceRepository {
  saveProvenance(provenance: AIStoryProvenance): Promise<AIStoryProvenance>;
  getProvenance(storyId: string): Promise<AIStoryProvenance | null>;
}
