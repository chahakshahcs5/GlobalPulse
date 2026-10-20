# Intelligence Platform: Claims, Evidence, Timelines, Graph, Alerts & Ingestion

> **The application is not the AI.** The intelligence platform exposes _structured, auditable
> primitives_ — claims, evidence, timelines, perspectives, graph edges, alert rules, ingestion
> items, and publisher transparency records. External AI models and human journalists decide what
> is true; the platform guarantees that the reasoning behind every assertion is stored,
> attributable, and queryable. **No LLM provider is required anywhere in this stack.**

---

## 1. What was added

| Domain                 | Purpose                                                                         | Service (source of truth)                                                       |
| :--------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------ |
| Story intelligence     | Aggregated claims/evidence/timeline/perspective payload + metrics               | `StoryIntelligenceService` (`libs/stories/src/intelligence.service.ts`)         |
| Claims & evidence      | Atomic, verifiable claims with attached evidence and auditable confidence       | `StoryIntelligenceService`                                                      |
| Timelines              | Dated developments per story (statements, legal actions, elections, disasters…) | `StoryIntelligenceService`                                                      |
| Editorial perspectives | Attributed stakeholder positions with stance and quote excerpts                 | `StoryIntelligenceService`                                                      |
| Knowledge graph        | Typed edges between any nodes (story ↔ entity ↔ source ↔ claim ↔ event…)        | `KnowledgeGraphService` (`libs/stories/src/knowledge-graph.service.ts`)         |
| Alerts                 | Deterministic rule matching with cooldown and in-app delivery                   | `AlertService` (`libs/stories/src/alert.service.ts`)                            |
| Ingestion              | RSS / Atom / JSON feed polling, dedupe, clustering, promotion                   | `IngestionService` (`libs/stories/src/ingestion.service.ts`)                    |
| Source intelligence    | Publisher transparency, citation metrics, correction/retraction ledger          | `SourceIntelligenceService` (`libs/stories/src/source-intelligence.service.ts`) |
| Block catalog          | 46 typed block definitions with JSON Schema for authoring agents                | `libs/schemas/src/block-registry.ts`                                            |

**Architectural rules honoured**

- All business logic lives in the shared services. REST, GraphQL, MCP and the worker are thin
  transports over the _same_ services, so a rule cannot be bypassed by picking another protocol.
- Every repository method requires `organizationId`; services re-validate story / claim / source
  ownership before every write, so tenant isolation is enforced in the domain layer, not only at
  the edge.
- All existing models, endpoints, and clients keep working. The changes are additive.

---

## 2. Core rules enforced by the domain layer

### 2.1 Evidence-required claim status

A claim may not be created or moved to `SUPPORTED`, `PARTIALLY_SUPPORTED`, or `CONTRADICTED`
without at least one supporting source or evidence item:

```text
createClaim(storyId, { text, status: 'SUPPORTED' })            → 422 (no source)
createClaim(storyId, { text, status: 'UNVERIFIED' })            → 201
addEvidence(storyId, { claimId, type: 'DOCUMENT', ... })        → 201
updateClaimStatus(storyId, claimId, { status: 'SUPPORTED' })    → 201 (evidence present)
updateClaimStatus(storyId, claimId, { status: 'SUPPORTED' })    → 422 (no source, no evidence)
```

The rule lives in `EVIDENCE_REQUIRED_CLAIM_STATUSES` (`libs/schemas/src/intelligence.ts`) and is
enforced by `StoryIntelligenceService`, so REST, GraphQL, MCP and worker paths behave identically.

### 2.2 Confidence requires a methodology

`confidence` (0–1) may only be supplied together with `confidenceMethodology`. A number without a
method is rejected by the Zod schema, so unverifiable scores cannot enter the corpus.

### 2.3 Deterministic alerting

Alert conditions are plain data. Categories are **ANDed**, arrays are **ORed**:

| Condition                                             | Semantics                                                           |
| :---------------------------------------------------- | :------------------------------------------------------------------ |
| `entityIds`, `topicIds`, `eventTypes`, `articleTypes` | Match if **any** listed ID matches                                  |
| `regions`                                             | Case-insensitive substring match against the resource location      |
| `keywords`                                            | Case-insensitive substring match against title + summary + metadata |
| `minSeverity`                                         | `severityRank()` ordering: LOW < MODERATE < MAJOR/URGENT < CRITICAL |
| `minMagnitude`                                        | Requires a numeric magnitude on the resource (events)               |

Every trigger records **which** conditions matched, and a per-rule `cooldownMinutes` suppresses
repeat firings. Delivery is pluggable: `in_app` is implemented against the editorial notification
store; `email`, `push`, and `webhook` are recorded as requested channels but are not dispatched by
this release.

### 2.4 SSRF-safe ingestion

Feed URLs are validated with the same helper used for webhooks
(`validateWebhookUrl`): only `http`/`https`, and `localhost`, loopback, private (RFC 1918),
link-local and cloud-metadata addresses are rejected. Fetches are additionally bounded by a 10 s
timeout and a 2 MB response cap.

### 2.5 Deterministic deduplication

Each ingested item gets a SHA-256 `dedupeHash` over its canonicalized URL (tracking parameters
removed) plus its normalized title. A second poll of the same feed produces duplicates, not new
items. Promotion to a source is idempotent because sources are keyed by URL.

### 2.6 Breaking-news candidates (no LLM judgment)

`detectBreakingCandidates()` groups recently updated stories by shared event (or first entity) and
reports candidates when the independent-source count and story velocity exceed the configured
thresholds. The candidate carries an explicit `confidenceMethodology` string and starts in
`CANDIDATE` review status.

---

## 3. REST API

All routes are mounted under `api`, require a valid Bearer token, and enforce scope + role.
Read routes need `news:read`; write routes need `news:write` plus an editorial role
(`admin`, `editor`, `journalist`, `ai_agent`); destructive routes require `admin`/`editor`.

### Story intelligence

| Method   | Route                                               | Scope                       | Description                                                                 |
| :------- | :-------------------------------------------------- | :-------------------------- | :-------------------------------------------------------------------------- |
| `GET`    | `/api/stories/:storyId/intelligence`                | `news:read`                 | Aggregated claims + evidence, timeline, perspectives, what-changed, metrics |
| `GET`    | `/api/stories/:storyId/what-changed`                | `news:read`                 | Diff of the latest revision plus the newest development                     |
| `GET`    | `/api/stories/:storyId/claims`                      | `news:read`                 | List claims                                                                 |
| `POST`   | `/api/stories/:storyId/claims`                      | `news:write`                | Create a claim                                                              |
| `PATCH`  | `/api/stories/:storyId/claims/:claimId/status`      | `news:write`                | Change verification status / confidence                                     |
| `DELETE` | `/api/stories/:storyId/claims/:claimId`             | `news:write` (admin/editor) | Delete a claim (its evidence is removed with it)                            |
| `GET`    | `/api/stories/:storyId/evidence`                    | `news:read`                 | List evidence                                                               |
| `POST`   | `/api/stories/:storyId/evidence`                    | `news:write`                | Attach evidence                                                             |
| `DELETE` | `/api/stories/:storyId/evidence/:evidenceId`        | `news:write` (admin/editor) | Remove evidence                                                             |
| `GET`    | `/api/stories/:storyId/timeline`                    | `news:read`                 | Chronological developments                                                  |
| `POST`   | `/api/stories/:storyId/timeline`                    | `news:write`                | Add a development                                                           |
| `PATCH`  | `/api/stories/:storyId/timeline/:eventId`           | `news:write`                | Update a development                                                        |
| `DELETE` | `/api/stories/:storyId/timeline/:eventId`           | `news:write` (admin/editor) | Delete a development                                                        |
| `GET`    | `/api/stories/:storyId/perspectives`                | `news:read`                 | Attributed perspectives                                                     |
| `POST`   | `/api/stories/:storyId/perspectives`                | `news:write`                | Add a perspective                                                           |
| `DELETE` | `/api/stories/:storyId/perspectives/:perspectiveId` | `news:write` (admin/editor) | Delete a perspective                                                        |

### Block catalog

| Method | Route                    | Scope       | Description                                                                       |
| :----- | :----------------------- | :---------- | :-------------------------------------------------------------------------------- |
| `GET`  | `/api/blocks`            | `news:read` | Full catalog: 41 block types with category, capabilities, JSON Schema and example |
| `GET`  | `/api/blocks/:blockType` | `news:read` | One block definition (`error: "NOT_FOUND"` for unknown types)                     |

### Knowledge graph

| Method   | Route                               | Scope                       | Description                                                                 |
| :------- | :---------------------------------- | :-------------------------- | :-------------------------------------------------------------------------- |
| `GET`    | `/api/graph/edges`                  | `news:read`                 | Filter edges by `fromType`, `fromId`, `toType`, `toId`, `relation`, `limit` |
| `POST`   | `/api/graph/edges`                  | `news:write`                | Create a typed edge                                                         |
| `DELETE` | `/api/graph/edges/:id`              | `news:write` (admin/editor) | Delete an edge                                                              |
| `GET`    | `/api/graph/neighborhood`           | `news:read`                 | Bounded traversal (`nodeType`, `nodeId`, `depth` ≤ 5, `limit` ≤ 500)        |
| `POST`   | `/api/graph/query`                  | `news:read`                 | Edge query by relation and/or free text                                     |
| `POST`   | `/api/graph/stories/:storyId/index` | `news:write`                | Materialize a story's relationships as graph edges (idempotent)             |

### Alerts

| Method   | Route                   | Scope                       | Description                                                  |
| :------- | :---------------------- | :-------------------------- | :----------------------------------------------------------- |
| `GET`    | `/api/alerts/rules`     | `news:read`                 | List rules (optional `enabled` filter)                       |
| `GET`    | `/api/alerts/rules/:id` | `news:read`                 | One rule                                                     |
| `POST`   | `/api/alerts/rules`     | `news:write`                | Create a rule                                                |
| `PATCH`  | `/api/alerts/rules/:id` | `news:write`                | Update a rule                                                |
| `DELETE` | `/api/alerts/rules/:id` | `news:write` (admin/editor) | Delete a rule                                                |
| `GET`    | `/api/alerts/triggers`  | `news:read`                 | Recently fired alerts                                        |
| `POST`   | `/api/alerts/evaluate`  | `news:write`                | Evaluate rules against `EVENT`, `STORY`, or `INGESTION_ITEM` |

### Ingestion

| Method   | Route                                  | Scope                       | Description                                                 |
| :------- | :------------------------------------- | :-------------------------- | :---------------------------------------------------------- |
| `GET`    | `/api/ingestion/feeds`                 | `news:read`                 | List feeds                                                  |
| `POST`   | `/api/ingestion/feeds`                 | `news:write`                | Register a feed (URL is SSRF-validated)                     |
| `PATCH`  | `/api/ingestion/feeds/:feedId`         | `news:write`                | Update a feed                                               |
| `DELETE` | `/api/ingestion/feeds/:feedId`         | `news:write` (admin/editor) | Delete a feed                                               |
| `POST`   | `/api/ingestion/feeds/:feedId/fetch`   | `news:write`                | Poll one feed now                                           |
| `POST`   | `/api/ingestion/fetch-all`             | `news:write`                | Poll every active feed                                      |
| `GET`    | `/api/ingestion/items`                 | `news:read`                 | List items (`feedId`, `status`, `query`, `limit`, `offset`) |
| `GET`    | `/api/ingestion/items/:itemId`         | `news:read`                 | One item                                                    |
| `POST`   | `/api/ingestion/items/:itemId/promote` | `news:write`                | Promote to a source (+ optional draft story)                |
| `GET`    | `/api/ingestion/breaking-candidates`   | `news:read`                 | Breaking-news candidates                                    |

### Source intelligence

| Method   | Route                                       | Scope                       | Description                                                      |
| :------- | :------------------------------------------ | :-------------------------- | :--------------------------------------------------------------- |
| `GET`    | `/api/publishers/:publisherId/intelligence` | `news:read`                 | Publisher profile, citation metrics, coverage areas, corrections |
| `GET`    | `/api/source-corrections`                   | `news:read`                 | Correction ledger (filter by publisher/source/story)             |
| `POST`   | `/api/source-corrections`                   | `news:write`                | Record a correction / retraction / clarification / update        |
| `DELETE` | `/api/source-corrections/:id`               | `news:write` (admin/editor) | Delete a correction record                                       |

### Error semantics

Errors follow the platform RFC 7807 problem format:

| Status | Code                  | When                                                                    |
| :----- | :-------------------- | :---------------------------------------------------------------------- |
| `400`  | `VALIDATION_ERROR`    | Payload failed schema validation (Zod)                                  |
| `401`  | `UNAUTHORENTICATED`   | Missing or invalid token                                                |
| `403`  | `FORBIDDEN`           | Missing scope or role                                                   |
| `404`  | `NOT_FOUND`           | Resource missing **or owned by another tenant**                         |
| `409`  | `CONFLICT`            | Duplicate feed URL, inactive feed                                       |
| `422`  | `VALIDATION_ERROR`    | Domain rule violated (evidence required, unsafe URL, unknown reference) |
| `429`  | `RATE_LIMIT_EXCEEDED` | Global Fastify rate limit                                               |

---

## 4. GraphQL

The schema (`libs/graphql/src/schema.ts`) gained typed operations for every domain. Resolvers live
in `apps/api/src/modules/intelligence/intelligence.resolver.ts` (Nest) and
`libs/graphql/src/resolvers.ts` (standalone Mercurius plugin); both delegate to the same services.

**Queries** — `getStoryIntelligence`, `getStoryWhatChanged`, `getStoryClaims`, `getStoryEvidence`,
`getStoryTimeline`, `getStoryPerspectives`, `getKnowledgeEdges`, `getGraphNeighborhood`,
`queryKnowledgeGraph`, `getAlertRules`, `getAlertRule`, `getAlertTriggers`, `getIngestionFeeds`,
`getIngestionItems`, `getBreakingNewsCandidates`, `getSourceCorrections`,
`getPublisherIntelligence`, `getBlockCatalog`.

**Mutations** — `createClaim`, `updateClaimStatus`, `deleteClaim`, `addEvidence`, `deleteEvidence`,
`addTimelineEvent`, `updateTimelineEvent`, `deleteTimelineEvent`, `addPerspective`,
`deletePerspective`, `addKnowledgeEdge`, `deleteKnowledgeEdge`, `createAlertRule`,
`updateAlertRule`, `deleteAlertRule`, `evaluateAlerts`, `createIngestionFeed`,
`updateIngestionFeed`, `deleteIngestionFeed`, `ingestFeed`, `promoteIngestionItem`,
`addSourceCorrection`, `deleteSourceCorrection`.

Example:

```graphql
mutation {
  createClaim(
    storyId: "sty_123"
    input: { text: "The fine totalled 4.2 million.", status: "UNVERIFIED" }
  ) {
    id
    status
  }
}

query {
  getStoryIntelligence(storyId: "sty_123") {
    claims {
      id
      status
      evidence {
        id
        title
        stance
      }
    }
    metrics {
      claimCount
      supportedClaimCount
      contestedClaimCount
      evidenceCount
    }
    whatChanged {
      currentVersionNumber
      items {
        changeType
        description
      }
    }
  }
}
```

Mutations require an authenticated principal with `news:write`; unauthenticated calls return a
GraphQL `errors` envelope with `Authentication required…`.

---

## 5. MCP tools

The remote MCP server (`apps/mcp-server/src/tools/intelligence.tools.ts`) exposes 40 new tools.
Every tool enforces scope and role, and all writes are tenant-scoped to the calling principal.

| Tool                           | Kind        | Scope        |
| :----------------------------- | :---------- | :----------- |
| `get_story_intelligence`       | read        | `news:read`  |
| `get_story_what_changed`       | read        | `news:read`  |
| `list_story_claims`            | read        | `news:read`  |
| `create_story_claim`           | write       | `news:write` |
| `update_claim_status`          | write       | `news:write` |
| `delete_story_claim`           | destructive | admin/editor |
| `list_story_evidence`          | read        | `news:read`  |
| `add_claim_evidence`           | write       | `news:write` |
| `delete_evidence`              | destructive | admin/editor |
| `get_story_timeline`           | read        | `news:read`  |
| `add_timeline_event`           | write       | `news:write` |
| `update_timeline_event`        | write       | `news:write` |
| `delete_timeline_event`        | destructive | admin/editor |
| `list_editorial_perspectives`  | read        | `news:read`  |
| `add_editorial_perspective`    | write       | `news:write` |
| `delete_editorial_perspective` | destructive | admin/editor |
| `add_knowledge_edge`           | write       | `news:write` |
| `delete_knowledge_edge`        | destructive | admin/editor |
| `query_knowledge_graph`        | read        | `news:read`  |
| `get_graph_neighborhood`       | read        | `news:read`  |
| `create_alert_rule`            | write       | `news:write` |
| `list_alert_rules`             | read        | `news:read`  |
| `update_alert_rule`            | write       | `news:write` |
| `delete_alert_rule`            | destructive | admin/editor |
| `evaluate_alerts`              | write       | `news:write` |
| `list_alert_triggers`          | read        | `news:read`  |
| `create_ingestion_feed`        | write       | `news:write` |
| `list_ingestion_feeds`         | read        | `news:read`  |
| `update_ingestion_feed`        | write       | `news:write` |
| `delete_ingestion_feed`        | destructive | admin/editor |
| `ingest_feed`                  | write       | `news:write` |
| `list_ingestion_items`         | read        | `news:read`  |
| `promote_ingestion_item`       | write       | `news:write` |
| `detect_breaking_news`         | read        | `news:read`  |
| `get_publisher_intelligence`   | read        | `news:read`  |
| `list_source_corrections`      | read        | `news:read`  |
| `record_source_correction`     | write       | `news:write` |
| `delete_source_correction`     | destructive | admin/editor |
| `get_block_catalog`            | read        | `news:read`  |
| `get_block_schema`             | read        | `news:read`  |

Tool descriptions are prefixed with `[READ-ONLY]`, `[WRITE]`, or `[DESTRUCTIVE]` so an agent can
plan its calls before invoking them.

---

## 6. Block catalog

`libs/schemas/src/block-registry.ts` publishes **46** block definitions. Each entry carries a
category (`text`, `media`, `data`, `map`, `interactive`, `context`, `evidence`, `specialized`), a
schema version, web/mobile/api/mcp capabilities, recommended article types, a minimal example, and
a JSON Schema generated by a dependency-free Zod → JSON Schema converter.

Intelligence-oriented blocks: `evidence`, `perspective`, `fact_check`, `interview`, `what_changed`.

Media expansion blocks: `video_gallery`, `podcast`, `waveform`, `transcript`, `dataset` — each
paired with an MCP tool (`add_video_gallery_block`, `add_podcast_block`, `add_waveform_block`,
`add_transcript_block`, `add_dataset_block`) so an external agent can author the same content a
human editor can.

The catalog is served from `GET /api/blocks`, the GraphQL `getBlockCatalog` query, and the
`get_block_catalog` / `get_block_schema` MCP tools, so an authoring agent can discover the exact
payload shape before writing a story.

**Renderer parity.** Every registered block type has a renderer on both the web
(`apps/web/src/components/story-blocks/`) and the mobile
(`apps/mobile/src/components/mobile-blocks/`) surface. `tests/unit/blocks/block-renderer-coverage.test.ts`
fails the build when a type is registered without a renderer, because an unrendered block is
silently dropped from the published article.

---

## 7. Persistence

New tables (all carry `organizationId`):

| Table                    | Purpose                                                              |
| :----------------------- | :------------------------------------------------------------------- |
| `story_claims`           | Atomic claims with status, confidence, and reviewer metadata         |
| `evidence`               | Evidence items linked to stories, claims, sources, and citations     |
| `story_timeline_events`  | Dated developments with location, coordinates, entities, and sources |
| `editorial_perspectives` | Attributed positions with stance and quote excerpt                   |
| `knowledge_edges`        | Typed graph edges (unique per organization + endpoints + relation)   |
| `alert_rules`            | Deterministic rule definitions with conditions and cooldown          |
| `alert_triggers`         | Fired alerts with matched conditions and delivered channels          |
| `ingestion_feeds`        | Registered feeds with poll interval and ETag/Last-Modified           |
| `ingestion_items`        | Fetched items with dedupe hash, signals, and status                  |
| `source_corrections`     | Correction / retraction / clarification / update ledger              |

`events` gained `category`, `severity`, and `metadata`; `publishers` gained `ownership`,
`methodology`, `correctionPolicyUrl`, `foundedYear`, and `metadata`.

The migration lives in
`libs/database/prisma/migrations/20261020_intelligence_platform/migration.sql` and is fully
additive (new tables plus `ADD COLUMN IF NOT EXISTS`), so existing deployments upgrade in place.

Both engines implement the new repositories: `MemoryIntelligenceRepository` (tests / local dev)
and `PrismaIntelligenceRepository` (PostgreSQL), with the Prisma implementation falling back to
memory when the client is unavailable. The `DatabaseService` exposes them as
`db.storyIntelligence`, `db.alerts`, `db.knowledgeGraph`, `db.ingestion`, and
`db.sourceCorrections`, and participates in transaction snapshot/restore.

---

## 8. Background jobs

New job types (`libs/jobs/src/job-types.ts`) with handlers in `apps/worker/src/worker.service.ts`:

| Job type                   | Payload                                                  | Result                                                   |
| :------------------------- | :------------------------------------------------------- | :------------------------------------------------------- |
| `ingestion.fetch_feed`     | `{ feedId?, organizationId, actorId? }`                  | Feeds polled, items fetched/created/duplicates/clustered |
| `alerts.evaluate`          | `{ resourceType, resourceId, organizationId, actorId? }` | Rules evaluated, triggers fired                          |
| `intelligence.index_story` | `{ storyId, organizationId, actorId? }`                  | Graph edges materialized for the story                   |

The worker bootstrap (`apps/worker/src/main.ts`) starts two repeating sweeps:

| Sweep            | Default interval | Env override                        | Behaviour                                                                    |
| :--------------- | :--------------- | :---------------------------------- | :--------------------------------------------------------------------------- |
| Ingestion poll   | 15 minutes       | `INGESTION_POLL_INTERVAL_MINUTES`   | Enqueues `ingestion.fetch_feed` for every organization that owns a feed      |
| Alert evaluation | 5 minutes        | `ALERT_EVALUATION_INTERVAL_MINUTES` | Enqueues `alerts.evaluate` for recently updated stories of each organization |

Both sweeps enumerate tenant IDs explicitly (`db.ingestion.listOrganizationIds()`) and stamp every
enqueued job with its own `organizationId`, so tenant isolation is preserved end to end.

---

## 9. Security summary

- **Authentication** — every REST route sits behind `NestAuthGuard`; MCP tools call
  `AuthService.requireScope` / `requireRole`; GraphQL mutations require a principal.
- **Tenant isolation** — every repository call is organization-scoped, and services re-check
  ownership of stories, claims, sources, publishers, and feeds before writing.
- **Input validation** — every payload is parsed with Zod before it reaches a service.
- **SSRF** — feed URLs reuse the webhook URL validator (protocol, localhost, private, loopback,
  link-local, and metadata addresses are rejected); fetches are time- and size-bounded.
- **Injection / XSS** — story content is stored as structured blocks; the ingestion parser strips
  `<script>`, `<style>`, and HTML tags from feed text before persistence.
- **Rate limiting** — the global Fastify rate limiter applies to all new routes.
- **Audit trail** — services write audit records (`db.audit.log`) for every mutation with the
  acting principal, action, resource, and a payload summary. Audit failures never break an
  editorial write.

---

## 10. Story following and cluster continuity

Readers can follow a **story**, a **story cluster**, a topic, an entity, an author, a source, or an
event. The historic target types (`topic`, `entity`, `author`, `source`) are unchanged; `story`,
`cluster`, and `event` are additive.

**Cluster continuity.** Following a story also follows that story's _cluster_, so when a new
article is published into the same cluster the reader keeps following the evolving story without
following every new article. The expansion happens at read time
(`resolveFollowedStoryScope` in `libs/stories/src/user.service.ts`), so the stored follow records
stay minimal and a follow is never silently widened on disk.

**Signals.** The personalized feed boosts a followed story (+45, reason _"Following this story"_)
and a new article in a followed cluster (+30, reason _"New update in a story you follow"_), with
matching attribution signals (`followed_story`, `cluster_continuity`).

**Notifications.** A new timeline development on a followed story (or a cluster member of a
followed story) creates a `story_update` notification for each follower, closing the loop:

```text
Follow → New development → New article → Timeline update → Notification
```

**Surfaces.** `POST /api/users/follow` (any target type), `DELETE /api/users/follow/:type/:id`,
`GET /api/users/following`, `GET /api/users/following/resolved` (labels, details, and link paths
so the UI never resolves identifiers itself), and the MCP `follow_interest` / `unfollow_interest`
tools. The story page carries a **Follow** toggle, and `/following` shows what the reader follows
plus the developments on it.

## 11. Story dashboard

The intelligence payload is also rendered for humans at
`/stories/{slug}/intelligence` (`apps/web/src/app/stories/[slug]/intelligence/page.tsx`), reachable
from the story page through the **Story intelligence** button.

The dashboard has seven tabs over the same data the API serves:

| Tab          | Content                                                             |
| :----------- | :------------------------------------------------------------------ |
| Overview     | What changed (version diff, latest development)                     |
| Timeline     | Dated developments with type, location, and sources                 |
| Evidence     | Claims with status, confidence + methodology, and attached evidence |
| Data         | The story's data-bearing blocks (chart, map, table, dataset, …)     |
| Sources      | Source IDs backing the story                                        |
| Perspectives | Attributed positions with stance and quotes                         |
| Entities     | Linked entities, linked to their entity pages                       |

Above the tabs, the dashboard shows the story metrics (sources, claims, supported, contested,
evidence, timeline, perspectives, updates) so an editor sees the same numbers an agent does.

## 12. Evidence chain queries (§7)

The documented chain is queryable in both directions:

| Chain            | Query                        | REST                                  | GraphQL            | MCP                  |
| :--------------- | :--------------------------- | :------------------------------------ | :----------------- | :------------------- |
| Claim → Evidence | `getClaimEvidence(claimId)`  | `GET /api/claims/:claimId/evidence`   | `getClaimEvidence` | `get_claim_evidence` |
| Source → Claims  | `getSourceClaims(sourceId)`  | `GET /api/sources/:sourceId/claims`   | `getSourceClaims`  | `get_source_claims`  |
| Entity → Stories | `getEntityStories(entityId)` | `GET /api/entities/:entityId/stories` | `getEntityStories` | `get_entity_stories` |

Every query is organization-scoped: a claim, source, or entity owned by another tenant resolves
as _not found_ rather than leaking.

## 13. Global event map (§13)

`GET /api/events/map` returns the points a map layer renders — located events filtered by
category, severity, status, time window, and bounding box, each carrying the counts a legend and a
detail panel need (related stories, sources, entities). `GET /api/events/map/heatmap` aggregates
the same events into geographic grid cells for density/clustering layers.

Also available as the GraphQL `getEventMap` / `getEventHeatmap` queries and the `get_event_map`
MCP tool (`heatmap: true` switches to aggregated cells).

## 14. Ingestion enrichment (§37)

The ingestion pipeline is explicit and provider-neutral:

```text
Source → Fetcher → Normalizer → Deduplicator → Entity Extraction →
Topic Classification → Story Clustering → Claim Extraction → Source Linking →
Editorial Review → GlobalPulse
```

The interpretation stages (entity extraction, topic classification, claim extraction) run through a
pluggable `IngestionEnrichmentProvider`. The default provider is **deterministic** — entity
names/aliases are matched against the text, topics are scored by token overlap, and candidate
claims are segmented out of the summary. No LLM is required, and an AI-backed provider can be
substituted without touching the pipeline.

## 15. Newsroom analytics (§43)

`GET /api/analytics/newsroom` now also reports content, editorial, and story-intelligence
metrics, each one explainable (no opaque score):

| Metric                                                   | Meaning                                                               |
| :------------------------------------------------------- | :-------------------------------------------------------------------- |
| `storyVelocityPerDay`                                    | Published stories per day over the last seven days                    |
| `sourceDiversity`                                        | Average distinct sources per published story                          |
| `updateFrequency`                                        | Average story versions (updates) per published story                  |
| `avgDraftToPublishHours`                                 | Average hours from first draft to publication                         |
| `avgReviewTimeHours`                                     | Average hours between _submit for review_ and _approve_ (audit trail) |
| `correctionCount` / `retractionCount` / `correctionRate` | Corrections per published story                                       |
| `claimCount` / `evidenceCount` / `evidenceCoverage`      | Claims, evidence, and the share of claims carrying evidence           |
| `timelineEventCount`                                     | Recorded developments                                                 |
| `entityActivity`                                         | Average distinct entities per published story                         |

## 17. Delivery transports and per-user alert rules

Alert rules declare the channels they want (`in_app`, `push`, `email`, `webhook`) and each
channel is a **real transport** (`libs/stories/src/delivery.service.ts`) rather than a recorded
intention:

| Channel   | Transport                  | Behaviour                                                                               |
| :-------- | :------------------------- | :-------------------------------------------------------------------------------------- |
| `in_app`  | `InAppDeliveryTransport`   | Persists the notification in the store                                                  |
| `push`    | `PushDeliveryTransport`    | Live push on the recipient's realtime channel (`user_<id>`)                             |
| `webhook` | `WebhookDeliveryTransport` | HTTP POST with an HMAC-SHA256 signature to the registered endpoints (`alert.triggered`) |
| `email`   | `EmailDeliveryTransport`   | Uses an injectable mail sender — no ESP is assumed                                      |

A trigger now reports the channels that **actually delivered** (`deliveredChannels`), and a
failing transport never breaks the operation that triggered the alert.

**Personal vs. newsroom rules.** `scope: 'organization'` (default) creates a newsroom-wide rule;
`scope: 'user'` creates a personal rule owned by the caller. A reader sees the organization-wide
rules plus their own, and a personal rule only fires for its owner. Changing the scope moves the
rule between the reader and the newsroom.

## 18. Reader notification delivery

Follower updates are delivered per reader, not broadcast to the newsroom:

- `NotificationService.notifyFollowersOfStory()` records a `story_update` notification addressed
  to each follower and pushes it on the reader's personal realtime channel (`user_<id>`).
- `GET /api/notifications/mine` returns only the signed-in reader's notifications.
- The realtime channel guard allows a reader to subscribe to their own `user_*` channel (admins may
  subscribe to any), so nobody can listen to another reader's updates.
- The MCP tool `get_my_notifications` exposes the same list to an agent acting as a reader.
- The web **Following** page lists what the reader follows and the developments on it.

## 19. Tests

| Suite                                                         | Coverage                                                                                          |
| :------------------------------------------------------------ | :------------------------------------------------------------------------------------------------ |
| `tests/unit/intelligence/intelligence.service.test.ts`        | Claims, evidence rules, confidence methodology, timeline, perspectives, tenant isolation, deletes |
| `tests/unit/intelligence/knowledge-graph.service.test.ts`     | Edges, bounded traversal, story indexing idempotency, tenant isolation                            |
| `tests/unit/intelligence/alert.service.test.ts`               | Rule CRUD, condition semantics, cooldown, disabled rules                                          |
| `tests/unit/intelligence/ingestion.service.test.ts`           | RSS/Atom/JSON parsing, SSRF rejection, dedupe, clustering, promotion, breaking candidates         |
| `tests/unit/intelligence/source-intelligence.service.test.ts` | Publisher metrics, correction ledger, tenant isolation                                            |
| `tests/unit/blocks/block-registry.test.ts`                    | Catalog integrity and Zod → JSON Schema conversion                                                |
| `tests/unit/blocks/media-expansion-blocks.test.ts`            | Video gallery, podcast, waveform, transcript, and dataset block schemas                           |
| `tests/unit/blocks/block-renderer-coverage.test.ts`           | Every registered block has a web **and** a mobile renderer                                        |
| `tests/unit/worker/intelligence-jobs.test.ts`                 | Worker handlers and scheduler wiring                                                              |
| `tests/integration/api/intelligence-api.test.ts`              | REST surface: RBAC, validation, evidence rule, tenant isolation, block catalog                    |
| `tests/integration/graphql/graphql-intelligence.test.ts`      | GraphQL queries/mutations, error envelopes, authentication                                        |
| `tests/integration/mcp/intelligence-tools.test.ts`            | Tool discovery and end-to-end MCP flows                                                           |
| `tests/integration/mcp/media-expansion-tools.test.ts`         | Media expansion tools add real blocks to a story                                                  |
| `tests/unit/stories/story-following.test.ts`                  | Story/cluster/event follows, cluster continuity, feed boost, follower notifications               |
| `tests/integration/api/story-following-api.test.ts`           | Follow endpoints accept the new target types                                                      |
| `tests/e2e/ai-agent-earthquake-workflow.e2e.test.ts`          | Full §61 workflow: AI agent drafts → human rejects, corrects, approves, publishes                 |
| `tests/unit/intelligence/evidence-chain.test.ts`              | Claim → evidence, source → claims, entity → stories, tenant scoping                               |
| `tests/unit/events/event-map.test.ts`                         | Map points, filters (category/severity/time/bbox), heatmap aggregation, tenant isolation          |
| `tests/unit/stories/editorial-analytics.test.ts`              | Velocity, diversity, draft-to-publish, review time, corrections, evidence coverage                |
| `tests/unit/intelligence/ingestion-enrichment.test.ts`        | Deterministic entity/topic/claim extraction and the pluggable provider contract                   |
| `tests/integration/api/intelligence-extensions.test.ts`       | REST + GraphQL for the evidence chain, event map, reader notifications, analytics                 |

Run them with:

```bash
pnpm vitest run tests/unit/intelligence tests/unit/blocks/block-registry.test.ts \
  tests/unit/worker/intelligence-jobs.test.ts \
  tests/integration/api/intelligence-api.test.ts \
  tests/integration/graphql/graphql-intelligence.test.ts \
  tests/integration/mcp/intelligence-tools.test.ts
```
