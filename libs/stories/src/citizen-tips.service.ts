import type {
  CitizenTip,
  SubmitCitizenTipInput,
  CitizenTipStatus,
  CitizenTipUrgency,
} from '@ai-news/schemas';
import { generateId, NotFoundError } from '@ai-news/shared';

export class CitizenTipsService {
  private tips = new Map<string, CitizenTip>();

  constructor() {
    this.seedDefaultTips();
  }

  private seedDefaultTips(): void {
    const seed1: CitizenTip = {
      id: 'tip_seed_1',
      organizationId: 'org_default',
      headline: 'Undisclosed Autonomous High-Altitude Drone Flight Corridor Tests',
      details:
        'Internal FAA testing waiver documents show commercial defense contractors operating sub-orbital swarm drone telemetry beyond civilian transponder corridors in the Mojave desert sector.',
      category: 'defense',
      urgency: 'elevated',
      anonymityMode: 'full_anonymous',
      verificationChecksum:
        'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      contactAlias: 'whistleblower_flightops',
      attachments: [
        {
          filename: 'flight_telemetry_corridor_log.csv',
          mimeType: 'text/csv',
          sizeBytes: 42100,
          checksumSha256: '9f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9011',
        },
      ],
      status: 'under_review',
      editorialNotes: 'Corroborating flight beacon logs against OpenSky ADS-B history.',
      createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    };

    const seed2: CitizenTip = {
      id: 'tip_seed_2',
      organizationId: 'org_default',
      headline: 'Rare Earth Dysprosium Smuggling Network via Intermediate Shipping Hubs',
      details:
        'Customs manifest records indicate re-badged rare-earth neodymium and dysprosium concentrates transiting through free-trade ports without required origin declarations.',
      category: 'global_trade',
      urgency: 'breaking',
      anonymityMode: 'confidential_source',
      verificationChecksum:
        'sha256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      contactAlias: 'port_customs_liaison',
      attachments: [],
      status: 'verified_developing',
      editorialNotes:
        'Senior maritime investigative reporter assigned. Cross-checking bill of ladings.',
      createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    };

    this.tips.set(seed1.id, seed1);
    this.tips.set(seed2.id, seed2);
  }

  async submitTip(
    input: SubmitCitizenTipInput,
    organizationId: string
  ): Promise<{ tip: CitizenTip; receiptToken: string }> {
    const id = generateId('tip');
    const now = new Date().toISOString();
    const receiptToken = `rcpt_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;

    const tip: CitizenTip = {
      id,
      organizationId,
      headline: input.headline,
      details: input.details,
      category: input.category || 'general',
      urgency: input.urgency || 'routine',
      anonymityMode: input.anonymityMode || 'full_anonymous',
      verificationChecksum: input.verificationChecksum,
      contactAlias: input.contactAlias,
      attachments: input.attachments || [],
      status: 'received',
      createdAt: now,
      updatedAt: now,
    };

    this.tips.set(id, tip);
    return { tip, receiptToken };
  }

  async listTips(
    organizationId: string,
    filter?: {
      status?: CitizenTipStatus;
      urgency?: CitizenTipUrgency;
      category?: string;
      limit?: number;
    }
  ): Promise<CitizenTip[]> {
    const list: CitizenTip[] = [];
    for (const t of this.tips.values()) {
      if (t.organizationId !== organizationId && organizationId !== '*') continue;
      if (filter?.status && t.status !== filter.status) continue;
      if (filter?.urgency && t.urgency !== filter.urgency) continue;
      if (filter?.category && t.category.toLowerCase() !== filter.category.toLowerCase()) continue;
      list.push({ ...t });
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.slice(0, filter?.limit || 50);
  }

  async getTipById(id: string, organizationId?: string): Promise<CitizenTip | null> {
    const tip = this.tips.get(id);
    if (!tip) return null;
    if (organizationId && organizationId !== '*' && tip.organizationId !== organizationId) {
      return null;
    }
    return { ...tip };
  }

  async getTipByChecksum(checksum: string, organizationId?: string): Promise<CitizenTip | null> {
    for (const tip of this.tips.values()) {
      if (tip.verificationChecksum === checksum) {
        if (organizationId && organizationId !== '*' && tip.organizationId !== organizationId) {
          continue;
        }
        return { ...tip };
      }
    }
    return null;
  }

  async reviewTip(
    id: string,
    status: CitizenTipStatus,
    editorialNotes?: string,
    organizationId?: string
  ): Promise<CitizenTip> {
    const tip = await this.getTipById(id, organizationId);
    if (!tip) {
      throw new NotFoundError('CitizenTip', id);
    }

    tip.status = status;
    if (editorialNotes) tip.editorialNotes = editorialNotes;
    tip.updatedAt = new Date().toISOString();

    this.tips.set(id, tip);
    return { ...tip };
  }
}
