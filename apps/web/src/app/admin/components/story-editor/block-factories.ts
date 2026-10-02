import type { StoryBlock } from '@ai-news/schemas';
import type { MediaBlockDraft } from './types';

export function createDefaultMediaBlock(type: MediaBlockDraft['type']): MediaBlockDraft {
  const id = Date.now().toString();
  switch (type) {
    case 'image':
      return {
        id,
        type: 'image',
        data: {
          url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
          caption: 'High-precision foundry cleanroom lithography operations.',
          credit: 'Advanced Semiconductor Standards Bureau',
          altText: 'Cleanroom technician inspecting wafer',
        },
      };
    case 'chart':
      return {
        id,
        type: 'chart',
        data: {
          chartType: 'bar',
          title: 'Sovereign Compute & Model Training Throughput',
          xAxis: 'Jurisdiction',
          yAxis: 'EFLOPS',
          dataRows: 'United States: 42\nEuropean Union: 28\nIndia: 31\nJapan: 19',
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
        },
        items: [
          {
            date: 'Phase 1 • 09:00 AM',
            headline: 'Working Group Formal Convening',
            body: 'Delegations confirm multilateral agenda.',
          },
          {
            date: 'Phase 2 • 02:30 PM',
            headline: 'Technical Framework Approved',
            body: 'All parties ratify operational protocol.',
          },
        ],
      };
    case 'video':
      return {
        id,
        type: 'video',
        data: {
          url: '/videos/starship-downlink.mp4',
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
          headers: 'Metric / Indicator, Baseline 2024, Current 2025, Target 2026',
          rowsText:
            'Throughput (TFLOPS), 14.2, 48.9, 120.0\nThermal Dissipation (W), 280, 210, 165\nLatency (μs), 4.2, 1.8, 0.9',
          footer: 'Source: Official Engineering Audit and Independent Laboratory Validation.',
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
          trend: 'up',
          trendValue: '+28.4% YoY',
          context: 'Cumulative multilateral infrastructure development commitments.',
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

  const keyTakeaways = [bullet1, bullet2, bullet3].filter((b) => b.trim().length > 0);
  if (keyTakeaways.length > 0) {
    blocks.push({
      id: `blk_takeaways_${storyId}`,
      blockType: 'summary',
      sortOrder: 1,
      data: {
        headline: 'Key Takeaways',
        bulletPoints: keyTakeaways,
      },
    });
  }

  mediaBlocks.forEach((m) => {
    const sortOrder = blocks.length;
    if (m.type === 'image') {
      blocks.push({
        id: `img_${m.id}`,
        blockType: 'image',
        sortOrder,
        data: {
          url: String(m.data.url || ''),
          caption: m.data.caption ? String(m.data.caption) : undefined,
          credit: m.data.credit ? String(m.data.credit) : undefined,
          altText: String(m.data.altText || m.data.caption || 'Image'),
          aspectRatio: '16:9',
        },
      } as unknown as StoryBlock);
    } else if (m.type === 'chart') {
      blocks.push({
        id: `chart_${m.id}`,
        blockType: 'chart',
        sortOrder,
        data: {
          chartType: m.data.chartType,
          title: m.data.title,
          xAxis: m.data.xAxis,
          yAxis: m.data.yAxis,
          dataRows: m.data.dataRows,
        },
      } as unknown as StoryBlock);
    } else if (m.type === 'quote') {
      blocks.push({
        id: `quote_${m.id}`,
        blockType: 'quote',
        sortOrder,
        data: {
          quote: String(m.data.quote || ''),
          attribution: String(m.data.attribution || ''),
          title: m.data.title ? String(m.data.title) : undefined,
        },
      } as unknown as StoryBlock);
    } else if (m.type === 'timeline') {
      blocks.push({
        id: `timeline_${m.id}`,
        blockType: 'timeline',
        sortOrder,
        data: {
          title: m.data.title ? String(m.data.title) : 'Timeline',
          items: m.items || [],
        },
      } as unknown as StoryBlock);
    } else if (m.type === 'video') {
      blocks.push({
        id: `video_${m.id}`,
        blockType: 'video',
        sortOrder,
        data: {
          url: String(m.data.url || ''),
          caption: m.data.caption ? String(m.data.caption) : undefined,
          durationSeconds: m.data.durationSeconds ? Number(m.data.durationSeconds) : 120,
        },
      } as unknown as StoryBlock);
    } else if (m.type === 'table') {
      const headers = String(m.data.headers || '')
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);
      const rows = String(m.data.rowsText || '')
        .split('\n')
        .map((r) => r.split(',').map((c) => c.trim()))
        .filter((r) => r.length > 0 && r[0]);
      blocks.push({
        id: `table_${m.id}`,
        blockType: 'table',
        sortOrder,
        data: {
          title: m.data.title ? String(m.data.title) : undefined,
          headers,
          rows,
          footer: m.data.footer ? String(m.data.footer) : undefined,
        },
      } as unknown as StoryBlock);
    } else if (m.type === 'callout') {
      blocks.push({
        id: `callout_${m.id}`,
        blockType: 'callout',
        sortOrder,
        data: {
          style: m.data.style || 'info',
          title: m.data.title ? String(m.data.title) : undefined,
          text: String(m.data.text || ''),
        },
      } as unknown as StoryBlock);
    } else if (m.type === 'statistic') {
      blocks.push({
        id: `stat_${m.id}`,
        blockType: 'statistic',
        sortOrder,
        data: {
          label: String(m.data.label || ''),
          value: String(m.data.value || ''),
          trend: m.data.trend || 'neutral',
          trendValue: m.data.trendValue ? String(m.data.trendValue) : undefined,
          context: m.data.context ? String(m.data.context) : undefined,
        },
      } as unknown as StoryBlock);
    }
  });

  return blocks;
}
