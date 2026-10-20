import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import {
  AlertService,
  IngestionService,
  KnowledgeGraphService,
  NotificationService,
  SourceIntelligenceService,
  StoryIntelligenceService,
} from '@ai-news/stories';
import { EventService } from '@ai-news/events';
import { buildBlockCatalog, getBlockDefinition, listBlockDefinitions } from '@ai-news/schemas';
import { mcpJsonResponse, mcpErrorResponse } from './tool-helpers';

const claimStatus = z.enum([
  'UNVERIFIED',
  'SUPPORTED',
  'PARTIALLY_SUPPORTED',
  'CONTRADICTED',
  'UNSUPPORTED',
  'DISPUTED',
]);

const evidenceType = z.enum([
  'DOCUMENT',
  'DATASET',
  'TESTIMONY',
  'EXPERT_ANALYSIS',
  'VIDEO',
  'AUDIO',
  'IMAGE',
  'STATISTIC',
  'OTHER',
]);

const evidenceStance = z.enum(['SUPPORTS', 'CONTRADICTS', 'CONTEXT']);
const timelineEventType = z.enum([
  'DEVELOPMENT',
  'OFFICIAL_STATEMENT',
  'LEGAL_ACTION',
  'ELECTION',
  'DISASTER',
  'SCIENCE',
  'ECONOMIC',
  'CONFLICT',
  'OTHER',
]);
const perspectiveStance = z.enum(['SUPPORTS', 'OPPOSES', 'NEUTRAL', 'MIXED', 'UNKNOWN']);
const graphNodeType = z.enum([
  'PERSON',
  'ORGANIZATION',
  'COMPANY',
  'COUNTRY',
  'TECHNOLOGY',
  'PRODUCT',
  'INSTITUTION',
  'ENTITY',
  'PUBLISHER',
  'SOURCE',
  'STORY',
  'EVENT',
  'TOPIC',
  'LOCATION',
  'CLAIM',
  'EVIDENCE',
  'CITATION',
]);
const graphRelation = z.enum([
  'works_for',
  'mentioned_in',
  'covers',
  'mentions',
  'supported_by',
  'contradicted_by',
  'originates_from',
  'published_by',
  'located_at',
  'part_of',
  'related_to',
  'has_claim',
  'has_evidence',
  'cites',
  'follows',
  'occurred_at',
  'custom',
]);
const alertChannel = z.enum(['in_app', 'email', 'push', 'webhook']);
const alertSeverity = z.enum(['LOW', 'MODERATE', 'MAJOR', 'CRITICAL']);

const alertConditionsShape = {
  entityIds: z.array(z.string()).optional().describe('Match any of these entity IDs'),
  topicIds: z.array(z.string()).optional().describe('Match any of these topic IDs'),
  eventTypes: z.array(z.string()).optional().describe('Match any of these event types'),
  keywords: z
    .array(z.string())
    .optional()
    .describe('Match any of these keywords in the title/summary'),
  minSeverity: alertSeverity.optional().describe('Minimum resource severity'),
  minMagnitude: z.number().optional().describe('Minimum event magnitude'),
  regions: z.array(z.string()).optional().describe('Match any of these regions/locations'),
  articleTypes: z.array(z.string()).optional().describe('Match any of these article types'),
};

const ingestionFeedType = z.enum(['rss', 'atom', 'json_api', 'webhook']);

function intelligenceContext(principal: AuthenticatedPrincipal) {
  return {
    organizationId: principal.organizationId,
    actorId: principal.id,
    clientType: principal.clientType,
  };
}

function requireWrite(principal: AuthenticatedPrincipal) {
  AuthService.requireScope(principal, 'news:write');
  AuthService.requireRole(principal, 'admin', 'editor', 'journalist', 'ai_agent');
}

function requireAdminOrEditor(principal: AuthenticatedPrincipal) {
  AuthService.requireScope(principal, 'news:write');
  AuthService.requireRole(principal, 'admin', 'editor');
}

function fail(action: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return mcpErrorResponse(`Failed to ${action}: ${msg}`);
}

export function registerIntelligenceTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const intelligence = new StoryIntelligenceService(db);
  const graph = new KnowledgeGraphService(db);
  const alerts = new AlertService(db);
  const ingestion = new IngestionService(db);
  const sourceIntelligence = new SourceIntelligenceService(db);
  const eventService = new EventService(db);
  const notificationService = new NotificationService(db);

  // --- Story intelligence ---------------------------------------------------

  server.tool(
    'get_story_intelligence',
    '[READ-ONLY] Get one consolidated intelligence payload for a story: claims with evidence, timeline, perspectives, what-changed summary, and metrics. Prefer this over many single-purpose calls.',
    {
      storyId: z.string().min(1).describe('Story ID'),
    },
    async ({ storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(
          await intelligence.getStoryIntelligence(storyId, principal.organizationId)
        );
      } catch (err) {
        return fail('get story intelligence', err);
      }
    }
  );

  server.tool(
    'get_story_what_changed',
    '[READ-ONLY] Explain what changed since the previous story version, including the latest timeline development and affected entities/sources.',
    {
      storyId: z.string().min(1).describe('Story ID'),
    },
    async ({ storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(
          await intelligence.getWhatChanged(storyId, principal.organizationId)
        );
      } catch (err) {
        return fail('get what changed', err);
      }
    }
  );

  // --- Claims & evidence ----------------------------------------------------

  server.tool(
    'list_story_claims',
    '[READ-ONLY] List atomic, verifiable claims attached to a story, with their verification status, confidence methodology, and citations.',
    {
      storyId: z.string().min(1).describe('Story ID'),
    },
    async ({ storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(await intelligence.listClaims(storyId, principal.organizationId));
      } catch (err) {
        return fail('list claims', err);
      }
    }
  );

  server.tool(
    'create_story_claim',
    '[WRITE] Add an atomic claim to a story. SUPPORTED, PARTIALLY_SUPPORTED, and CONTRADICTED claims require at least one source ID; create them as UNVERIFIED and attach evidence first otherwise.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      text: z.string().min(1).max(4000).describe('The exact claim statement'),
      status: claimStatus.optional().describe('Verification status (default UNVERIFIED)'),
      confidence: z.number().min(0).max(1).optional().describe('Confidence between 0 and 1'),
      confidenceMethodology: z
        .string()
        .max(1000)
        .optional()
        .describe('Required whenever confidence is supplied'),
      methodology: z.string().max(2000).optional().describe('How the claim was evaluated'),
      sourceIds: z.array(z.string()).optional().describe('Supporting source IDs'),
      citationIds: z.array(z.string()).optional().describe('Citation IDs'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        const { storyId, ...input } = args;
        return mcpJsonResponse(
          await intelligence.createClaim(storyId, { ...input }, intelligenceContext(principal))
        );
      } catch (err) {
        return fail('create claim', err);
      }
    }
  );

  server.tool(
    'update_claim_status',
    '[WRITE] Change a claim verification status and record reviewer notes. Moving to a supported/contradicted status requires an existing source or evidence.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      claimId: z.string().min(1).describe('Claim ID'),
      status: claimStatus.describe('New verification status'),
      confidence: z.number().min(0).max(1).optional().describe('Confidence between 0 and 1'),
      confidenceMethodology: z
        .string()
        .max(1000)
        .optional()
        .describe('Required whenever confidence is supplied'),
      methodology: z.string().max(2000).optional().describe('Evaluation methodology'),
      reviewNotes: z.string().max(4000).optional().describe('Reviewer notes'),
      sourceIds: z.array(z.string()).optional().describe('Replacement source IDs'),
      citationIds: z.array(z.string()).optional().describe('Replacement citation IDs'),
    },
    async ({ storyId, claimId, ...input }) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        return mcpJsonResponse(
          await intelligence.updateClaimStatus(
            storyId,
            claimId,
            input,
            intelligenceContext(principal)
          )
        );
      } catch (err) {
        return fail('update claim status', err);
      }
    }
  );

  server.tool(
    'delete_story_claim',
    '[DESTRUCTIVE] Delete a claim and detach its evidence from a story. Requires admin or editor.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      claimId: z.string().min(1).describe('Claim ID'),
    },
    async ({ storyId, claimId }) => {
      try {
        const principal = getPrincipal();
        requireAdminOrEditor(principal);
        await intelligence.deleteClaim(storyId, claimId, intelligenceContext(principal));
        return mcpJsonResponse({ deleted: true, storyId, claimId });
      } catch (err) {
        return fail('delete claim', err);
      }
    }
  );

  server.tool(
    'list_story_evidence',
    '[READ-ONLY] List evidence attached to a story, optionally filtered to a single claim.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      claimId: z.string().min(1).optional().describe('Optional claim ID filter'),
    },
    async ({ storyId, claimId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(
          await intelligence.listEvidence(storyId, principal.organizationId, claimId)
        );
      } catch (err) {
        return fail('list evidence', err);
      }
    }
  );

  server.tool(
    'add_claim_evidence',
    '[WRITE] Attach a document, dataset, testimony, statistic, or other evidence item to a story or claim. Record stance and methodology so the conclusion is auditable.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      claimId: z.string().optional().describe('Optional claim ID'),
      sourceId: z.string().optional().describe('Optional registered source ID'),
      citationId: z.string().optional().describe('Optional citation ID'),
      type: evidenceType.optional().describe('Evidence type'),
      title: z.string().min(1).max(300).describe('Short evidence title'),
      description: z.string().max(4000).optional().describe('What the evidence shows'),
      url: z.string().url().optional().describe('Public evidence URL'),
      excerpt: z.string().max(10000).optional().describe('Verbatim excerpt'),
      stance: evidenceStance
        .optional()
        .describe('Whether it supports, contradicts, or contextualizes'),
      strength: z.number().min(0).max(1).optional().describe('Evidence strength 0-1'),
      methodology: z.string().max(2000).optional().describe('Collection/assessment method'),
      retrievedAt: z.string().optional().describe('Retrieval timestamp (ISO 8601)'),
      publishedAt: z.string().optional().describe('Original publication timestamp (ISO 8601)'),
    },
    async ({ storyId, ...input }) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        return mcpJsonResponse(
          await intelligence.addEvidence(storyId, { ...input }, intelligenceContext(principal))
        );
      } catch (err) {
        return fail('add evidence', err);
      }
    }
  );

  server.tool(
    'delete_evidence',
    '[DESTRUCTIVE] Delete an evidence item from a story. Requires admin or editor.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      evidenceId: z.string().min(1).describe('Evidence ID'),
    },
    async ({ storyId, evidenceId }) => {
      try {
        const principal = getPrincipal();
        requireAdminOrEditor(principal);
        await intelligence.deleteEvidence(storyId, evidenceId, intelligenceContext(principal));
        return mcpJsonResponse({ deleted: true, storyId, evidenceId });
      } catch (err) {
        return fail('delete evidence', err);
      }
    }
  );

  // --- Timeline -------------------------------------------------------------

  server.tool(
    'get_story_timeline',
    '[READ-ONLY] Get the chronological timeline of developments for a story.',
    {
      storyId: z.string().min(1).describe('Story ID'),
    },
    async ({ storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(await intelligence.listTimeline(storyId, principal.organizationId));
      } catch (err) {
        return fail('get timeline', err);
      }
    }
  );

  server.tool(
    'add_timeline_event',
    '[WRITE] Add a dated development (statement, legal action, election, disaster, economic event...) to a story timeline.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      title: z.string().min(1).max(300).describe('Event title'),
      description: z.string().min(1).max(5000).describe('What happened'),
      eventType: timelineEventType.optional().describe('Event category'),
      occurredAt: z.string().optional().describe('When it happened (ISO 8601)'),
      location: z.string().max(300).optional().describe('Place name'),
      coordinates: z.tuple([z.number(), z.number()]).optional().describe('[longitude, latitude]'),
      entityIds: z.array(z.string()).optional().describe('Related entity IDs'),
      sourceIds: z.array(z.string()).optional().describe('Supporting source IDs'),
      citationIds: z.array(z.string()).optional().describe('Citation IDs'),
      mediaUrl: z.string().url().optional().describe('Optional media URL'),
    },
    async ({ storyId, ...input }) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        return mcpJsonResponse(
          await intelligence.addTimelineEvent(storyId, { ...input }, intelligenceContext(principal))
        );
      } catch (err) {
        return fail('add timeline event', err);
      }
    }
  );

  server.tool(
    'update_timeline_event',
    '[WRITE] Update an existing timeline event.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      eventId: z.string().min(1).describe('Timeline event ID'),
      title: z.string().min(1).max(300).optional().describe('Event title'),
      description: z.string().min(1).max(5000).optional().describe('What happened'),
      eventType: timelineEventType.optional().describe('Event category'),
      occurredAt: z.string().optional().describe('When it happened (ISO 8601)'),
      location: z.string().max(300).optional().describe('Place name'),
      coordinates: z.tuple([z.number(), z.number()]).optional().describe('[longitude, latitude]'),
      entityIds: z.array(z.string()).optional().describe('Related entity IDs'),
      sourceIds: z.array(z.string()).optional().describe('Supporting source IDs'),
      citationIds: z.array(z.string()).optional().describe('Citation IDs'),
      mediaUrl: z.string().url().optional().describe('Optional media URL'),
    },
    async ({ storyId, eventId, ...input }) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        return mcpJsonResponse(
          await intelligence.updateTimelineEvent(
            storyId,
            eventId,
            { ...input, id: eventId },
            intelligenceContext(principal)
          )
        );
      } catch (err) {
        return fail('update timeline event', err);
      }
    }
  );

  server.tool(
    'delete_timeline_event',
    '[DESTRUCTIVE] Delete a timeline event. Requires admin or editor.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      eventId: z.string().min(1).describe('Timeline event ID'),
    },
    async ({ storyId, eventId }) => {
      try {
        const principal = getPrincipal();
        requireAdminOrEditor(principal);
        await intelligence.deleteTimelineEvent(storyId, eventId, intelligenceContext(principal));
        return mcpJsonResponse({ deleted: true, storyId, eventId });
      } catch (err) {
        return fail('delete timeline event', err);
      }
    }
  );

  // --- Perspectives ---------------------------------------------------------

  server.tool(
    'list_editorial_perspectives',
    '[READ-ONLY] List attributed perspectives on a story (who says what, with stance and sources).',
    {
      storyId: z.string().min(1).describe('Story ID'),
    },
    async ({ storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(
          await intelligence.listPerspectives(storyId, principal.organizationId)
        );
      } catch (err) {
        return fail('list perspectives', err);
      }
    }
  );

  server.tool(
    'add_editorial_perspective',
    '[WRITE] Add an attributed perspective or stakeholder position to a story, including a verbatim excerpt where available.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      label: z.string().min(1).max(200).describe('Whose perspective this is'),
      summary: z.string().min(1).max(5000).describe('Position summary'),
      stance: perspectiveStance.optional().describe('Stance on the core question'),
      sourceIds: z.array(z.string()).optional().describe('Supporting source IDs'),
      citationIds: z.array(z.string()).optional().describe('Citation IDs'),
      quoteExcerpt: z.string().max(2000).optional().describe('Verbatim quote'),
    },
    async ({ storyId, ...input }) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        return mcpJsonResponse(
          await intelligence.addPerspective(storyId, { ...input }, intelligenceContext(principal))
        );
      } catch (err) {
        return fail('add perspective', err);
      }
    }
  );

  server.tool(
    'delete_editorial_perspective',
    '[DESTRUCTIVE] Delete an editorial perspective. Requires admin or editor.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      perspectiveId: z.string().min(1).describe('Perspective ID'),
    },
    async ({ storyId, perspectiveId }) => {
      try {
        const principal = getPrincipal();
        requireAdminOrEditor(principal);
        await intelligence.deletePerspective(
          storyId,
          perspectiveId,
          intelligenceContext(principal)
        );
        return mcpJsonResponse({ deleted: true, storyId, perspectiveId });
      } catch (err) {
        return fail('delete perspective', err);
      }
    }
  );

  // --- Knowledge graph ------------------------------------------------------

  server.tool(
    'add_knowledge_edge',
    '[WRITE] Add a typed relationship between any two nodes (story, entity, source, claim, event, topic, publisher...) to the knowledge graph.',
    {
      fromType: graphNodeType.describe('Source node type'),
      fromId: z.string().min(1).describe('Source node ID'),
      relation: graphRelation.describe('Relationship type'),
      toType: graphNodeType.describe('Target node type'),
      toId: z.string().min(1).describe('Target node ID'),
      weight: z.number().min(0).max(1).optional().describe('Confidence/weight 0-1'),
      metadata: z.record(z.unknown()).optional().describe('Additional structured metadata'),
    },
    async (input) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        return mcpJsonResponse(await graph.addEdge(input, intelligenceContext(principal)));
      } catch (err) {
        return fail('add knowledge edge', err);
      }
    }
  );

  server.tool(
    'delete_knowledge_edge',
    '[DESTRUCTIVE] Delete a knowledge-graph edge. Requires admin or editor.',
    {
      id: z.string().min(1).describe('Edge ID'),
    },
    async ({ id }) => {
      try {
        const principal = getPrincipal();
        requireAdminOrEditor(principal);
        await graph.deleteEdge(id, intelligenceContext(principal));
        return mcpJsonResponse({ deleted: true, id });
      } catch (err) {
        return fail('delete knowledge edge', err);
      }
    }
  );

  server.tool(
    'query_knowledge_graph',
    '[READ-ONLY] Query knowledge-graph edges by relation/text, or traverse the neighborhood of a node when nodeType and nodeId are supplied.',
    {
      nodeType: graphNodeType.optional().describe('Root node type for traversal'),
      nodeId: z.string().optional().describe('Root node ID for traversal'),
      relation: graphRelation.optional().describe('Filter by relationship type'),
      query: z.string().max(300).optional().describe('Free-text filter over node IDs/metadata'),
      depth: z.number().int().min(0).max(5).optional().describe('Traversal depth (default 1)'),
      limit: z.number().int().min(1).max(500).optional().describe('Max edges (default 100)'),
    },
    async (input) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(
          await graph.query(
            { ...input, depth: input.depth ?? 1, limit: input.limit ?? 100 },
            principal.organizationId
          )
        );
      } catch (err) {
        return fail('query knowledge graph', err);
      }
    }
  );

  server.tool(
    'get_graph_neighborhood',
    '[READ-ONLY] Traverse the knowledge graph outward from a node to a bounded depth and return nodes plus edges.',
    {
      nodeType: graphNodeType.describe('Root node type'),
      nodeId: z.string().min(1).describe('Root node ID'),
      depth: z.number().int().min(0).max(5).optional().describe('Traversal depth (default 1)'),
      limit: z.number().int().min(1).max(500).optional().describe('Max edges (default 100)'),
    },
    async ({ nodeType, nodeId, depth, limit }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(
          await graph.getNeighborhood(nodeType, nodeId, principal.organizationId, depth, limit)
        );
      } catch (err) {
        return fail('get graph neighborhood', err);
      }
    }
  );

  // --- Alerts ---------------------------------------------------------------

  server.tool(
    'create_alert_rule',
    '[WRITE] Create a deterministic alert rule. Conditions are ANDed across categories and ORed within arrays; channels record delivery intent.',
    {
      name: z.string().min(1).max(200).describe('Rule name'),
      description: z.string().max(2000).optional().describe('What the rule is for'),
      enabled: z.boolean().optional().describe('Whether the rule is active'),
      scope: z
        .enum(['organization', 'user'])
        .optional()
        .describe(
          '`user` creates a personal rule for the caller; `organization` creates a newsroom-wide rule'
        ),
      conditions: z.object(alertConditionsShape).describe('Match conditions'),
      channels: z.array(alertChannel).min(1).optional().describe('Delivery channels'),
      schedule: z
        .object({
          cron: z.string().max(120).optional(),
          timezone: z.string().max(80).optional(),
          digest: z.boolean().optional(),
        })
        .optional()
        .describe('Optional evaluation schedule metadata'),
      cooldownMinutes: z
        .number()
        .int()
        .min(0)
        .max(10080)
        .optional()
        .describe('Minimum minutes between triggers'),
    },
    async (input) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        return mcpJsonResponse(await alerts.createRule(input, intelligenceContext(principal)));
      } catch (err) {
        return fail('create alert rule', err);
      }
    }
  );

  server.tool(
    'list_alert_rules',
    '[READ-ONLY] List alert rules: the organization-wide rules plus the calling principal’s own personal rules.',
    {
      enabled: z.boolean().optional().describe('Filter by enabled state'),
    },
    async ({ enabled }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(
          await alerts.listRules(principal.organizationId, enabled, principal.id)
        );
      } catch (err) {
        return fail('list alert rules', err);
      }
    }
  );

  server.tool(
    'update_alert_rule',
    '[WRITE] Update an alert rule (name, conditions, channels, cooldown, enabled state).',
    {
      id: z.string().min(1).describe('Alert rule ID'),
      name: z.string().min(1).max(200).optional().describe('Rule name'),
      description: z.string().max(2000).optional().describe('Description'),
      enabled: z.boolean().optional().describe('Whether the rule is active'),
      scope: z
        .enum(['organization', 'user'])
        .optional()
        .describe('Move the rule between the caller and the newsroom'),
      conditions: z.object(alertConditionsShape).optional().describe('Match conditions'),
      channels: z.array(alertChannel).min(1).optional().describe('Delivery channels'),
      schedule: z
        .object({
          cron: z.string().max(120).optional(),
          timezone: z.string().max(80).optional(),
          digest: z.boolean().optional(),
        })
        .optional()
        .describe('Evaluation schedule metadata'),
      cooldownMinutes: z
        .number()
        .int()
        .min(0)
        .max(10080)
        .optional()
        .describe('Minimum minutes between triggers'),
    },
    async ({ id, ...input }) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        const conditions = input.conditions
          ? {
              entityIds: input.conditions.entityIds ?? [],
              topicIds: input.conditions.topicIds ?? [],
              eventTypes: input.conditions.eventTypes ?? [],
              keywords: input.conditions.keywords ?? [],
              regions: input.conditions.regions ?? [],
              articleTypes: input.conditions.articleTypes ?? [],
              minSeverity: input.conditions.minSeverity,
              minMagnitude: input.conditions.minMagnitude,
            }
          : undefined;
        const schedule = input.schedule
          ? {
              ...input.schedule,
              timezone: input.schedule.timezone ?? 'UTC',
              digest: input.schedule.digest ?? false,
            }
          : undefined;
        return mcpJsonResponse(
          await alerts.updateRule(
            id,
            { ...input, conditions, schedule },
            intelligenceContext(principal)
          )
        );
      } catch (err) {
        return fail('update alert rule', err);
      }
    }
  );

  server.tool(
    'delete_alert_rule',
    '[DESTRUCTIVE] Delete an alert rule. Requires admin or editor.',
    {
      id: z.string().min(1).describe('Alert rule ID'),
    },
    async ({ id }) => {
      try {
        const principal = getPrincipal();
        requireAdminOrEditor(principal);
        await alerts.deleteRule(id, intelligenceContext(principal));
        return mcpJsonResponse({ deleted: true, id });
      } catch (err) {
        return fail('delete alert rule', err);
      }
    }
  );

  server.tool(
    'evaluate_alerts',
    '[WRITE] Evaluate all enabled alert rules against an event, story, or ingestion item and record any triggered alerts.',
    {
      resourceType: z.enum(['EVENT', 'STORY', 'INGESTION_ITEM']).describe('Resource type'),
      resourceId: z.string().min(1).describe('Resource ID'),
    },
    async ({ resourceType, resourceId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');
        return mcpJsonResponse(
          await alerts.evaluate(resourceType, resourceId, intelligenceContext(principal))
        );
      } catch (err) {
        return fail('evaluate alerts', err);
      }
    }
  );

  server.tool(
    'list_alert_triggers',
    '[READ-ONLY] List recently fired alerts with matched conditions and delivery channels.',
    {
      limit: z.number().int().min(1).max(200).optional().describe('Max triggers (default 50)'),
    },
    async ({ limit }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(await alerts.listTriggers(principal.organizationId, limit ?? 50));
      } catch (err) {
        return fail('list alert triggers', err);
      }
    }
  );

  // --- Ingestion ------------------------------------------------------------

  server.tool(
    'create_ingestion_feed',
    '[WRITE] Register an RSS, Atom, JSON API, or webhook ingestion feed. URLs are validated against SSRF rules before storage.',
    {
      name: z.string().min(1).max(200).describe('Feed name'),
      url: z.string().url().describe('Feed URL'),
      type: ingestionFeedType.optional().describe('Feed type (default rss)'),
      active: z.boolean().optional().describe('Whether the feed is active'),
      defaultTopicIds: z.array(z.string()).optional().describe('Topics applied to new items'),
      defaultEntityIds: z.array(z.string()).optional().describe('Entities applied to new items'),
      defaultSourceType: z.string().optional().describe('Source type for promoted items'),
      fetchIntervalMinutes: z
        .number()
        .int()
        .min(5)
        .max(1440)
        .optional()
        .describe('Poll interval in minutes'),
    },
    async (input) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');
        AuthService.requireRole(principal, 'admin', 'editor', 'ai_agent');
        return mcpJsonResponse(await ingestion.createFeed(input, intelligenceContext(principal)));
      } catch (err) {
        return fail('create ingestion feed', err);
      }
    }
  );

  server.tool(
    'list_ingestion_feeds',
    '[READ-ONLY] List configured ingestion feeds with their status and last fetch time.',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(await ingestion.listFeeds(principal.organizationId));
      } catch (err) {
        return fail('list ingestion feeds', err);
      }
    }
  );

  server.tool(
    'update_ingestion_feed',
    '[WRITE] Update an ingestion feed configuration. Any new URL is SSRF-validated.',
    {
      id: z.string().min(1).describe('Feed ID'),
      name: z.string().min(1).max(200).optional().describe('Feed name'),
      url: z.string().url().optional().describe('Feed URL'),
      type: ingestionFeedType.optional().describe('Feed type'),
      active: z.boolean().optional().describe('Whether the feed is active'),
      defaultTopicIds: z.array(z.string()).optional().describe('Topics applied to new items'),
      defaultEntityIds: z.array(z.string()).optional().describe('Entities applied to new items'),
      defaultSourceType: z.string().optional().describe('Source type for promoted items'),
      fetchIntervalMinutes: z
        .number()
        .int()
        .min(5)
        .max(1440)
        .optional()
        .describe('Poll interval in minutes'),
    },
    async ({ id, ...input }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');
        AuthService.requireRole(principal, 'admin', 'editor', 'ai_agent');
        return mcpJsonResponse(
          await ingestion.updateFeed(id, input, intelligenceContext(principal))
        );
      } catch (err) {
        return fail('update ingestion feed', err);
      }
    }
  );

  server.tool(
    'delete_ingestion_feed',
    '[DESTRUCTIVE] Delete an ingestion feed. Existing items are retained. Requires admin or editor.',
    {
      id: z.string().min(1).describe('Feed ID'),
    },
    async ({ id }) => {
      try {
        const principal = getPrincipal();
        requireAdminOrEditor(principal);
        await ingestion.deleteFeed(id, intelligenceContext(principal));
        return mcpJsonResponse({ deleted: true, id });
      } catch (err) {
        return fail('delete ingestion feed', err);
      }
    }
  );

  server.tool(
    'ingest_feed',
    '[WRITE] Fetch an ingestion feed now, deduplicate items, and match them against existing stories. Network access is SSRF-filtered, time-limited, and size-limited.',
    {
      feedId: z.string().min(1).describe('Feed ID'),
    },
    async ({ feedId }) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        return mcpJsonResponse(await ingestion.ingestFeed(feedId, intelligenceContext(principal)));
      } catch (err) {
        return fail('ingest feed', err);
      }
    }
  );

  server.tool(
    'list_ingestion_items',
    '[READ-ONLY] List ingested items with optional feed/status/text filters.',
    {
      feedId: z.string().optional().describe('Filter by feed ID'),
      status: z
        .enum(['NEW', 'DUPLICATE', 'CLUSTERED', 'PROMOTED', 'REJECTED'])
        .optional()
        .describe('Filter by status'),
      query: z.string().optional().describe('Text filter over title/summary'),
      limit: z.number().int().min(1).max(200).optional().describe('Max items (default 50)'),
      offset: z.number().int().min(0).optional().describe('Pagination offset'),
    },
    async (filter) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(await ingestion.listItems(principal.organizationId, filter));
      } catch (err) {
        return fail('list ingestion items', err);
      }
    }
  );

  server.tool(
    'promote_ingestion_item',
    '[WRITE] Promote an ingested item into a registered source and optionally create a draft story. Promotions are idempotent by URL.',
    {
      itemId: z.string().min(1).describe('Ingestion item ID'),
      createDraftStory: z.boolean().optional().describe('Create a draft story from the item'),
      topicIds: z.array(z.string()).optional().describe('Topic IDs for the draft'),
      entityIds: z.array(z.string()).optional().describe('Entity IDs for the draft'),
    },
    async ({ itemId, ...input }) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        return mcpJsonResponse(
          await ingestion.promoteItem(itemId, { ...input }, intelligenceContext(principal))
        );
      } catch (err) {
        return fail('promote ingestion item', err);
      }
    }
  );

  server.tool(
    'detect_breaking_news',
    '[READ-ONLY] Detect candidate breaking stories from shared events/entities, independent-source count, and story velocity. Deterministic and auditable — no LLM judgment.',
    {
      windowHours: z.number().int().min(1).max(168).optional().describe('Lookback window'),
      minIndependentSources: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe('Minimum independent sources'),
      minStoryVelocity: z.number().min(1).optional().describe('Minimum story velocity'),
      limit: z.number().int().min(1).max(100).optional().describe('Max candidates'),
    },
    async (options) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(
          await ingestion.detectBreakingCandidates(principal.organizationId, options)
        );
      } catch (err) {
        return fail('detect breaking news', err);
      }
    }
  );

  // --- Source intelligence --------------------------------------------------

  server.tool(
    'get_publisher_intelligence',
    '[READ-ONLY] Get publisher transparency data, citation metrics, coverage areas, and recorded corrections.',
    {
      publisherId: z.string().min(1).describe('Publisher ID'),
    },
    async ({ publisherId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(
          await sourceIntelligence.getPublisherIntelligence(publisherId, principal.organizationId)
        );
      } catch (err) {
        return fail('get publisher intelligence', err);
      }
    }
  );

  server.tool(
    'list_source_corrections',
    '[READ-ONLY] List corrections, retractions, clarifications, and updates recorded against publishers, sources, or stories.',
    {
      publisherId: z.string().optional().describe('Filter by publisher'),
      sourceId: z.string().optional().describe('Filter by source'),
      storyId: z.string().optional().describe('Filter by story'),
      limit: z.number().int().min(1).max(200).optional().describe('Max records'),
    },
    async (filter) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(
          await sourceIntelligence.getCorrections(principal.organizationId, filter)
        );
      } catch (err) {
        return fail('list source corrections', err);
      }
    }
  );

  server.tool(
    'record_source_correction',
    '[WRITE] Record a correction, retraction, clarification, or update against a publisher, source, or story.',
    {
      publisherId: z.string().optional().describe('Publisher ID'),
      sourceId: z.string().optional().describe('Source ID'),
      storyId: z.string().optional().describe('Story ID'),
      type: z.enum(['CORRECTION', 'RETRACTION', 'CLARIFICATION', 'UPDATE']).describe('Record type'),
      description: z.string().min(1).max(4000).describe('What was corrected and why'),
      issuedAt: z.string().optional().describe('When the correction was issued (ISO 8601)'),
      url: z.string().url().optional().describe('Public correction URL'),
    },
    async (input) => {
      try {
        const principal = getPrincipal();
        requireWrite(principal);
        return mcpJsonResponse(
          await sourceIntelligence.addCorrection(input, intelligenceContext(principal))
        );
      } catch (err) {
        return fail('record source correction', err);
      }
    }
  );

  server.tool(
    'delete_source_correction',
    '[DESTRUCTIVE] Delete a source correction record. Requires admin or editor.',
    {
      id: z.string().min(1).describe('Correction ID'),
    },
    async ({ id }) => {
      try {
        const principal = getPrincipal();
        requireAdminOrEditor(principal);
        await sourceIntelligence.deleteCorrection(id, intelligenceContext(principal));
        return mcpJsonResponse({ deleted: true, id });
      } catch (err) {
        return fail('delete source correction', err);
      }
    }
  );

  // --- Evidence chain -------------------------------------------------------

  server.tool(
    'get_claim_evidence',
    '[READ-ONLY] Get the full evidence chain for one claim: the claim itself plus every attached evidence item with its stance and source.',
    {
      claimId: z.string().min(1).describe('Claim ID'),
    },
    async ({ claimId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(
          await intelligence.getClaimEvidence(claimId, principal.organizationId)
        );
      } catch (err) {
        return fail('get claim evidence', err);
      }
    }
  );

  server.tool(
    'get_source_claims',
    '[READ-ONLY] Get every claim in the newsroom that cites a given source. Use this to audit what a publication is being relied on for.',
    {
      sourceId: z.string().min(1).describe('Source ID'),
    },
    async ({ sourceId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        const claims = await intelligence.getSourceClaims(sourceId, principal.organizationId);
        return mcpJsonResponse({ sourceId, count: claims.length, claims });
      } catch (err) {
        return fail('get source claims', err);
      }
    }
  );

  server.tool(
    'get_entity_stories',
    '[READ-ONLY] Get every story that mentions a given entity, for tracing an entity across coverage.',
    {
      entityId: z.string().min(1).describe('Entity ID'),
    },
    async ({ entityId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        const stories = await intelligence.getEntityStories(entityId, principal.organizationId);
        return mcpJsonResponse({
          entityId,
          count: stories.length,
          stories: stories.map((story) => ({
            id: story.id,
            slug: story.slug,
            title: story.title,
            status: story.status,
            articleType: story.articleType,
            publishedAt: story.publishedAt,
          })),
        });
      } catch (err) {
        return fail('get entity stories', err);
      }
    }
  );

  // --- Global event map ------------------------------------------------------

  server.tool(
    'get_event_map',
    '[READ-ONLY] Get the global event map: located events filtered by category, severity, time window, and bounding box, with story/source/entity counts for each point. Use heatmap=true for aggregated density cells.',
    {
      categories: z.array(z.string()).optional().describe('Event categories, e.g. ["earthquake"]'),
      severities: z
        .array(z.enum(['LOW', 'MODERATE', 'MAJOR', 'CRITICAL']))
        .optional()
        .describe('Severity levels to include'),
      fromDate: z.string().optional().describe('Only events at or after this ISO timestamp'),
      toDate: z.string().optional().describe('Only events at or before this ISO timestamp'),
      bbox: z
        .array(z.number())
        .length(4)
        .optional()
        .describe('Bounding box [west, south, east, north] in degrees'),
      limit: z.number().int().min(1).max(2000).optional().describe('Max points (default 500)'),
      heatmap: z.boolean().optional().describe('Return aggregated density cells instead of points'),
      precision: z
        .number()
        .min(0.1)
        .max(10)
        .optional()
        .describe('Heatmap grid size in degrees (default 1)'),
    },
    async (args) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const filter = {
          categories: args.categories ?? [],
          severities: args.severities ?? [],
          fromDate: args.fromDate,
          toDate: args.toDate,
          bbox: args.bbox as [number, number, number, number] | undefined,
          limit: args.limit ?? 500,
        };

        if (args.heatmap) {
          const heatmap = await eventService.getEventHeatmap(principal.organizationId, {
            ...filter,
            precision: args.precision ?? 1,
          });
          return mcpJsonResponse(heatmap);
        }

        const points = await eventService.listEventsForMap(principal.organizationId, filter);
        return mcpJsonResponse({ count: points.length, points });
      } catch (err) {
        return fail('get event map', err);
      }
    }
  );

  // --- Reader notifications --------------------------------------------------

  server.tool(
    'get_my_notifications',
    '[READ-ONLY] Get the notifications addressed to the calling principal, including story developments on the stories and clusters they follow.',
    {
      limit: z.number().int().min(1).max(200).optional().describe('Max notifications (default 50)'),
    },
    async ({ limit }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        const notifications = await notificationService.listForUser(
          principal.id,
          principal.organizationId,
          limit ?? 50
        );
        return mcpJsonResponse({ count: notifications.length, notifications });
      } catch (err) {
        return fail('get my notifications', err);
      }
    }
  );

  // --- Block catalog --------------------------------------------------------

  server.tool(
    'get_block_catalog',
    '[READ-ONLY] List every story block type with its category, capabilities, schema version, and a minimal example. Use this before authoring structured story content.',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        return mcpJsonResponse(buildBlockCatalog());
      } catch (err) {
        return fail('get block catalog', err);
      }
    }
  );

  server.tool(
    'get_block_schema',
    '[READ-ONLY] Get the definition and JSON schema for one story block type.',
    {
      blockType: z.string().min(1).describe('Block type, e.g. "paragraph" or "timeline"'),
    },
    async ({ blockType }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');
        const definition = getBlockDefinition(blockType);
        if (!definition) {
          return mcpErrorResponse(
            `Unknown block type "${blockType}". Available: ${listBlockDefinitions()
              .map((definitionItem) => definitionItem.type)
              .join(', ')}`
          );
        }
        return mcpJsonResponse(definition);
      } catch (err) {
        return fail('get block schema', err);
      }
    }
  );
}
