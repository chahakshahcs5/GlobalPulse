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
