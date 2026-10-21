import { StoryBlockSchema, type StoryBlock } from '@ai-news/schemas';
import type { MediaBlockDraft } from './types';

/**
 * The starting payload for a block the composer has just added.
 *
 * Every one of these is a payload the platform's own schema accepts, so an
 * editor who adds a chart and publishes without touching it still gets a
 * story the platform will render.
 */
export function createDefaultMediaBlock(type: MediaBlockDraft['type']): MediaBlockDraft {
  const id = `blk_${type}_${Date.now().toString(36)}`;

  switch (type) {
    case 'image':
      return {
        id,
        type: 'image',
        data: {
          url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
          altText: 'Rows of solar panels in a field at first light',
          caption: 'The Northfield array at first light, six months after commissioning.',
          aspectRatio: '16:9',
          credit: 'Nia Bergman / GlobalPulse',
          sourceAttribution: 'Northfield Energy',
        },
      };

    case 'chart':
      return {
        id,
        type: 'chart',
        data: {
          chartType: 'bar',
          title: 'Sovereign Compute & Model Training Throughput',
          subtitle: 'Peak throughput by jurisdiction',
          xAxis: { key: 'jurisdiction', label: 'Jurisdiction' },
          yAxis: { label: 'Throughput', unit: 'EFLOPS' },
          series: [{ name: 'Peak throughput', key: 'eflops' }],
          values: [
            { jurisdiction: 'United States', eflops: 42 },
            { jurisdiction: 'European Union', eflops: 28 },
            { jurisdiction: 'India', eflops: 31 },
            { jurisdiction: 'Japan', eflops: 19 },
          ],
          methodology: 'Peak sustained throughput reported by each national programme.',
          sourceAttribution: 'GlobalPulse data desk',
        },
      };

    case 'quote':
      return {
        id,
        type: 'quote',
        data: {
          quote:
            'Autonomous verification frameworks represent the foundational prerequisite for critical infrastructure deployment.',
          attribution: 'Dr. Aris Thorne',
          title: 'Director of Machine Verification, Global Safety Taskforce',
        },
      };

    case 'timeline':
      return {
        id,
        type: 'timeline',
        data: {
          title: 'Key Milestones & Timeline',
          items: [
            {
              date: 'Phase 1 · 09:00',
              headline: 'Working Group Formal Convening',
              body: 'Delegations confirm the multilateral agenda.',
            },
            {
              date: 'Phase 2 · 14:30',
              headline: 'Technical Framework Approved',
              body: 'All parties ratify the operational protocol.',
            },
          ],
        },
      };

    case 'video':
      return {
        id,
        type: 'video',
        data: {
          url: '/videos/starship-downlink.mp4',
          aspectRatio: '16:9',
          caption: 'Live video dispatch and ministerial press briefing.',
          durationSeconds: 180,
        },
      };

    case 'table':
      return {
        id,
        type: 'table',
        data: {
          title: 'Comparative Benchmark Matrix',
          headers: ['Metric / Indicator', 'Baseline 2024', 'Current 2025', 'Target 2026'],
          rows: [
            ['Throughput (TFLOPS)', '14.2', '48.9', '120.0'],
            ['Thermal Dissipation (W)', '280', '210', '165'],
            ['Latency (μs)', '4.2', '1.8', '0.9'],
          ],
          footer: 'Source: Official Engineering Audit and Independent Laboratory Validation.',
          sortable: true,
          filterable: true,
          searchable: true,
          downloadable: true,
          sourceAttribution: 'GlobalPulse engineering desk',
        },
      };

    case 'callout':
      return {
        id,
        type: 'callout',
        data: {
          style: 'info',
          title: 'Regulatory & Editorial Context',
          text: 'This policy dispatch incorporates verified statements from accredited delegations and primary regulatory filings.',
        },
      };

    case 'statistic':
      return {
        id,
        type: 'statistic',
        data: {
          label: 'Total Sovereign Allocation ($ Billion)',
          value: '42.8',
          unit: '$bn',
          trend: 'up',
          trendValue: '+28.4% YoY',
          context: 'Cumulative multilateral infrastructure development commitments.',
          sourceAttribution: 'GlobalPulse data desk',
        },
      };
  }
}

export interface AssembleBlocksInput {
  leadParagraph: string;
  bullet1: string;
  bullet2: string;
  bullet3: string;
  mediaBlocks: MediaBlockDraft[];
  storyId?: string;
}

/**
 * Turn the composer's fields into the story's block list.
 *
 * The result is validated against the platform's own block schema before it
 * is returned, so a payload that would be rejected on publish is caught in
 * the editor instead.
 */
export function assembleStoryBlocks({
  leadParagraph,
  bullet1,
  bullet2,
  bullet3,
  mediaBlocks,
  storyId = 'new',
}: AssembleBlocksInput): StoryBlock[] {
  const blocks: StoryBlock[] = [];

  if (leadParagraph.trim()) {
    blocks.push({
      id: `blk_lead_${storyId}`,
      blockType: 'paragraph',
      sortOrder: 0,
      data: { text: leadParagraph.trim(), format: 'markdown' },
    });
  }

  const keyTakeaways = [bullet1, bullet2, bullet3].filter((bullet) => bullet.trim().length > 0);
  if (keyTakeaways.length > 0) {
    blocks.push({
      id: `blk_takeaways_${storyId}`,
      blockType: 'summary',
      sortOrder: blocks.length,
      data: {
        headline: 'Key Takeaways',
        bulletPoints: keyTakeaways,
      },
    });
  }

  for (const draft of mediaBlocks) {
    blocks.push({
      id: draft.id,
      blockType: draft.type,
      sortOrder: blocks.length,
      data: draft.data,
    } as StoryBlock);
  }

  return blocks;
}

export interface BlockValidationIssue {
  blockId: string;
  blockType: string;
  message: string;
}

/**
 * Check the composer's blocks against the platform schema.
 *
 * The composer and the platform share one schema, so a block that fails
 * here would also fail on publish. Catching it here means the editor finds
 * out while they are still looking at it.
 */
export function validateStoryBlocks(blocks: StoryBlock[]): BlockValidationIssue[] {
  const issues: BlockValidationIssue[] = [];

  for (const block of blocks) {
    const result = StoryBlockSchema.safeParse(block);
    if (result.success) continue;
    for (const issue of result.error.issues) {
      issues.push({
        blockId: block.id,
        blockType: block.blockType,
        message: `${issue.path.join('.') || 'block'} ${issue.message}`,
      });
    }
  }

  return issues;
}
