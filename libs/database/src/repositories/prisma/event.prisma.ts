import type { Event } from '@ai-news/schemas';
import type { IEventRepository } from '../../interfaces/event.repository';

export class PrismaEventRepository implements IEventRepository {
  constructor(private readonly prismaGetter: () => any) {}

  private get prisma() {
    return this.prismaGetter();
  }

  async findById(id: string, orgId?: string): Promise<Event | null> {
    const where: any = { id };
    if (orgId) where.organizationId = orgId;
    const row = await this.prisma.event.findFirst({ where });
    return row ? this.mapToDomain(row) : null;
  }

  async findBySlug(slug: string, orgId: string): Promise<Event | null> {
    const row = await this.prisma.event.findFirst({
      where: { slug, organizationId: orgId },
    });
    return row ? this.mapToDomain(row) : null;
  }

  async create(event: Event): Promise<Event> {
    const created = await this.prisma.event.create({
      data: {
        id: event.id,
        organizationId: event.organizationId,
        slug: event.slug,
        title: event.title,
        description: event.description,
        status: event.status as any,
        startedAt: event.startedAt ? new Date(event.startedAt) : null,
        endedAt: event.endedAt ? new Date(event.endedAt) : null,
      },
    });
    return this.mapToDomain(created);
  }

  async update(event: Event): Promise<Event> {
    const updated = await this.prisma.event.update({
      where: { id: event.id },
      data: {
        title: event.title,
        description: event.description,
        status: event.status as any,
        startedAt: event.startedAt ? new Date(event.startedAt) : null,
        endedAt: event.endedAt ? new Date(event.endedAt) : null,
      },
    });
    return this.mapToDomain(updated);
  }

  async list(orgId: string, limit: number = 50): Promise<Event[]> {
    const rows = await this.prisma.event.findMany({
      where: { organizationId: orgId },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r: any) => this.mapToDomain(r));
  }

  async search(query: string, orgId: string): Promise<Event[]> {
    const rows = await this.prisma.event.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
    return rows.map((r: any) => this.mapToDomain(r));
  }

  private mapToDomain(row: any): Event {
    return {
      id: row.id,
      organizationId: row.organizationId,
      slug: row.slug,
      title: row.title,
      description: row.description,
      status: row.status,
      startedAt: row.startedAt ? row.startedAt.toISOString() : undefined,
      endedAt: row.endedAt ? row.endedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
