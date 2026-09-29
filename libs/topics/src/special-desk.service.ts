import type { SpecialDesk, CreateSpecialDeskInput } from '@ai-news/schemas';
import { slugify } from '@ai-news/shared';

export class SpecialDeskService {
  private desks = new Map<string, SpecialDesk>();

  constructor() {
    this.seedDefaultDesks();
  }

  private seedDefaultDesks(): void {
    const cop30: SpecialDesk = {
      id: 'desk_cop30_summit',
      slug: 'cop30-climate-summit',
      name: 'COP30 Global Climate Summit',
      description:
        'Continuous dispatches, decarbonization treaty negotiations, and climate finance commitments live from the pavilion.',
      themeColor: '#10b981',
      bannerImageUrl:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
      pinnedStoryIds: [],
      liveTickerSymbol: 'CARBON-SPOT',
      isLive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const aiFrontier: SpecialDesk = {
      id: 'desk_frontier_ai',
      slug: 'frontier-ai-governance',
      name: 'Frontier AI & Compute Governance',
      description:
        'Real-time coverage on foundation model safety standards, sovereign compute initiatives, and export policies.',
      themeColor: '#6366f1',
      bannerImageUrl:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
      pinnedStoryIds: [],
      liveTickerSymbol: 'COMPUTE-FLOPS',
      isLive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.desks.set(cop30.id, cop30);
    this.desks.set(cop30.slug, cop30);
    this.desks.set(aiFrontier.id, aiFrontier);
    this.desks.set(aiFrontier.slug, aiFrontier);
  }

  async createDesk(input: CreateSpecialDeskInput): Promise<SpecialDesk> {
    const slug = input.slug || slugify(input.name);
    const id = `desk_${slug.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    const desk: SpecialDesk = {
      id,
      slug,
      name: input.name,
      description: input.description || '',
      themeColor: input.themeColor || '#3b82f6',
      bannerImageUrl: input.bannerImageUrl,
      pinnedStoryIds: input.pinnedStoryIds || [],
      liveTickerSymbol: input.liveTickerSymbol,
      activeUntil: input.activeUntil,
      isLive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.desks.set(id, desk);
    this.desks.set(slug, desk);
    return desk;
  }

  async getDesk(slugOrId: string): Promise<SpecialDesk | null> {
    return this.desks.get(slugOrId) || null;
  }

  async listDesks(onlyActive = true): Promise<SpecialDesk[]> {
    const unique = new Map<string, SpecialDesk>();
    for (const desk of this.desks.values()) {
      if (onlyActive && !desk.isLive) continue;
      unique.set(desk.id, desk);
    }
    return Array.from(unique.values());
  }

  async pinStory(deskId: string, storyId: string): Promise<SpecialDesk> {
    const desk = await this.getDesk(deskId);
    if (!desk) throw new Error(`Desk ${deskId} not found`);
    if (!desk.pinnedStoryIds.includes(storyId)) {
      desk.pinnedStoryIds.push(storyId);
      desk.updatedAt = new Date().toISOString();
      this.desks.set(desk.id, desk);
      this.desks.set(desk.slug, desk);
    }
    return desk;
  }
}

export const specialDeskService = new SpecialDeskService();
