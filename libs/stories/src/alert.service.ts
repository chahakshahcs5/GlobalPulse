import type {
  AlertRule,
  AlertTrigger,
  AlertConditions,
  AlertChannel,
  AlertSeverity,
  CreateAlertRuleInput,
  UpdateAlertRuleInput,
  EvaluateAlertsResult,
} from '@ai-news/schemas';
import {
  CreateAlertRuleInputSchema,
  UpdateAlertRuleInputSchema,
  severityRank,
} from '@ai-news/schemas';
import type { DatabaseService } from '@ai-news/database';
import { generateId, NotFoundError } from '@ai-news/shared';
import type { IntelligenceContext } from './intelligence.service';
import { DeliveryService } from './delivery.service';

type AlertResourceType = 'EVENT' | 'STORY' | 'INGESTION_ITEM';

interface AlertResource {
  resourceType: AlertResourceType;
  id: string;
  title: string;
  summary: string;
  entityIds: string[];
  topicIds: string[];
  eventTypes: string[];
  regions: string[];
  articleType?: string;
  severity: string;
  magnitude?: number;
  text: string;
}

function matchAny(required: string[], actual: string[]): boolean {
  if (required.length === 0) return true;
  const set = new Set(actual);
  return required.some((value) => set.has(value));
}

function matchesConditions(
  conditions: AlertConditions,
  resource: AlertResource
): { matched: boolean; matchedConditions: string[] } {
  const matched: string[] = [];

  if (!matchAny(conditions.entityIds, resource.entityIds))
    return { matched: false, matchedConditions: [] };
  if (conditions.entityIds.length > 0) matched.push('entityIds');

  if (!matchAny(conditions.topicIds, resource.topicIds))
    return { matched: false, matchedConditions: [] };
  if (conditions.topicIds.length > 0) matched.push('topicIds');

  if (!matchAny(conditions.eventTypes, resource.eventTypes)) {
    return { matched: false, matchedConditions: [] };
  }
  if (conditions.eventTypes.length > 0) matched.push('eventTypes');

  if (!matchAny(conditions.articleTypes, resource.articleType ? [resource.articleType] : [])) {
    return { matched: false, matchedConditions: [] };
  }
  if (conditions.articleTypes.length > 0) matched.push('articleTypes');

  if (conditions.regions.length > 0) {
    const lower = resource.regions.map((r) => r.toLowerCase());
    const regionMatch = conditions.regions.some((region) =>
      lower.some((candidate) => candidate.includes(region.toLowerCase()))
    );
    if (!regionMatch) return { matched: false, matchedConditions: [] };
    matched.push('regions');
  }

  if (conditions.keywords.length > 0) {
    const haystack = resource.text.toLowerCase();
    const keywordMatch = conditions.keywords.some((keyword) =>
      haystack.includes(keyword.toLowerCase())
    );
    if (!keywordMatch) return { matched: false, matchedConditions: [] };
    matched.push('keywords');
  }

  if (conditions.minSeverity) {
    if (severityRank(resource.severity) < severityRank(conditions.minSeverity)) {
      return { matched: false, matchedConditions: [] };
    }
    matched.push('minSeverity');
  }

  if (conditions.minMagnitude !== undefined) {
    if (resource.magnitude === undefined || resource.magnitude < conditions.minMagnitude) {
      return { matched: false, matchedConditions: [] };
    }
    matched.push('minMagnitude');
  }

  return { matched: true, matchedConditions: matched };
}

/**
 * Evaluates alert rules against events, stories, and ingestion items.
 *
 * The service is deterministic and provider-neutral: rules are plain data, and
 * every trigger records why it fired. Delivery is pluggable; in-app delivery is
 * implemented with the existing editorial notification store.
 */
export class AlertService {
  private readonly delivery: DeliveryService;

  constructor(private readonly db: DatabaseService) {
    this.delivery = new DeliveryService(db);
  }

  async listRules(orgId: string, enabled?: boolean, userId?: string): Promise<AlertRule[]> {
    return this.db.alerts.listRules(orgId, { enabled, userId });
  }

  async getRule(id: string, orgId: string): Promise<AlertRule> {
    const rule = await this.db.alerts.findRuleById(id, orgId);
    if (!rule) throw new NotFoundError('AlertRule', id);
    return rule;
  }

  async createRule(input: CreateAlertRuleInput, ctx: IntelligenceContext): Promise<AlertRule> {
    const validated = CreateAlertRuleInputSchema.parse(input);
    const now = new Date().toISOString();
    // A `user` scope creates a personal rule owned by the caller; anything else
    // is an organization-wide rule for the whole newsroom.
    const isPersonal = validated.scope === 'user';
    const rule: AlertRule = {
      id: generateId('alr'),
      organizationId: ctx.organizationId,
      userId: isPersonal ? ctx.actorId : undefined,
      scope: isPersonal ? 'user' : 'organization',
      name: validated.name,
      description: validated.description,
      enabled: validated.enabled,
      conditions: validated.conditions,
      channels: validated.channels,
      schedule: validated.schedule,
      cooldownMinutes: validated.cooldownMinutes,
      createdBy: ctx.actorId,
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.db.alerts.createRule(rule);
    await this.audit(ctx, 'create_alert_rule', created.id, { name: created.name });
    return created;
  }

  async updateRule(
    id: string,
    input: UpdateAlertRuleInput,
    ctx: IntelligenceContext
  ): Promise<AlertRule> {
    const existing = await this.getRule(id, ctx.organizationId);
    const validated = UpdateAlertRuleInputSchema.parse(input);
    // Changing the scope moves the rule between the reader and the newsroom.
    const scope = validated.scope ?? existing.scope;
    const userId = scope === 'user' ? (existing.userId ?? ctx.actorId) : undefined;
    const updated: AlertRule = {
      ...existing,
      scope,
      userId,
      name: validated.name ?? existing.name,
      description: validated.description ?? existing.description,
      enabled: validated.enabled ?? existing.enabled,
      conditions: validated.conditions ?? existing.conditions,
      channels: validated.channels ?? existing.channels,
      schedule: validated.schedule ?? existing.schedule,
      cooldownMinutes: validated.cooldownMinutes ?? existing.cooldownMinutes,
      updatedAt: new Date().toISOString(),
    };
    const saved = await this.db.alerts.updateRule(updated);
    await this.audit(ctx, 'update_alert_rule', saved.id, { name: saved.name });
    return saved;
  }

  async deleteRule(id: string, ctx: IntelligenceContext): Promise<void> {
    await this.getRule(id, ctx.organizationId);
    await this.db.alerts.deleteRule(id, ctx.organizationId);
    await this.audit(ctx, 'delete_alert_rule', id);
  }

  async listTriggers(orgId: string, limit = 50): Promise<AlertTrigger[]> {
    return this.db.alerts.listTriggers(orgId, { limit });
  }

  async evaluate(
    resourceType: AlertResourceType,
    resourceId: string,
    ctx: IntelligenceContext
  ): Promise<EvaluateAlertsResult> {
    const resource = await this.loadResource(resourceType, resourceId, ctx.organizationId);
    // Organization-wide rules plus the caller's own personal rules.
    const rules = await this.db.alerts.listRules(ctx.organizationId, {
      enabled: true,
      userId: ctx.actorId,
    });
    const triggers: AlertTrigger[] = [];
    const skipped: Array<{ ruleId: string; reason: string }> = [];

    for (const rule of rules) {
      // A personal rule only fires for its owner.
      if (rule.userId && rule.userId !== ctx.actorId) continue;

      const { matched, matchedConditions } = matchesConditions(rule.conditions, resource);
      if (!matched) continue;

      if (rule.cooldownMinutes > 0) {
        const latest = await this.db.alerts.latestTriggerForRule(rule.id, ctx.organizationId);
        if (latest) {
          const elapsedMs = Date.now() - new Date(latest.createdAt).getTime();
          if (elapsedMs < rule.cooldownMinutes * 60_000) {
            skipped.push({ ruleId: rule.id, reason: 'cooldown' });
            continue;
          }
        }
      }

      const now = new Date().toISOString();
      const delivered = await this.deliver(rule, resource, ctx);
      const trigger: AlertTrigger = {
        id: generateId('atg'),
        organizationId: ctx.organizationId,
        ruleId: rule.id,
        resourceType,
        resourceId,
        severity: this.normalizeSeverity(resource.severity),
        message: `${rule.name}: ${resource.title}`,
        matchedConditions,
        deliveredChannels: delivered,
        createdAt: now,
      };
      const saved = await this.db.alerts.createTrigger(trigger);
      triggers.push(saved);

      rule.lastTriggeredAt = now;
      rule.updatedAt = now;
      await this.db.alerts.updateRule(rule);
    }

    return {
      resourceType,
      resourceId,
      evaluatedRules: rules.length,
      triggers,
      skipped,
    };
  }

  private normalizeSeverity(value: string): AlertSeverity {
    const rank = severityRank(value);
    if (rank >= 4) return 'CRITICAL';
    if (rank >= 3) return 'MAJOR';
    if (rank >= 2) return 'MODERATE';
    return 'LOW';
  }

  /**
   * Delivers the alert over the channels the rule asked for.
   *
   * Every channel is a real transport: `in_app` persists a notification,
   * `push` publishes on the recipient's realtime channel, `webhook` posts an
   * HMAC-signed payload to the registered endpoints, and `email` uses the
   * deployment's mail sender. Only the channels that actually delivered are
   * reported back.
   */
  private async deliver(
    rule: AlertRule,
    resource: AlertResource,
    ctx: IntelligenceContext
  ): Promise<AlertChannel[]> {
    const severity = this.normalizeSeverity(resource.severity);
    const recipient = rule.userId ?? ctx.actorId;
    // An organization-wide rule is a newsroom alert (in-app + webhook + email).
    // A personal rule is a reader alert, so it is also pushed to its owner.
    const channels = rule.userId
      ? rule.channels
      : rule.channels.filter((channel) => channel !== 'push');

    let email: string | undefined;
    if (channels.includes('email')) {
      try {
        const user = await this.db.users.findById(recipient, ctx.organizationId);
        email = user?.email;
      } catch {
        email = undefined;
      }
    }

    const outcomes = await this.delivery.deliverAll(
      channels,
      {
        title: rule.name,
        message: resource.title,
        storyId: resource.resourceType === 'STORY' ? resource.id : undefined,
        severity: severity === 'CRITICAL' ? 'urgent' : severity === 'LOW' ? 'info' : 'warning',
        eventType: 'editorial_alert',
        data: {
          ruleId: rule.id,
          resourceType: resource.resourceType,
          resourceId: resource.id,
          matchedConditions: resource.title,
        },
      },
      { userId: recipient, email },
      {
        organizationId: ctx.organizationId,
        actorId: ctx.actorId,
        clientType: ctx.clientType,
      }
    );

    return outcomes
      .filter((outcome) => outcome.delivered)
      .map((outcome) => outcome.channel as AlertChannel);
  }

  private async loadResource(
    resourceType: AlertResourceType,
    resourceId: string,
    orgId: string
  ): Promise<AlertResource> {
    if (resourceType === 'EVENT') {
      const event = await this.db.events.findById(resourceId, orgId);
      if (!event) throw new NotFoundError('Event', resourceId);
      const metadata = (event.metadata ?? {}) as Record<string, unknown>;
      return {
        resourceType,
        id: event.id,
        title: event.title,
        summary: event.summary,
        entityIds: event.entityIds,
        topicIds: event.topicIds,
        eventTypes: [event.category, String(metadata.eventType ?? '')].filter(Boolean) as string[],
        regions: [event.location, ...((metadata.regions as string[]) ?? [])].filter(
          (v): v is string => Boolean(v)
        ),
        severity: event.severity ?? 'MODERATE',
        magnitude: typeof metadata.magnitude === 'number' ? metadata.magnitude : undefined,
        text: `${event.title} ${event.summary} ${JSON.stringify(metadata)}`,
      };
    }

    if (resourceType === 'STORY') {
      const story = await this.db.stories.findById(resourceId, orgId);
      if (!story) throw new NotFoundError('Story', resourceId);
      return {
        resourceType,
        id: story.id,
        title: story.title,
        summary: story.summary,
        entityIds: story.entityIds,
        topicIds: story.topicIds,
        eventTypes: [story.articleType, story.status],
        regions: [],
        articleType: story.articleType,
        severity: story.articleType === 'breaking_news' ? 'MAJOR' : 'MODERATE',
        text: `${story.title} ${story.summary} ${story.slug}`,
      };
    }

    const item = await this.db.ingestion.findItemById(resourceId, orgId);
    if (!item) throw new NotFoundError('IngestionItem', resourceId);
    return {
      resourceType,
      id: item.id,
      title: item.title,
      summary: item.summary ?? '',
      entityIds: item.signals.entityIds,
      topicIds: item.signals.topicIds,
      eventTypes: ['INGESTION_ITEM'],
      regions: [],
      severity: item.status === 'NEW' ? 'LOW' : 'MODERATE',
      text: `${item.title} ${item.summary ?? ''} ${item.claimTexts.join(' ')}`,
    };
  }

  private async audit(
    ctx: IntelligenceContext,
    action: string,
    resourceId: string,
    payloadSummary?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.db.audit.log({
        id: generateId('aud'),
        organizationId: ctx.organizationId,
        userId: ctx.actorId,
        clientType: ctx.clientType,
        action: `${ctx.clientType}.${action}`,
        resourceType: 'alert_rule',
        resourceId,
        payloadSummary,
        requestId: ctx.requestId,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
    } catch {
      // non-blocking
    }
  }
}
