# Structured Content Model & Block System

This document outlines the structured block content model, discriminant union architecture, and full catalog of all 46 supported block types in **GlobalPulse**.

---

## 1. Architectural Philosophy: Structured Blocks vs. Unstructured Blobs

Traditional CMS platforms store monolithic HTML or raw Markdown blobs. In contrast, GlobalPulse treats journalism as a **composable tree of strongly-typed structured blocks**.

### Benefits for External AI Agents:

1. **Targeted Updates**: An external agent can update a single chart or append a correction without rewriting the entire article.
2. **Deterministic Validation**: Every block adheres to strict Zod schema constraints. Hallucinated or malformed properties fail at the validation boundary.
3. **Cross-Platform Rendering**: The same JSON block payload compiles to responsive Web SVG (D3/MapLibre), Native Mobile components (React Native `<View>`), or 4K Ultrawide layouts.

---

## 2. Complete Catalog of 46 Supported Block Types

Every block contains common envelope metadata:

- `id`: Unique block identifier (e.g. `blk_chart_settlement_2026`).
- `storyVersionId`: Reference to parent story revision.
- `blockType`: Discriminant identifier.
- `sortOrder`: Zero-indexed integer defining presentation sequence.
- `data`: Type-safe payload specific to the `blockType`.

The **authoritative list is the block registry** (`libs/schemas/src/block-registry.ts`), which is
also served live as `GET /api/blocks`, the GraphQL `getBlockCatalog` query, and the
`get_block_catalog` / `get_block_schema` MCP tools. Every entry carries a category, a schema
version, web/mobile/api/mcp capabilities, a minimal example, and a JSON Schema generated from the
Zod definition — so an external agent can build a valid block without knowing any React internals.

### 2.1 Text blocks (5)

1. **`heading`**: Section breaks (`level: 1 | 2 | 3 | 4`, `text`, optional `subtext`).
2. **`paragraph`**: Editorial copy (`text`, `format: 'markdown' | 'plain'`).
3. **`summary`**: Executive takeaway bullet points (`headline`, `bulletPoints: string[]`).
4. **`quote`**: Direct attribution quotes (`quote`, `attribution`, `title`, `sourceUrl`).
5. **`callout`**: Contextual editorial sidebars (`style: 'info' | 'warning' | 'tip' | 'critical'`, `title`, `text`).

### 2.2 Media blocks (12)

6. **`image`**: Photographic assets (`url`, `altText`, `caption`, `credit`, `aspectRatio`).
7. **`gallery`**: Photo essays and carousels (`layout: 'grid' | 'carousel' | 'masonry'`, `images[]` with per-item `credit`).
8. **`annotated_image`**: Image with percentage-positioned annotations (`annotations[]` with `xPercent`, `yPercent`, `label`).
9. **`image_diff`**: Before/after comparison (`beforeUrl`, `afterUrl`, `orientation`, `defaultSplitPercent`).
10. **`video`**: Streamable video (`url`, `posterUrl`, `durationSeconds`, `chapters[]`, `transcriptSegments[]`).
11. **`video_gallery`**: Several videos in one block, each with poster art, chapters, and transcript segments.
12. **`audio`**: Audio briefings and podcasts (`url`, `title`, `narrator`, `cuePoints[]`, `chapters[]`, `speakers[]`, `transcript`).
13. **`podcast`**: Podcast show with episodes (`episodes[]` with episode/season numbers, artwork, transcripts, chapters, speakers).
14. **`waveform`**: Audio/video waveform (`mediaUrl`, `peaks[]` normalized amplitude samples, `segments[]` that can reference other blocks).
15. **`transcript`**: Timestamped transcript with speaker attribution, linked to the media it belongs to.
16. **`slide_deck`**: Interactive slide presentations (`title`, `slides[]`).
17. **`embed`**: External media, social posts, and third-party content (`provider`, `url`, `title`).

### 2.3 Data & quantitative blocks (10)

18. **`chart`**: Programmatic D3 visualization (`chartType` covering line, area, bar, stacked/grouped bar, pie, donut, scatter, histogram, heatmap, waterfall, comparison, slope, bump, dot plot, lollipop, diverging bar, radar, small multiples, sparkline).
19. **`table`**: Structured tabular data (`headers`, `rows`, optional `caption`/`footer`).
20. **`data_explorer`**: Filter/sort/metric-switchable dataset with CSV download (`dimensions[]`, `metrics[]`, `rows[]`, `filters[]`).
21. **`statistic`**: High-impact KPI metrics (`value`, `label`, `unit`, `trend`, `comparison`, `period`, `context`).
22. **`ranking`**: Ranked lists with rank movement (`items[]` with `rank`, `previousRank`, `value`, `methodology`).
23. **`financial`**: Financial metrics with currency, as-of timestamp, change, and historical series.
24. **`election`**: Results, seats, vote share, turnout, seat change, and historical comparison.
25. **`disaster`**: Earthquakes, storms, floods, fires (`metrics[]` with timestamps and sources, `affectedAreas[]`, `updates[]`).
26. **`science`**: Measurements, findings, equations, authors, institutions, and paper links.
27. **`dataset`**: Published dataset with columns, preview rows, download formats, license, and methodology.

### 2.4 Map, timeline & diagram blocks (4)

28. **`map`**: MapLibre geospatial maps (`mapType: 'points' | 'choropleth' | 'heatmap' | 'route' | 'comparison'`, markers, GeoJSON overlays).
29. **`timeline`**: Chronological milestone sequences with entities, sources, citations, and media.
30. **`diagram`**: Declarative Mermaid or SVG diagrams (`format`, `definition`).
31. **`flow`**: Step-by-step processes with branches, statuses, and citations.

### 2.5 Interactive blocks (5)

32. **`live_ticker`**: Continuously updating market/news ticker with sparklines.
33. **`live_data`**: Independently refreshing values with provider, refresh interval, and last-updated timestamps.
34. **`calculator`**: Structured inputs and expressions with units, explanation, and assumptions.
35. **`poll`**: Reader polls with options, vote counts, and expiry.
36. **`document_viewer`**: Primary document viewer (`documentUrl`, `pageCount`, `documentType`, `highlights[]`).

### 2.6 Evidence, source & context blocks (10)

37. **`citation`**: A specific assertion linked to primary sources (`claim`, `sourceIds`, `quoteExcerpt`).
38. **`evidence`**: Claims with verification status, confidence methodology, and supporting/contradicting material.
39. **`perspective`**: Documented perspectives anchored to their sources (no forced two-sides frame).
40. **`fact_check`**: Claim-level fact-check verdict with reviewer and methodology.
41. **`source`**: Primary source citation card (`sourceId`, `url`, `publisher`, `publishedAt`).
42. **`entity`**: Named entity card (`entityId`, `name`, `type`, `description`, `avatarUrl`).
43. **`related_stories`**: Curated dispatches on the same narrative arc (`title`, `storyIds`).
44. **`what_changed`**: Revision diff between two story versions.
45. **`comparison`**: Two-option comparison card (`subjectA`, `subjectB`).
46. **`interview`**: Structured Q&A with speaker, optional media, per-segment timestamps, and sources.

### 2.7 Renderer parity

Every registered block type has a renderer on **both** the web and the mobile surface. A test
(`tests/unit/blocks/block-renderer-coverage.test.ts`) fails the build if a type is added to the
registry without a matching renderer, because a missing renderer would silently drop content
from the published article.

---

## 3. Extending the Block Model

Adding a new block type (e.g. `financial_terminal`) requires zero database migrations due to JSONB storage:

```typescript
// 1. In libs/schemas/src/story.ts
export const FinancialTerminalBlockDataSchema = z.object({
  ticker: z.string(),
  currentPrice: z.number(),
  currency: z.string().default('USD'),
  sparkline: z.array(z.number()),
});

export const FinancialTerminalBlockSchema = BaseStoryBlockSchema.extend({
  blockType: z.literal('financial_terminal'),
  data: FinancialTerminalBlockDataSchema,
});
```
