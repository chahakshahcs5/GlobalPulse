import { z } from 'zod';

export const AlertSeveritySchema = z.enum(['LOW', 'MODERATE', 'MAJOR', 'CRITICAL']);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertChannelSchema = z.enum(['in_app', 'email', 'push', 'webhook']);
export type AlertChannel = z.infer<typeof AlertChannelSchema>;

export const AlertScheduleSchema = z.object({
  /** Cron expression or natural-language label. Evaluation is always explicit. */
  cron: z.string().max(120).optional(),
  timezone: z.string().max(80).default('UTC'),
  digest: z.boolean().default(false),
});
export type AlertSchedule = z.infer<typeof AlertScheduleSchema>;

/**
 * Conditions are ANDed at the rule level. Array conditions (entities, topics,
 * event types) match when any element matches.
 */
export const AlertConditionsSchema = z.object({
  entityIds: z.array(z.string()).default([]),
  topicIds: z.array(z.string()).default([]),
  eventTypes: z.array(z.string()).default([]),
  keywords: z.array(z.string().min(1).max(120)).default([]),
  minSeverity: AlertSeveritySchema.optional(),
  minMagnitude: z.number().optional(),
  regions: z.array(z.string().min(1).max(200)).default([]),
  articleTypes: z.array(z.string()).default([]),
});
export type AlertConditions = z.infer<typeof AlertConditionsSchema>;

export const AlertRuleSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  /**
   * Owner of a personal rule. Undefined means the rule is organization-wide.
   * Personal rules only fire for their owner.
   */
  userId: z.string().optional(),
  scope: z.enum(['organization', 'user']).default('organization'),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  enabled: z.boolean().default(true),
  conditions: AlertConditionsSchema,
  channels: z.array(AlertChannelSchema).min(1).default(['in_app']),
  schedule: AlertScheduleSchema.optional(),
  cooldownMinutes: z.number().int().min(0).max(10080).default(15),
  createdBy: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastTriggeredAt: z.string().optional(),
});
export type AlertRule = z.infer<typeof AlertRuleSchema>;

export const CreateAlertRuleInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  enabled: z.boolean().optional().default(true),
  /** `user` creates a personal rule; `organization` creates a newsroom-wide rule. */
  scope: z.enum(['organization', 'user']).optional().default('organization'),
  conditions: AlertConditionsSchema,
  channels: z.array(AlertChannelSchema).min(1).optional().default(['in_app']),
  schedule: AlertScheduleSchema.optional(),
  cooldownMinutes: z.number().int().min(0).max(10080).optional().default(15),
});
export type CreateAlertRuleInput = z.input<typeof CreateAlertRuleInputSchema>;

export const UpdateAlertRuleInputSchema = CreateAlertRuleInputSchema.partial();
export type UpdateAlertRuleInput = z.infer<typeof UpdateAlertRuleInputSchema>;

export const AlertTriggerSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  ruleId: z.string().min(1),
  resourceType: z.enum(['EVENT', 'STORY', 'INGESTION_ITEM']),
  resourceId: z.string().min(1),
  severity: AlertSeveritySchema,
  message: z.string().min(1),
  matchedConditions: z.array(z.string()),
  deliveredChannels: z.array(AlertChannelSchema),
  createdAt: z.string(),
});
export type AlertTrigger = z.infer<typeof AlertTriggerSchema>;

export const EvaluateAlertsResultSchema = z.object({
  resourceType: z.enum(['EVENT', 'STORY', 'INGESTION_ITEM']),
  resourceId: z.string().min(1),
  evaluatedRules: z.number().int().nonnegative(),
  triggers: z.array(AlertTriggerSchema),
  skipped: z.array(
    z.object({
      ruleId: z.string(),
      reason: z.string(),
    })
  ),
});
export type EvaluateAlertsResult = z.infer<typeof EvaluateAlertsResultSchema>;
