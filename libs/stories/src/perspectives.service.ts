import type {
  StoryPerspective,
  CreateStoryPerspectiveInput,
  StoryPerspectiveStance,
  StoryPerspectiveStatus,
  CommentAuthorRole,
} from '@ai-news/schemas';
import { generateId, NotFoundError } from '@ai-news/shared';

export class PerspectivesService {
  private perspectives = new Map<string, StoryPerspective>();

  constructor() {
    this.seedDefaultPerspectives();
  }

  private seedDefaultPerspectives(): void {
    const seed1: StoryPerspective = {
      id: 'psp_seed_1',
      storyId: 'sty_cop30_accord',
      organizationId: 'org_default',
      authorId: 'usr_climate_expert',
      authorName: 'Dr. Elena Rostova',
      authorRole: 'subscriber',
      stance: 'analytical',
      targetParagraphQuote:
        'The member states agreed to establishing a $100B annual loss-and-damage resilience facility.',
      argument:
        'While the $100B headline figure is welcome, disbursement timelines are tied to complex multilateral validation gates that historically delay capital delivery by 18-24 months.',
      evidenceUrl: 'https://unfccc.int/process/the-paris-agreement',
      status: 'approved',
      upvotes: 42,
      createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    };

    const seed2: StoryPerspective = {
      id: 'psp_seed_2',
      storyId: 'sty_cop30_accord',
      organizationId: 'org_default',
      authorId: 'usr_policy_advocate',
      authorName: 'Marcus Vance',
      authorRole: 'reader',
      stance: 'dissenting',
      targetParagraphQuote:
        'Developing economies agreed to mandatory transition benchmarks starting 2028.',
      argument:
        'Imposing equal phase-out benchmarks on developing economies without upfront sovereign technology transfer puts undue strain on grid expansion goals in equatorial regions.',
      status: 'approved',
      upvotes: 29,
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    };

    const seed3: StoryPerspective = {
      id: 'psp_seed_3',
      storyId: 'sty_ai_summit_2026',
      organizationId: 'org_default',
      authorId: 'usr_ml_researcher',
      authorName: 'Kavita Patel',
      authorRole: 'journalist',
      stance: 'in_favor',
      targetParagraphQuote:
        'Mandatory disclosure of compute cluster clusters exceeding 10^26 FLOPs.',
      argument:
        'Threshold-based compute accounting represents the only technically auditable regulatory lever, as software weights can be copied while high-bandwidth physical interconnects cannot easily be concealed.',
      evidenceUrl: 'https://arxiv.org/abs/2401.compute-governance',
      status: 'approved',
      upvotes: 56,
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    };

    this.perspectives.set(seed1.id, seed1);
    this.perspectives.set(seed2.id, seed2);
    this.perspectives.set(seed3.id, seed3);
  }

  async submitPerspective(
    storyId: string,
    input: CreateStoryPerspectiveInput,
    author: { id: string; name: string; role?: CommentAuthorRole },
    organizationId: string
  ): Promise<StoryPerspective> {
    const id = generateId('psp');
    const now = new Date().toISOString();

    const perspective: StoryPerspective = {
      id,
      storyId,
      organizationId,
      authorId: author.id,
      authorName: input.authorName || author.name,
      authorRole: author.role || 'reader',
      stance: input.stance,
      targetParagraphQuote: input.targetParagraphQuote,
      argument: input.argument,
      evidenceUrl: input.evidenceUrl || undefined,
      status: 'approved', // default approved in mock/sandbox environment
      upvotes: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.perspectives.set(id, perspective);
    return perspective;
  }

  async listPerspectives(
    storyId: string,
    options?: {
      stance?: StoryPerspectiveStance;
      status?: StoryPerspectiveStatus;
      limit?: number;
    }
  ): Promise<StoryPerspective[]> {
    const list: StoryPerspective[] = [];
    for (const p of this.perspectives.values()) {
      if (p.storyId !== storyId && storyId !== '*') continue;
      if (options?.stance && p.stance !== options.stance) continue;
      if (options?.status && p.status !== options.status) continue;
      list.push({ ...p });
    }

    // Sort by upvotes desc, then recency
    list.sort(
      (a, b) =>
        b.upvotes - a.upvotes || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list.slice(0, options?.limit || 50);
  }

  async getPerspectiveById(id: string): Promise<StoryPerspective | null> {
    const found = this.perspectives.get(id);
    return found ? { ...found } : null;
  }

  async moderatePerspective(
    perspectiveId: string,
    status: StoryPerspectiveStatus,
    reason?: string
  ): Promise<StoryPerspective> {
    const p = this.perspectives.get(perspectiveId);
    if (!p) {
      throw new NotFoundError('StoryPerspective', perspectiveId);
    }

    p.status = status;
    p.moderationReason = reason;
    p.updatedAt = new Date().toISOString();
    return { ...p };
  }

  async upvotePerspective(perspectiveId: string): Promise<StoryPerspective> {
    const p = this.perspectives.get(perspectiveId);
    if (!p) {
      throw new NotFoundError('StoryPerspective', perspectiveId);
    }

    p.upvotes += 1;
    p.updatedAt = new Date().toISOString();
    return { ...p };
  }
}
