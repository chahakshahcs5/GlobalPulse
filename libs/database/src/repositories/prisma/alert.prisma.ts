import type { AlertRule, AlertTrigger } from '@ai-news/schemas';
import {
  AlertConditionsSchema,
  AlertScheduleSchema,
  AlertSeveritySchema,
  AlertRuleSchema,
} from '@ai-news/schemas';
import type {
  IAlertRepository,
  AlertRuleFilter,
  AlertTriggerFilter,
} from '../../interfaces/alert.repository';
import { MemoryAlertRepository } from '../memory/alert.memory';

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function optionalIso(value: unknown): string | undefined {
  return value ? iso(value) : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

interface ModelClient {
  findMany: (args?: Record<string, unknown>) => Promise<Row[]>;
  findFirst: (args: Record<string, unknown>) => Promise<Row | null>;
  create: (args: { data: Record<string, unknown> }) => Promise<Row>;
  update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<Row>;
  deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
}

export class PrismaAlertRepository implements IAlertRepository {
  private readonly fallback = new MemoryAlertRepository();

  constructor(private readonly prismaGetter: () => Record<string, unknown>) {}

  private get prisma(): Record<string, unknown> {
    return this.prismaGetter();
  }

  private client(name: string): ModelClient | undefined {
    return this.prisma[name] as ModelClient | undefined;
  }

  private mapRule(row: Row): AlertRule {
    const parsed = AlertRuleSchema.safeParse({
      id: row.id,
      organizationId: row.organizationId,
      userId: (row.userId as string | null) ?? undefined,
      scope: (row.scope as AlertRule['scope']) ?? 'organization',
      name: row.name,
      description: row.description ?? undefined,
      enabled: row.enabled,
      conditions: row.conditions,
      channels: stringArray(row.channels),
      schedule: row.schedule ?? undefined,
      cooldownMinutes: row.cooldownMinutes,
      createdBy: row.createdBy,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
      lastTriggeredAt: optionalIso(row.lastTriggeredAt),
    });
    if (parsed.success) return parsed.data;

    return {
      id: String(row.id),
      organizationId: String(row.organizationId),
      userId: (row.userId as string | null) ?? undefined,
      scope: ((row.scope as AlertRule['scope']) ?? 'organization') as AlertRule['scope'],
      name: String(row.name),
      description: (row.description as string | null) ?? undefined,
      enabled: Boolean(row.enabled),
      conditions: AlertConditionsSchema.parse(row.conditions ?? {}),
      channels: (stringArray(row.channels) as AlertRule['channels']) || ['in_app'],
      schedule: row.schedule ? AlertScheduleSchema.parse(row.schedule) : undefined,
      cooldownMinutes: Number(row.cooldownMinutes ?? 15),
      createdBy: String(row.createdBy),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
      lastTriggeredAt: optionalIso(row.lastTriggeredAt),
    };
  }

  private mapTrigger(row: Row): AlertTrigger {
    return {
      id: String(row.id),
      organizationId: String(row.organizationId),
      ruleId: String(row.ruleId),
      resourceType: String(row.resourceType) as AlertTrigger['resourceType'],
      resourceId: String(row.resourceId),
      severity: AlertSeveritySchema.catch('MODERATE').parse(row.severity),
      message: String(row.message),
      matchedConditions: stringArray(row.matchedConditions),
      deliveredChannels: stringArray(row.deliveredChannels) as AlertTrigger['deliveredChannels'],
      createdAt: iso(row.createdAt),
    };
  }

  async listRules(orgId: string, filter?: AlertRuleFilter): Promise<AlertRule[]> {
    const client = this.client('alertRule');
    if (!client) return this.fallback.listRules(orgId, filter);
    try {
      const where: Record<string, unknown> = { organizationId: orgId };
      if (filter?.enabled !== undefined) where.enabled = filter.enabled;
      if (filter?.userId !== undefined) {
        // Organization-wide rules plus the reader's own personal rules.
        where.OR = [{ userId: null }, { userId: filter.userId }];
      }
      const rows = await client.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: filter?.limit,
      });
      return rows.map((r) => this.mapRule(r));
    } catch {
      return this.fallback.listRules(orgId, filter);
    }
  }

  async findRuleById(id: string, orgId: string): Promise<AlertRule | null> {
    const client = this.client('alertRule');
    if (!client) return this.fallback.findRuleById(id, orgId);
    try {
      const row = await client.findFirst({ where: { id, organizationId: orgId } });
      return row ? this.mapRule(row) : null;
    } catch {
      return this.fallback.findRuleById(id, orgId);
    }
  }

  async createRule(rule: AlertRule): Promise<AlertRule> {
    const client = this.client('alertRule');
    if (!client) return this.fallback.createRule(rule);
    try {
      const row = await client.create({
        data: {
          id: rule.id,
          organizationId: rule.organizationId,
          userId: rule.userId ?? null,
          scope: rule.scope,
          name: rule.name,
          description: rule.description,
          enabled: rule.enabled,
          conditions: rule.conditions,
          channels: rule.channels,
          schedule: rule.schedule,
          cooldownMinutes: rule.cooldownMinutes,
          createdBy: rule.createdBy,
          createdAt: new Date(rule.createdAt),
          updatedAt: new Date(rule.updatedAt),
          lastTriggeredAt: rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt) : null,
        },
      });
      return this.mapRule(row);
    } catch {
      return this.fallback.createRule(rule);
    }
  }

  async updateRule(rule: AlertRule): Promise<AlertRule> {
    const client = this.client('alertRule');
    if (!client) return this.fallback.updateRule(rule);
    try {
      const row = await client.update({
        where: { id: rule.id },
        data: {
          userId: rule.userId ?? null,
          scope: rule.scope,
          name: rule.name,
          description: rule.description,
          enabled: rule.enabled,
          conditions: rule.conditions,
          channels: rule.channels,
          schedule: rule.schedule,
          cooldownMinutes: rule.cooldownMinutes,
          updatedAt: new Date(rule.updatedAt),
          lastTriggeredAt: rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt) : null,
        },
      });
      return this.mapRule(row);
    } catch {
      return this.fallback.updateRule(rule);
    }
  }

  async deleteRule(id: string, orgId: string): Promise<boolean> {
    const client = this.client('alertRule');
    if (!client) return this.fallback.deleteRule(id, orgId);
    try {
      const result = await client.deleteMany({ where: { id, organizationId: orgId } });
      return result.count > 0;
    } catch {
      return this.fallback.deleteRule(id, orgId);
    }
  }

  async listTriggers(orgId: string, filter?: AlertTriggerFilter): Promise<AlertTrigger[]> {
    const client = this.client('alertTrigger');
    if (!client) return this.fallback.listTriggers(orgId, filter);
    try {
      const where: Record<string, unknown> = { organizationId: orgId };
      if (filter?.ruleId) where.ruleId = filter.ruleId;
      if (filter?.resourceType) where.resourceType = filter.resourceType;
      if (filter?.resourceId) where.resourceId = filter.resourceId;
      if (filter?.since) where.createdAt = { gte: new Date(filter.since) };
      const rows = await client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter?.limit,
      });
      return rows.map((r) => this.mapTrigger(r));
    } catch {
      return this.fallback.listTriggers(orgId, filter);
    }
  }

  async findTriggerById(id: string, orgId: string): Promise<AlertTrigger | null> {
    const client = this.client('alertTrigger');
    if (!client) return this.fallback.findTriggerById(id, orgId);
    try {
      const row = await client.findFirst({ where: { id, organizationId: orgId } });
      return row ? this.mapTrigger(row) : null;
    } catch {
      return this.fallback.findTriggerById(id, orgId);
    }
  }

  async createTrigger(trigger: AlertTrigger): Promise<AlertTrigger> {
    const client = this.client('alertTrigger');
    if (!client) return this.fallback.createTrigger(trigger);
    try {
      const row = await client.create({
        data: {
          id: trigger.id,
          organizationId: trigger.organizationId,
          ruleId: trigger.ruleId,
          resourceType: trigger.resourceType,
          resourceId: trigger.resourceId,
          severity: trigger.severity,
          message: trigger.message,
          matchedConditions: trigger.matchedConditions,
          deliveredChannels: trigger.deliveredChannels,
          createdAt: new Date(trigger.createdAt),
        },
      });
      return this.mapTrigger(row);
    } catch {
      return this.fallback.createTrigger(trigger);
    }
  }

  async latestTriggerForRule(ruleId: string, orgId: string): Promise<AlertTrigger | null> {
    const client = this.client('alertTrigger');
    if (!client) return this.fallback.latestTriggerForRule(ruleId, orgId);
    try {
      const rows = await client.findMany({
        where: { ruleId, organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      return rows[0] ? this.mapTrigger(rows[0]) : null;
    } catch {
      return this.fallback.latestTriggerForRule(ruleId, orgId);
    }
  }
}
