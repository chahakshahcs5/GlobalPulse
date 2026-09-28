import { z } from 'zod';
import { ClientTypeSchema } from './story';

export const AuditLogSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  clientType: ClientTypeSchema,
  action: z.string().min(1), // e.g. 'mcp.create_story', 'mcp.publish_story', 'web.update_block'
  resourceType: z.string().min(1), // 'story', 'event', 'source', 'topic'
  resourceId: z.string().optional(),
  payloadSummary: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  requestId: z.string().optional(),
  durationMs: z.number().nonnegative().optional(),
  status: z.enum(['SUCCESS', 'FAILURE', 'UNAUTHORIZED', 'FORBIDDEN']),
  errorMessage: z.string().optional(),
  timestamp: z.string(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const IdempotencyRecordSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  key: z.string().min(1),
  action: z.string().min(1),
  responseJson: z.unknown(),
  createdAt: z.string(),
  expiresAt: z.string().optional(),
});
export type IdempotencyRecord = z.infer<typeof IdempotencyRecordSchema>;
