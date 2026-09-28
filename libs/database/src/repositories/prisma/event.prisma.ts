import type { Event } from '@ai-news/schemas';
import type { IEventRepository } from '../../interfaces/event.repository';

interface PrismaEventRow {
  id: string;
  organizationId: string;
  slug?: string | null;
  title: string;
  summary: string;
  status: string;
  occurredAt: Date;
  location?: string | null;
  coordinates: number[];
  topicIds: string[];
  entityIds: string[];
  storyIds?: string[];
  sourceIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaEventRepository implements IEventRepository {
  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private get eventClient(): {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaEventRow | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<PrismaEventRow>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<PrismaEventRow>;
    findMany: (args: {
      where: Record<string, unknown>;
      take?: number;
      orderBy?: Record<string, unknown>;
    }) => Promise<PrismaEventRow[]>;
  } {
    return this.prisma.event as {
      findFirst: (args: { where: Record<string, unknown> }) => Promise<PrismaEventRow | null>;
      create: (args: { data: Record<string, unknown> }) => Promise<PrismaEventRow>;
      update: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => Promise<PrismaEventRow>;
      findMany: (args: {
        where: Record<string, unknown>;
        take?: number;
        orderBy?: Record<string, unknown>;
      }) => Promise<PrismaEventRow[]>;
    };
  }

  async findById(id: string, orgId?: string): Promise<Event | null> {
    const where: Record<string, unknown> = { id };
    if (orgId) where.organizationId = orgId;
    const row = await this.eventClient.findFirst({ where });
    return row ? this.mapToDomain(row) : null;
  }

  async findBySlug(slug: string, orgId: string): Promise<Event | null> {
    const row = await this.eventClient.findFirst({
      where: { slug, organizationId: orgId },
    });
    return row ? this.mapToDomain(row) : null;
  }

  async create(event: Event): Promise<Event> {
    const created = await this.eventClient.create({
      data: {
        id: event.id,
        organizationId: event.organizationId,
        slug: event.slug,
        title: event.title,
        summary: event.summary,
        status: event.status,
        occurredAt: new Date(event.occurredAt),
        location: event.location,
        coordinates: event.coordinates || [],
        topicIds: event.topicIds || [],
        entityIds: event.entityIds || [],
      },
    });
    return this.mapToDomain(created);
  }

  async update(event: Event): Promise<Event> {
    const updated = await this.eventClient.update({
      where: { id: event.id },
      data: {
        title: event.title,
        summary: event.summary,
        status: event.status,
        occurredAt: new Date(event.occurredAt),
        location: event.location,
        coordinates: event.coordinates || [],
        topicIds: event.topicIds || [],
        entityIds: event.entityIds || [],
      },
    });
    return this.mapToDomain(updated);
  }

  async list(orgId: string, limit: number = 50): Promise<Event[]> {
    const rows = await this.eventClient.findMany({
      where: { organizationId: orgId },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.mapToDomain(r));
  }

  async search(query: string, orgId: string): Promise<Event[]> {
    const rows = await this.eventClient.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
    return rows.map((r) => this.mapToDomain(r));
  }

  private mapToDomain(row: PrismaEventRow): Event {
    return {
      id: row.id,
      organizationId: row.organizationId,
      slug: row.slug || undefined,
      title: row.title,
      summary: row.summary,
      status: row.status as Event['status'],
      occurredAt: row.occurredAt.toISOString(),
      location: row.location || undefined,
      coordinates:
        row.coordinates && row.coordinates.length === 2
          ? [row.coordinates[0], row.coordinates[1]]
          : undefined,
      topicIds: row.topicIds || [],
      entityIds: row.entityIds || [],
      storyIds: row.storyIds || [],
      sourceIds: row.sourceIds || [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
