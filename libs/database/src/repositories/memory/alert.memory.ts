import type { AlertRule, AlertTrigger } from '@ai-news/schemas';
import type {
  IAlertRepository,
  AlertRuleFilter,
  AlertTriggerFilter,
} from '../../interfaces/alert.repository';

function cloneRule(rule: AlertRule): AlertRule {
  return {
    ...rule,
    conditions: {
      ...rule.conditions,
      entityIds: [...rule.conditions.entityIds],
      topicIds: [...rule.conditions.topicIds],
      eventTypes: [...rule.conditions.eventTypes],
      keywords: [...rule.conditions.keywords],
      regions: [...rule.conditions.regions],
      articleTypes: [...rule.conditions.articleTypes],
    },
    channels: [...rule.channels],
    schedule: rule.schedule ? { ...rule.schedule } : undefined,
  };
}

function cloneTrigger(trigger: AlertTrigger): AlertTrigger {
  return {
    ...trigger,
    matchedConditions: [...trigger.matchedConditions],
    deliveredChannels: [...trigger.deliveredChannels],
  };
}

export interface AlertSnapshot {
  rules: Map<string, AlertRule>;
  triggers: Map<string, AlertTrigger>;
}

export class MemoryAlertRepository implements IAlertRepository {
  private rules = new Map<string, AlertRule>();
  private triggers = new Map<string, AlertTrigger>();

  async listRules(orgId: string, filter?: AlertRuleFilter): Promise<AlertRule[]> {
    return Array.from(this.rules.values())
      .filter(
        (r) =>
          r.organizationId === orgId &&
          (filter?.enabled === undefined || r.enabled === filter.enabled) &&
          // A user sees the organization-wide rules plus their own personal ones.
          (filter?.userId === undefined || !r.userId || r.userId === filter.userId)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, filter?.limit ?? Number.MAX_SAFE_INTEGER)
      .map(cloneRule);
  }

  async findRuleById(id: string, orgId: string): Promise<AlertRule | null> {
    const rule = this.rules.get(id);
    return rule && rule.organizationId === orgId ? cloneRule(rule) : null;
  }

  async createRule(rule: AlertRule): Promise<AlertRule> {
    if (this.rules.has(rule.id)) {
      throw new Error(`Alert rule with id ${rule.id} already exists`);
    }
    const stored = cloneRule(rule);
    this.rules.set(stored.id, stored);
    return cloneRule(stored);
  }

  async updateRule(rule: AlertRule): Promise<AlertRule> {
    const existing = this.rules.get(rule.id);
    if (!existing || existing.organizationId !== rule.organizationId) {
      throw new Error(`Alert rule with id ${rule.id} does not exist`);
    }
    const stored = cloneRule(rule);
    this.rules.set(stored.id, stored);
    return cloneRule(stored);
  }

  async deleteRule(id: string, orgId: string): Promise<boolean> {
    const existing = this.rules.get(id);
    if (!existing || existing.organizationId !== orgId) return false;
    this.rules.delete(id);
    return true;
  }

  async listTriggers(orgId: string, filter?: AlertTriggerFilter): Promise<AlertTrigger[]> {
    return Array.from(this.triggers.values())
      .filter(
        (t) =>
          t.organizationId === orgId &&
          (filter?.ruleId === undefined || t.ruleId === filter.ruleId) &&
          (filter?.resourceType === undefined || t.resourceType === filter.resourceType) &&
          (filter?.resourceId === undefined || t.resourceId === filter.resourceId) &&
          (filter?.since === undefined || t.createdAt >= filter.since)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, filter?.limit ?? Number.MAX_SAFE_INTEGER)
      .map(cloneTrigger);
  }

  async findTriggerById(id: string, orgId: string): Promise<AlertTrigger | null> {
    const trigger = this.triggers.get(id);
    return trigger && trigger.organizationId === orgId ? cloneTrigger(trigger) : null;
  }

  async createTrigger(trigger: AlertTrigger): Promise<AlertTrigger> {
    if (this.triggers.has(trigger.id)) {
      throw new Error(`Alert trigger with id ${trigger.id} already exists`);
    }
    const stored = cloneTrigger(trigger);
    this.triggers.set(stored.id, stored);
    return cloneTrigger(stored);
  }

  async latestTriggerForRule(ruleId: string, orgId: string): Promise<AlertTrigger | null> {
    const matches = Array.from(this.triggers.values())
      .filter((t) => t.ruleId === ruleId && t.organizationId === orgId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return matches[0] ? cloneTrigger(matches[0]) : null;
  }

  snapshot(): AlertSnapshot {
    return { rules: new Map(this.rules), triggers: new Map(this.triggers) };
  }

  restore(snapshot: AlertSnapshot): void {
    this.rules = new Map(snapshot.rules);
    this.triggers = new Map(snapshot.triggers);
  }

  clear(): void {
    this.rules.clear();
    this.triggers.clear();
  }
}
