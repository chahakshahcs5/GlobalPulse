import { createHash, createHmac } from 'crypto';
import type { AIStoryProvenance } from '@ai-news/schemas';

const DEFAULT_SECRET = process.env.PROVENANCE_HMAC_SECRET || 'globalpulse-ai-provenance-watermark-key-2026';

/**
 * Creates a deterministic SHA-256 cryptographic hash of the input prompt.
 */
export function createPromptHash(prompt: string): string {
  return createHash('sha256').update(prompt.trim()).digest('hex');
}

/**
 * Generates an HMAC-SHA256 watermark signature binding story, generator model, prompt, and timestamp.
 */
export function generateProvenanceWatermark(
  storyId: string,
  promptHash: string,
  generatorModel: string,
  timestamp: string,
  secret: string = DEFAULT_SECRET
): string {
  const payload = `${storyId}:${generatorModel}:${promptHash}:${timestamp}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Validates whether the provenance watermark signature is authentic and unaltered.
 */
export function verifyProvenanceWatermark(
  provenance: AIStoryProvenance,
  secret: string = DEFAULT_SECRET
): boolean {
  const expected = generateProvenanceWatermark(
    provenance.storyId,
    provenance.promptHash,
    provenance.generatorModel,
    provenance.generationTimestamp,
    secret
  );
  return expected === provenance.watermarkSignature;
}
