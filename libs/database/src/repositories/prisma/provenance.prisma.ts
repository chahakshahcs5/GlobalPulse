import type { AIStoryProvenance } from '@ai-news/schemas';
import type { IProvenanceRepository } from '../../interfaces/provenance.repository';
import { MemoryProvenanceRepository } from '../memory/provenance.memory';

interface PrismaProvenanceRow {
  id: string;
  storyId: string;
  generatorModel: string;
  promptHash: string;
  confidenceScore: number;
  humanReviewedBy?: string | null;
  watermarkSignature: string;
  c2paManifestUrl?: string | null;
  generationTimestamp: Date | string;
  createdAt: Date | string;
}

export class PrismaProvenanceRepository implements IProvenanceRepository {
  private fallbackMemory = new MemoryProvenanceRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get provenanceClient():
    | {
        upsert: (args: {
          where: Record<string, unknown>;
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => Promise<PrismaProvenanceRow>;
        findUnique: (args: {
          where: Record<string, unknown>;
        }) => Promise<PrismaProvenanceRow | null>;
      }
    | undefined {
    return (this.prisma as Record<string, unknown>).storyProvenance as typeof this.provenanceClient;
  }

  async saveProvenance(provenance: AIStoryProvenance): Promise<AIStoryProvenance> {
    if (!this.provenanceClient) {
      return this.fallbackMemory.saveProvenance(provenance);
    }
    try {
      const saved = await this.provenanceClient.upsert({
        where: { storyId: provenance.storyId },
        create: {
          id: provenance.id,
          storyId: provenance.storyId,
          generatorModel: provenance.generatorModel,
          promptHash: provenance.promptHash,
          confidenceScore: provenance.confidenceScore,
          humanReviewedBy: provenance.humanReviewedBy,
          watermarkSignature: provenance.watermarkSignature,
          c2paManifestUrl: provenance.c2paManifestUrl,
          generationTimestamp: new Date(provenance.generationTimestamp),
          createdAt: new Date(provenance.createdAt),
        },
        update: {
          generatorModel: provenance.generatorModel,
          promptHash: provenance.promptHash,
          confidenceScore: provenance.confidenceScore,
          humanReviewedBy: provenance.humanReviewedBy,
          watermarkSignature: provenance.watermarkSignature,
          c2paManifestUrl: provenance.c2paManifestUrl,
          generationTimestamp: new Date(provenance.generationTimestamp),
        },
      });
      return {
        id: saved.id,
        storyId: saved.storyId,
        generatorModel: saved.generatorModel,
        promptHash: saved.promptHash,
        confidenceScore: saved.confidenceScore,
        humanReviewedBy: saved.humanReviewedBy || undefined,
        watermarkSignature: saved.watermarkSignature,
        c2paManifestUrl: saved.c2paManifestUrl || undefined,
        generationTimestamp:
          saved.generationTimestamp instanceof Date
            ? saved.generationTimestamp.toISOString()
            : String(saved.generationTimestamp),
        createdAt:
          saved.createdAt instanceof Date ? saved.createdAt.toISOString() : String(saved.createdAt),
      };
    } catch {
      return this.fallbackMemory.saveProvenance(provenance);
    }
  }

  async getProvenance(storyId: string): Promise<AIStoryProvenance | null> {
    if (!this.provenanceClient) {
      return this.fallbackMemory.getProvenance(storyId);
    }
    try {
      const row = await this.provenanceClient.findUnique({ where: { storyId } });
      if (!row) return null;
      return {
        id: row.id,
        storyId: row.storyId,
        generatorModel: row.generatorModel,
        promptHash: row.promptHash,
        confidenceScore: row.confidenceScore,
        humanReviewedBy: row.humanReviewedBy || undefined,
        watermarkSignature: row.watermarkSignature,
        c2paManifestUrl: row.c2paManifestUrl || undefined,
        generationTimestamp:
          row.generationTimestamp instanceof Date
            ? row.generationTimestamp.toISOString()
            : String(row.generationTimestamp),
        createdAt:
          row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      };
    } catch {
      return this.fallbackMemory.getProvenance(storyId);
    }
  }
}
