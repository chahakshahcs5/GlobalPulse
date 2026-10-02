import { randomUUID } from 'crypto';
import { type DatabaseService, BASELINE_FACT_CHECKS } from '@ai-news/database';
import type {
  FactCheckClaim,
  StoryCredibilityAssessment,
  CredibilityFactor,
  DuplicateCheckResult,
  DuplicateMatch,
  CheckDuplicateInput,
} from '@ai-news/schemas';

export const SEED_FACT_CHECKS: FactCheckClaim[] = BASELINE_FACT_CHECKS;

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : (intersection / union) * 100;
}

function extractTrigrams(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const trigrams: string[] = [];
  for (let i = 0; i < words.length - 2; i++) {
    trigrams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return trigrams;
}

export class FactCheckService {
  constructor(private readonly db: DatabaseService) {}

  async listFactChecks(): Promise<FactCheckClaim[]> {
    return await this.db.factChecks.list();
  }

  async addFactCheck(
    claim: Omit<FactCheckClaim, 'id' | 'checkedAt'> & { id?: string; checkedAt?: string }
  ): Promise<FactCheckClaim> {
    const newClaim: FactCheckClaim = {
      ...claim,
      id: claim.id || `fc_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      checkedAt: claim.checkedAt || new Date().toISOString(),
      sources: claim.sources || [],
    };
    return await this.db.factChecks.create(newClaim);
  }

  /**
   * F12: Evaluates story credibility score (0-100) based on source verification status,
   * cited references, primary quotes, and automated claim validation.
   */
  async evaluateStoryCredibility(
    storyId: string,
    orgId: string = 'org_default'
  ): Promise<StoryCredibilityAssessment> {
    const story = await this.db.stories.findById(storyId, orgId);
    if (!story) {
      throw new Error(`Story with id ${storyId} was not found`);
    }

    let score = 70; // Baseline neutral score
    const factors: CredibilityFactor[] = [];
    const matchedClaims: FactCheckClaim[] = [];

    // Factor 1: Citations and primary sources
    const hasSources =
      (story.sourceIds && story.sourceIds.length > 0) ||
      (story.blocks || []).some((b) => b.blockType === 'citation' || b.blockType === 'source');
    if (hasSources) {
      score += 15;
      factors.push({
        factor: 'Verified Sources & Citations',
        impact: +15,
        description: 'Story links directly to verified source registries or formal citations.',
      });
    } else {
      score -= 10;
      factors.push({
        factor: 'Missing Primary Citations',
        impact: -10,
        description: 'No verified source entries or explicit citations attached to content blocks.',
      });
    }

    // Factor 2: Direct quotes with attribution
    const hasQuotes = (story.blocks || []).some((b) => b.blockType === 'quote');
    if (hasQuotes) {
      score += 10;
      factors.push({
        factor: 'Attributed Primary Quotes',
        impact: +10,
        description: 'Includes on-the-record statements with named attributions.',
      });
    }

    // Factor 3: Author provenance and verification
    if (story.createdVia === 'admin' || story.authorId.startsWith('usr_')) {
      score += 5;
      factors.push({
        factor: 'Newsroom Editorial Governance',
        impact: +5,
        description: 'Story authored within verified editorial workflow permissions.',
      });
    }

    // Factor 4: Check against known debunked assertions in the fact-check knowledge base
    const storyText = `${story.title} ${story.summary}`.toLowerCase();
    const factChecks = await this.listFactChecks();
    for (const fc of factChecks) {
      const claimKeywords = fc.claim
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);
      const matchesCount = claimKeywords.filter((w) => storyText.includes(w)).length;
      if (matchesCount >= 3) {
        matchedClaims.push(fc);
        if (fc.rating === 'FALSE' || fc.rating === 'MOSTLY_FALSE') {
          score -= 30;
          factors.push({
            factor: `Debunked Claim Reference: "${fc.claim.slice(0, 40)}..."`,
            impact: -30,
            description: `Story references an assertion flagged as ${fc.rating} by ${fc.checker}.`,
          });
        } else if (fc.rating === 'TRUE') {
          score += 10;
          factors.push({
            factor: `Verified Claim Alignment: "${fc.claim.slice(0, 40)}..."`,
            impact: +10,
            description: `Story aligns with verified factual findings confirmed by ${fc.checker}.`,
          });
        }
      }
    }

    // Clamp score between 0 and 100
    const finalScore = Math.max(0, Math.min(100, score));
    const level: 'high' | 'medium' | 'low' =
      finalScore >= 75 ? 'high' : finalScore >= 50 ? 'medium' : 'low';

    return {
      storyId: story.id,
      score: finalScore,
      level,
      factors,
      claims: matchedClaims,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * F13: Pre-publication duplicate and plagiarism detection engine.
   * Compares incoming title & content against existing published stories in the newsroom.
   */
  async checkDuplication(
    input: CheckDuplicateInput,
    orgId: string = 'org_default'
  ): Promise<DuplicateCheckResult> {
    const inputFullText = `${input.title} ${input.content}`;
    const inputTokens = tokenize(inputFullText);
    const inputTrigrams = new Set(extractTrigrams(inputFullText));

    const existingStories = await this.db.stories.listPaginated({ limit: 200 }, orgId);
    const threshold = input.threshold ?? 75;

    const matches: DuplicateMatch[] = [];
    let maxSimilarity = 0;

    for (const other of existingStories.items) {
      if (input.storyIdToExclude && other.id === input.storyIdToExclude) continue;

      let otherText = `${other.title} ${other.summary}`;
      if (other.blocks && Array.isArray(other.blocks)) {
        for (const b of other.blocks) {
          const d =
            b.data && typeof b.data === 'object' ? (b.data as Record<string, unknown>) : undefined;
          if (d && typeof d.text === 'string') {
            otherText += ` ${d.text}`;
          }
        }
      }

      const otherTokens = tokenize(otherText);
      const jaccard = calculateJaccardSimilarity(inputTokens, otherTokens);

      // Check shared trigram phrases
      const otherTrigrams = extractTrigrams(otherText);
      const sharedPhrases = Array.from(
        new Set(otherTrigrams.filter((t) => inputTrigrams.has(t)))
      ).slice(0, 5);

      const roundedSimilarity = Math.round(jaccard * 10) / 10;
      if (roundedSimilarity > maxSimilarity) {
        maxSimilarity = roundedSimilarity;
      }

      if (roundedSimilarity >= 15) {
        matches.push({
          storyId: other.id,
          title: other.title,
          similarityPercentage: roundedSimilarity,
          sharedPhrases,
        });
      }
    }

    matches.sort((a, b) => b.similarityPercentage - a.similarityPercentage);

    const isDuplicate = maxSimilarity >= threshold;
    const recommendation: 'allow' | 'review_required' | 'reject' =
      maxSimilarity >= threshold ? 'reject' : maxSimilarity >= 45 ? 'review_required' : 'allow';

    return {
      isDuplicate,
      maxSimilarity,
      recommendation,
      matches: matches.slice(0, 10),
      checkedAt: new Date().toISOString(),
    };
  }
}
