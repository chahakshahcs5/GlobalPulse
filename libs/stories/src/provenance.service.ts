import type { DatabaseService } from '@ai-news/database';
import type { AIStoryProvenance, RecordStoryProvenanceInput } from '@ai-news/schemas';
import {
  createPromptHash,
  generateProvenanceWatermark,
  verifyProvenanceWatermark,
} from '@ai-news/shared';
import { randomUUID } from 'crypto';

export class ProvenanceService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Attaches cryptographic provenance metadata and an HMAC watermark to an AI-assisted story.
   */
  async recordProvenance(
    storyId: string,
    input: RecordStoryProvenanceInput,
    orgId: string = 'org_default'
  ): Promise<AIStoryProvenance> {
    const story = await this.db.stories.findById(storyId, orgId);
    if (!story) {
      throw new Error(`Story with id "${storyId}" was not found.`);
    }

    const now = new Date().toISOString();
    const promptHash = createPromptHash(input.prompt);
    const watermarkSignature = generateProvenanceWatermark(
      storyId,
      promptHash,
      input.generatorModel,
      now
    );

    const provenance: AIStoryProvenance = {
      id: `prov_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      storyId,
      generatorModel: input.generatorModel,
      promptHash,
      confidenceScore: input.confidenceScore !== undefined ? input.confidenceScore : 0.95,
      humanReviewedBy: input.humanReviewedBy,
      watermarkSignature,
      c2paManifestUrl: input.c2paManifestUrl,
      generationTimestamp: now,
      createdAt: now,
    };

    return this.db.provenance.saveProvenance(provenance);
  }

  /**
   * Retrieves provenance dossier for a story.
   */
  async getProvenance(storyId: string): Promise<AIStoryProvenance | null> {
    return this.db.provenance.getProvenance(storyId);
  }

  /**
   * Verifies the cryptographic watermark integrity of a story's provenance record.
   */
  async verifyProvenance(
    storyId: string
  ): Promise<{ valid: boolean; provenance: AIStoryProvenance | null; error?: string }> {
    const record = await this.db.provenance.getProvenance(storyId);
    if (!record) {
      return { valid: false, provenance: null, error: 'No provenance record found for this story.' };
    }

    const isValid = verifyProvenanceWatermark(record);
    return {
      valid: isValid,
      provenance: record,
      error: isValid ? undefined : 'Watermark signature verification failed: record has been tampered with.',
    };
  }
}
