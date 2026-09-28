import { randomUUID } from 'crypto';
import type { DatabaseService } from '@ai-news/database';
import type {
  ContentTemplate,
  InstantiateTemplateInput,
  Story,
  StoryBlock,
  ClientType,
  CreatedVia,
} from '@ai-news/schemas';
import { computeStoryReadingMetrics } from '@ai-news/shared';

export const CANONICAL_CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'breaking_news_alert',
    name: 'Breaking News Alert',
    articleType: 'breaking_news',
    description:
      'Rapid-response template with priority headline, key facts bullet summary, lead paragraph, official quotes, and hero imagery.',
    suggestedCategory: 'World',
    promptGuidance:
      'Generate punchy lead paragraphs with 3 key takeaway bullets and official spokespersons quotes.',
    defaultBlocks: [
      {
        id: 'blk_breaking_summary',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Key Developments at a Glance',
          bulletPoints: [
            'Immediate breaking development confirmed by official spokespersons.',
            'Key impact assessments and initial emergency directives active.',
            'Next official briefing scheduled shortly.',
          ],
          sentiment: 'critical',
        },
      },
      {
        id: 'blk_breaking_lead',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'Developing story: initial reports confirm significant developments unfolding rapidly. Verification efforts are actively ongoing across multiple regional monitoring stations.',
          format: 'markdown',
        },
      },
      {
        id: 'blk_breaking_quote',
        blockType: 'quote',
        sortOrder: 2,
        data: {
          quote:
            'We are closely assessing the situation in real time and taking all necessary precautionary measures.',
          attribution: 'Official Incident Response Lead',
          title: 'Emergency Directorate',
        },
      },
    ],
  },
  {
    id: 'investigative_deep_dive',
    name: 'In-Depth Investigation',
    articleType: 'investigation',
    description:
      'Multi-source investigative dossier with chronological timeline, data visualizations/statistics, source citations, and analytical deep dive.',
    suggestedCategory: 'Business',
    promptGuidance:
      'Synthesize whistleblower documents, verifiable statistical trends, and a step-by-step chronological audit.',
    defaultBlocks: [
      {
        id: 'blk_invest_summary',
        blockType: 'summary',
        sortOrder: 0,
        data: {
          headline: 'Executive Investigation Findings',
          bulletPoints: [
            'Documentary evidence reveals systematic operational deviations over 18 months.',
            'Financial and logistical audit traces discrepancies totaling multiple millions.',
            'Multiple regulatory oversight bodies initiate independent inquiries.',
          ],
          sentiment: 'critical',
        },
      },
      {
        id: 'blk_invest_body',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'A six-month cross-border investigation combining internal registries, whistleblower testimony, and public records reveals deep systemic patterns.',
          format: 'markdown',
        },
      },
      {
        id: 'blk_invest_timeline',
        blockType: 'timeline',
        sortOrder: 2,
        data: {
          title: 'Chronology of Documented Events',
          items: [
            {
              date: 'Month 1',
              headline: 'Initial Discrepancies Noted',
              body: 'Internal audit flagged non-standard balance transfers.',
            },
            {
              date: 'Month 6',
              headline: 'Whistleblower Submission',
              body: 'Regulatory compliance officers received anonymous dossier.',
            },
            {
              date: 'Present',
              headline: 'Formal Inquest Opened',
              body: 'External prosecutors request full custodial data retention.',
            },
          ],
        },
      },
      {
        id: 'blk_invest_stat',
        blockType: 'statistic',
        sortOrder: 3,
        data: {
          value: '84%',
          label: 'Audit Discrepancy Rate',
          trend: 'up',
          trendValue: '+42% YoY',
          sourceAttribution: 'Forensic Accounting Review',
        },
      },
    ],
  },
  {
    id: 'editorial_opinion',
    name: 'Editorial & Opinion',
    articleType: 'opinion',
    description:
      'Thought-leadership essay with author perspective, thematic pull quotes, nuanced counter-arguments, and key conclusions.',
    suggestedCategory: 'Technology',
    promptGuidance:
      'Articulate a persuasive perspective supported by policy tradeoffs and ethical implications.',
    defaultBlocks: [
      {
        id: 'blk_opinion_callout',
        blockType: 'callout',
        sortOrder: 0,
        data: {
          style: 'tip',
          title: 'Editorial Perspective',
          text: 'The accelerating transformation demands clear moral accountability before market lock-in becomes irreversible.',
        },
      },
      {
        id: 'blk_opinion_lead',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'As public policy struggles to catch up with rapid technological inflection points, the debate must transcend corporate press releases to interrogate structural impacts on citizens.',
          format: 'markdown',
        },
      },
      {
        id: 'blk_opinion_comparison',
        blockType: 'comparison',
        sortOrder: 2,
        data: {
          title: 'Core Tradeoffs in Perspective',
          subjectA: {
            name: 'Proponents Argue',
            points: [
              'Rapid innovation cycle',
              'Decentralized efficiency gains',
              'Competitive global agility',
            ],
          },
          subjectB: {
            name: 'Critics Caution',
            points: [
              'Concentration of power',
              'Erosion of public transparency',
              'Labor displacement vulnerabilities',
            ],
          },
        },
      },
    ],
  },
  {
    id: 'liveblog_event',
    name: 'Liveblog Event Stream',
    articleType: 'liveblog',
    description:
      'Real-time dynamic coverage with pinned briefing summary, key events timeline, and live dispatch stream.',
    suggestedCategory: 'World',
    promptGuidance:
      'Structure as an active live updating event with pinned briefing summary and real-time dispatches.',
    defaultBlocks: [
      {
        id: 'blk_live_callout',
        blockType: 'callout',
        sortOrder: 0,
        data: {
          style: 'warning',
          title: 'LIVE COVERAGE ACTIVE',
          text: 'This page updates automatically with real-time field dispatches and key event alerts.',
        },
      },
      {
        id: 'blk_live_summary',
        blockType: 'summary',
        sortOrder: 1,
        data: {
          headline: 'What You Need to Know Right Now',
          bulletPoints: [
            'Live updates streaming from on-site correspondents.',
            'Key developments pinned chronologically below.',
            'Press conferences scheduled throughout the afternoon.',
          ],
          sentiment: 'neutral',
        },
      },
    ],
  },
  {
    id: 'fact_check_report',
    name: 'Fact-Check Report',
    articleType: 'fact_check',
    description:
      'Claim verification investigation with claim statement, speaker/source, verdict meter, and evidence breakdown.',
    suggestedCategory: 'Politics',
    promptGuidance:
      'State verbatim claim, identify claimant, assess verifiable facts against empirical data, and issue an objective verdict.',
    defaultBlocks: [
      {
        id: 'blk_fact_callout',
        blockType: 'callout',
        sortOrder: 0,
        data: {
          style: 'warning',
          title: 'CLAIM VERDICT: MISLEADING',
          text: 'While the base figure cited exists in historic census records, its modern context and comparative metrics were omitted, producing an erroneous conclusion.',
        },
      },
      {
        id: 'blk_fact_summary',
        blockType: 'summary',
        sortOrder: 1,
        data: {
          headline: 'The Facts at a Glance',
          bulletPoints: [
            'Claim: Widely circulated viral statement regarding economic subsidies.',
            'Check: National statistical audit databases contradict the stated percentage.',
            'Verdict: Misleading — cherry-picked timeframe omitting primary expenditures.',
          ],
          sentiment: 'cautious',
        },
      },
      {
        id: 'blk_fact_lead',
        blockType: 'paragraph',
        sortOrder: 2,
        data: {
          text: 'Following high-profile political debates, claims regarding targeted industrial allocations spread rapidly across social channels. Our verification desk reviewed public budget transcripts and independent economic analyses.',
          format: 'markdown',
        },
      },
    ],
  },
];

export class TemplateService {
  constructor(private readonly db: DatabaseService) {}

  listTemplates(): ContentTemplate[] {
    return CANONICAL_CONTENT_TEMPLATES;
  }

  getTemplate(id: string): ContentTemplate | null {
    return CANONICAL_CONTENT_TEMPLATES.find((t) => t.id === id) || null;
  }

  async instantiateStory(
    input: InstantiateTemplateInput,
    context: {
      organizationId: string;
      authorId: string;
      clientType: ClientType;
      createdVia: CreatedVia;
    }
  ): Promise<Story> {
    const template = this.getTemplate(input.templateId);
    if (!template) {
      throw new Error(`Content template '${input.templateId}' was not found`);
    }

    const now = new Date().toISOString();
    const storyId = `sty_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Clone template default blocks with unique IDs
    const blocks: StoryBlock[] = template.defaultBlocks.map((b, idx) => ({
      ...b,
      id: `blk_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      sortOrder: idx,
    }));

    // Compute metrics
    const metrics = computeStoryReadingMetrics({
      title: input.title,
      summary: input.summary,
      blocks,
    });

    const story: Story = {
      id: storyId,
      organizationId: context.organizationId,
      slug: `${slug}-${storyId.slice(-6)}`,
      title: input.title,
      summary: input.summary,
      status: 'DRAFT',
      articleType: template.articleType,
      currentVersionNumber: 1,
      topicIds: input.topicIds || [],
      entityIds: input.entityIds || [],
      sourceIds: [],
      blocks,
      heroImageUrl: input.heroImageUrl,
      createdVia: context.createdVia,
      createdByClient: context.clientType,
      authorId: context.authorId,
      wordCount: metrics.wordCount,
      readingTimeMinutes: metrics.readingTimeMinutes,
      createdAt: now,
      updatedAt: now,
    };

    return this.db.stories.create(story);
  }
}
