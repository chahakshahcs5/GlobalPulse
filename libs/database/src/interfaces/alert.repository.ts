import type { AlertRule, AlertTrigger } from '@ai-news/schemas';

export interface AlertRuleFilter {
  enabled?: boolean;
  limit?: number;
  /**
   * Restrict to rules visible to one user: their own personal rules plus the
   * organization-wide rules.
   */
  userId?: string;
}

export interface AlertTriggerFilter {
  ruleId?: string;
  resourceType?: string;
  resourceId?: string;
  since?: string;
  limit?: number;
}

export interface IAlertRepository {
  listRules(orgId: string, filter?: AlertRuleFilter): Promise<AlertRule[]>;
  findRuleById(id: string, orgId: string): Promise<AlertRule | null>;
  createRule(rule: AlertRule): Promise<AlertRule>;
  updateRule(rule: AlertRule): Promise<AlertRule>;
  deleteRule(id: string, orgId: string): Promise<boolean>;

  listTriggers(orgId: string, filter?: AlertTriggerFilter): Promise<AlertTrigger[]>;
  findTriggerById(id: string, orgId: string): Promise<AlertTrigger | null>;
  createTrigger(trigger: AlertTrigger): Promise<AlertTrigger>;
  /** Most recent trigger for a rule, used for cooldown enforcement. */
  latestTriggerForRule(ruleId: string, orgId: string): Promise<AlertTrigger | null>;
}
