# Remote MCP Tools Catalog (Complete Section 38 Specifications)

This document provides complete reference specifications for all 18 Section 38 MCP tools registered on the **GlobalPulse Remote MCP Server**.

---

## 1. Story Editorial & Versioning Tools

### `create_story`

Creates a new draft news story with structured blocks and cryptographic provenance.

- **Scope Required**: `news:write`
- **Parameters**:
  - `title` (string, 5-300 chars): Headline of the article.
  - `summary` (string, 10-2000 chars): Executive summary.
  - `articleType` (string): e.g. `breaking_news`, `developing_story`, `investigation`, `analysis`.
  - `blocks` (array of StoryBlocks): Initial block sequence conforming to canonical schema.
  - `topicIds` (optional array of strings): Associated taxonomy IDs.
  - `entityIds` (optional array of strings): Profiled named entities.
  - `sourceIds` (optional array of strings): Verified primary sources.
  - `idempotencyKey` (optional string): Prevent duplicate creation on retry.

### `get_story`

Retrieves a story by ID or slug, including all structured blocks, sources, and revision metadata.

- **Scope Required**: `news:read`
- **Parameters**: `id` (string)

### `update_story`

Updates a draft story's headline, summary, or metadata.

- **Scope Required**: `news:write`
- **Parameters**: `id` (string), `title` (optional), `summary` (optional), `blocks` (optional)

### `create_story_version`

Creates an incremented version snapshot with an optional `what_changed` revision block.

- **Scope Required**: `news:write`
- **Parameters**: `storyId` (string), `blocks` (array of StoryBlocks), `whatChanged` (optional WhatChangedData), `title` (optional), `summary` (optional)

### `publish_story`

Publishes a draft story, updating status to `PUBLISHED` and broadcasting to Web, Mobile, and 4K display walls.

- **Scope Required**: `news:publish`
- **Parameters**: `storyId` (string), `idempotencyKey` (optional string)

### `retract_story`

Issues an editorial retraction on a published story with a mandatory editorial justification banner.

- **Scope Required**: `news:publish`
- **Parameters**: `storyId` (string), `reason` (string, min 10 chars)

---

## 2. Block Mutation Tools

### `append_blocks`

Appends one or more structured blocks to the end of a story's block sequence.

- **Scope Required**: `news:write`
- **Parameters**: `storyId` (string), `blocks` (array of StoryBlocks)

### `replace_block`

Replaces a specific block within a story without altering other blocks.

- **Scope Required**: `news:write`
- **Parameters**: `storyId` (string), `blockId` (string), `block` (StoryBlock)

### `remove_block`

Deletes a specific block from a story.

- **Scope Required**: `news:write`
- **Parameters**: `storyId` (string), `blockId` (string)

---

## 3. Search & Intelligence Discovery Tools

### `search_stories`

Executes hybrid lexical and semantic search across stories with filtering.

- **Scope Required**: `news:read`
- **Parameters**: `query` (string), `topicId` (optional), `status` (optional), `limit` (optional integer, 1-100)

### `find_similar_stories`

Calculates Jaccard token similarity to detect potential duplicate coverage on breaking news.

- **Scope Required**: `news:read`
- **Parameters**: `text` (string), `threshold` (optional number, 0.0-1.0, default 0.4)

---

## 4. Primary Source & Fact-Checking Tools

### `create_source`

Registers a primary source with publisher, retrieval timestamp, and permissible excerpt.

- **Scope Required**: `news:write`
- **Parameters**: `url` (string, URL format), `title` (string), `publisher` (string), `permissibleExcerpt` (optional string), `sourceType` (optional string)

### `attach_source`

Associates an existing primary source to a story.

- **Scope Required**: `news:write`
- **Parameters**: `storyId` (string), `sourceId` (string)

---

## 5. Knowledge Graph & Taxonomy Tools

### `create_entity`

Registers a named person, organization, country, or technology.

- **Scope Required**: `news:write`
- **Parameters**: `name` (string), `type` (string), `description` (optional), `aliases` (optional array of strings)

### `get_entity`

Retrieves an entity dossier with all referenced stories and developing events.

- **Scope Required**: `news:read`
- **Parameters**: `id` (string)

### `create_event`

Registers a real-world developing event with geographic epicenter coordinates.

- **Scope Required**: `news:write`
- **Parameters**: `title` (string), `summary` (string), `occurredAt` (string, ISO timestamp), `location` (optional), `coordinates` (optional `[lng, lat]`)

### `get_event`

Retrieves an event milestone sequence, geographic coordinates, and participating entities.

- **Scope Required**: `news:read`
- **Parameters**: `id` (string)

---

## 6. Background Processing & Media Tools

### `render_chart`

Validates and compiles a D3 chart data structure into a clean SVG representation.

- **Scope Required**: `news:read`
- **Parameters**: `chartData` (ChartBlockData), `width` (optional integer), `height` (optional integer)

### `synthesize_audio_briefing`

Enqueues a text-to-speech audio briefing generation job for a story.

- **Scope Required**: `news:write`
- **Parameters**: `storyId` (string), `voice` (optional string, e.g. `news_anchor_f`, `diplomatic_briefing_m`)

---

## 7. Intelligence Platform Tools (Claims, Graph, Alerts, Ingestion, Source Trust)

The remote MCP server also registers **40 intelligence tools** covering first-class claims and
evidence, story timelines, editorial perspectives, the knowledge graph, deterministic alert rules,
feed ingestion, publisher transparency, and the block catalog.

- **Scope Required**: `news:read` for reads, `news:write` for writes; destructive tools
  (`delete_*`) additionally require the `admin` or `editor` role.
- **Tenant safety**: every call is scoped to the calling principal's organization; cross-tenant
  identifiers resolve as "not found".

| Group              | Tools                                                                                                                                                                                      |
| :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Story intelligence | `get_story_intelligence`, `get_story_what_changed`                                                                                                                                         |
| Claims & evidence  | `list_story_claims`, `create_story_claim`, `update_claim_status`, `delete_story_claim`, `list_story_evidence`, `add_claim_evidence`, `delete_evidence`                                     |
| Timeline           | `get_story_timeline`, `add_timeline_event`, `update_timeline_event`, `delete_timeline_event`                                                                                               |
| Perspectives       | `list_editorial_perspectives`, `add_editorial_perspective`, `delete_editorial_perspective`                                                                                                 |
| Knowledge graph    | `add_knowledge_edge`, `delete_knowledge_edge`, `query_knowledge_graph`, `get_graph_neighborhood`                                                                                           |
| Alerts             | `create_alert_rule`, `list_alert_rules`, `update_alert_rule`, `delete_alert_rule`, `evaluate_alerts`, `list_alert_triggers`                                                                |
| Ingestion          | `create_ingestion_feed`, `list_ingestion_feeds`, `update_ingestion_feed`, `delete_ingestion_feed`, `ingest_feed`, `list_ingestion_items`, `promote_ingestion_item`, `detect_breaking_news` |
| Source trust       | `get_publisher_intelligence`, `list_source_corrections`, `record_source_correction`, `delete_source_correction`                                                                            |
| Block catalog      | `get_block_catalog`, `get_block_schema`                                                                                                                                                    |
| Media expansion    | `add_video_gallery_block`, `add_podcast_block`, `add_waveform_block`, `add_transcript_block`, `add_dataset_block`                                                                          |
| Live data & feeds  | `add_live_data_block`, `set_live_feed`, `get_live_feed`, `list_live_feeds`                                                                                                                 |
| Reader polls       | `cast_poll_vote`, `get_poll_results`                                                                                                                                                       |
| Interactive        | `add_what_if_block`, `add_live_comments_block`, `add_quiz_block`                                                                                                                           |
| Context            | `add_knowledge_graph_block`                                                                                                                                                                |
| Map                | `add_animated_map_block`                                                                                                                                                                   |
| Analysis           | `add_uncertainty_block`, `add_sensitivity_block`, `add_prediction_leaderboard_block`, `add_correlation_block`                                                                              |

### Estimates with confidence intervals

`add_uncertainty_block` adds a set of estimates with the interval each one sits in. Use it
whenever a number is an estimate rather than a measurement — a forecast, a survey, a model
output. Every other chart in the platform asserts a point estimate with no error bars.

```jsonc
// add_uncertainty_block
{
  "title": "Projected electricity demand, 2030",
  "unit": "TWh",
  "intervalLabel": "95% credible interval",
  "points": [
    {
      "label": "IEA",
      "value": 9400,
      "low": 8800,
      "high": 10100,
      "n": 12000,
      "sourceId": "src_iea",
    },
  ],
  "referenceValue": 9000,
  "referenceLabel": "2025 level",
  "methodology": "5th-95th percentile across 12,000 scenario draws.",
}
```

### Sensitivity analysis

`add_sensitivity_block` gives a base case, a range for each input, and the expression that
produces the output. The platform varies one input at a time and shows which assumption
actually drives the result.

```jsonc
// add_sensitivity_block
{
  "title": "What drives the cost of a 50 MW solar farm?",
  "outputLabel": "Total capital cost",
  "outputUnit": "$m",
  "baseOutput": 40,
  "expression": "capacity * panel_cost + labour + grid_connection",
  "inputs": [
    {
      "id": "capacity",
      "label": "Installed capacity",
      "base": 50,
      "low": 45,
      "high": 55,
      "unit": "MW",
    },
  ],
}
```

The expression is evaluated in a restricted arithmetic sandbox: only `+ - * / ( )` and the
input identifiers are accepted. An input the expression never mentions is excluded from the
chart and the exclusion is reported — it cannot move the outcome.

### Prediction leaderboards

`add_prediction_leaderboard_block` tracks forecasts with a probability and, once resolved,
an outcome. The platform scores forecasters by Brier score (lower is better) and reports
their calibration, so a forecaster who is confidently wrong is visible as such.

```jsonc
// add_prediction_leaderboard_block
{
  "title": "Who called it? Forecasters on AGI capability",
  "predictions": [
    {
      "id": "p1",
      "claim": "An AGI-capable system is announced before 2027",
      "forecaster": "Desk A",
      "probability": 0.8,
      "resolved": true,
      "outcome": 1,
    },
  ],
}
```

Only resolved predictions count towards a score — an open prediction says nothing about a
forecaster's track record yet.

### Animated maps

`add_animated_map_block` adds a map that moves through time. The reader scrubs through the
frames, so the story shows how a situation spread rather than only its end state.

```jsonc
// add_animated_map_block
{
  "title": "How the outbreak spread",
  "valueLabel": "Confirmed cases",
  "unit": "cases",
  "frames": [
    {
      "at": "2026-03-01",
      "label": "1 March",
      "points": [{ "id": "p1", "label": "Northern coast", "lng": 34.5, "lat": 41.2, "value": 12 }],
    },
    {
      "at": "2026-03-08",
      "label": "8 March",
      "points": [{ "id": "p1", "label": "Northern coast", "lng": 34.5, "lat": 41.2, "value": 180 }],
    },
  ],
}
```

### Knowledge graphs

`add_knowledge_graph_block` draws the entities behind a story. Nodes are typed and edges carry
a named relationship, so the picture says _how_ things are connected rather than just that
they are.

```jsonc
// add_knowledge_graph_block
{
  "title": "Who is connected to whom",
  "nodes": [
    { "id": "n1", "label": "Northwind Energy", "type": "company" },
    { "id": "n2", "label": "Ada Okafor", "type": "person" },
  ],
  "edges": [{ "id": "e1", "from": "n2", "to": "n1", "relation": "directs" }],
  "focusNodeId": "n1",
}
```

### Knowledge checks

`add_quiz_block` adds a reader-facing knowledge check. Every question carries an explanation
that is revealed once the reader has answered, so the block teaches rather than only scoring.

```jsonc
// add_quiz_block
{
  "title": "Test your understanding",
  "questions": [
    {
      "id": "q1",
      "question": "What did the study measure?",
      "options": [
        { "id": "a", "text": "Training cost only", "correct": false },
        { "id": "b", "text": "Inference cost across three model sizes", "correct": true },
      ],
      "explanation": "The report covers inference cost at 7B, 13B and 70B parameters.",
    },
  ],
}
```

### Correlation analysis

`add_correlation_block` supplies the **raw observations**; the platform derives the Pearson
coefficients, the sample sizes and the significance. Supplying the data rather than the
coefficients is what lets a reader see how well-evidenced each relationship is.

```jsonc
// add_correlation_block
{
  "title": "What moves with what?",
  "variables": [
    { "key": "gpu_price", "label": "GPU price", "unit": "$" },
    { "key": "latency", "label": "Latency", "unit": "ms" },
  ],
  "observations": [
    { "gpu_price": 1200, "latency": 88 },
    { "gpu_price": 2400, "latency": 71 },
  ],
  "significanceThreshold": 0.05,
}
```

### Scenario explorers and live comment threads

`add_what_if_block` gives the reader sliders over a range for each input, and the outcome
recomputes live from the expressions you supply.

```jsonc
// add_what_if_block
{
  "title": "What would it take to cut household energy bills by a fifth?",
  "outcomeLabel": "Average household bill",
  "outcomeUnit": "$/year",
  "expression": "base_bill * (1 - insulation_saving) * (1 - solar_saving)",
  "inputs": [
    {
      "id": "base_bill",
      "label": "Current average bill",
      "min": 800,
      "max": 4000,
      "step": 50,
      "defaultValue": 1800,
      "unit": "$",
    },
  ],
  "breakdown": [{ "label": "Solar contribution", "expression": "base_bill * solar_saving" }],
}
```

`add_live_comments_block` puts the reader discussion inside the article body. The thread
loads on mount and updates over the story's realtime channel.

```jsonc
// add_live_comments_block
{
  "title": "What readers are saying",
  "maxComments": 10,
  "showCta": true,
}
```

### Chart annotations

`add_chart_block` accepts an optional `annotations` array. Each annotation anchors to a
data point by the value of the chart's x-axis key, and carries a label plus the body text
revealed when the reader opens it.

```jsonc
{
  "chartType": "line",
  "annotations": [
    {
      "id": "ann_superconduct",
      "xValue": "4000",
      "seriesKey": "quantum",
      "label": "Superconducting regime",
      "body": "Error rates fall sharply once the model enters the superconducting phase.",
    },
  ],
}
```

### Live feeds

`set_live_feed` publishes the current values for a named feed. A `live_data` or
`live_ticker` block that carries the same `liveKey` then shows those values to readers, and
is patched in place over the realtime channel as soon as the feed changes — the story does
not have to be republished.

```jsonc
// set_live_feed
{
  "key": "markets",
  "title": "Markets",
  "provider": "GlobalPulse Markets Desk",
  "refreshIntervalSeconds": 30,
  "items": [
    {
      "id": "brent",
      "label": "Brent Crude",
      "value": 82.4,
      "previousValue": 80.1,
      "change": 2.87,
      "unit": "$",
      "sparkline": [79.8, 80.4, 81.1, 82.4],
    },
  ],
}
```

Feeds are persisted, so a published story still resolves its feed after a deploy and the
API and the MCP server always operate on the same feed.

### Reader polls

`cast_poll_vote` records a reader's vote on a `poll` block. A reader has at most one vote
per poll; casting again replaces the previous choice rather than adding a second vote. The
tally is broadcast over the story's realtime channel, so every reader watching the story
sees the same live consensus.

Tool descriptions are prefixed with `[READ-ONLY]`, `[WRITE]`, or `[DESTRUCTIVE]` so agents can
plan their calls. Full reference:
[`docs/intelligence-platform.md`](file:///c:/Users/chaha/Projects/ai-news-generator/docs/intelligence-platform.md).
