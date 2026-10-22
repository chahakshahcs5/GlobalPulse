# Structured Content Model & Block System

This document outlines the structured block content model, discriminant union architecture, and full catalog of all 66 supported block types in **GlobalPulse**.

---

## 1. Architectural Philosophy: Structured Blocks vs. Unstructured Blobs

Traditional CMS platforms store monolithic HTML or raw Markdown blobs. In contrast, GlobalPulse treats journalism as a **composable tree of strongly-typed structured blocks**.

### Benefits for External AI Agents:

1. **Targeted Updates**: An external agent can update a single chart or append a correction without rewriting the entire article.
2. **Deterministic Validation**: Every block adheres to strict Zod schema constraints. Hallucinated or malformed properties fail at the validation boundary.
3. **Cross-Platform Rendering**: The same JSON block payload compiles to responsive Web SVG (D3/MapLibre), Native Mobile components (React Native `<View>`), or 4K Ultrawide layouts.

---

## 2. Complete Catalog of 66 Supported Block Types

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

> **The catalog below is generated.** The numbered lists are produced from the block registry by
> `pnpm docs:blocks`; do not edit them by hand. The prose between the generated regions is yours
> to edit. A test fails the build if the document and the registry drift apart, and CI checks it
> on every push.

<!-- BEGIN GENERATED BLOCK CATALOG: text -->

### 2.1 Text & editorial (5)

1. **`heading`**: Section heading (levels 1-4) with optional subtext.
2. **`paragraph`**: Body paragraph, plain text or Markdown. HTML is stripped at write time.
3. **`summary`**: Key-takeaway / executive briefing block with bullet points.
4. **`quote`**: Pull quote with required attribution and optional portrait/source URL.
5. **`callout`**: Informational, warning, tip, or critical editorial callout.

<!-- END GENERATED BLOCK CATALOG: text -->

<!-- BEGIN GENERATED BLOCK CATALOG: media -->

### 2.2 Media blocks (12)

6. **`image`**: Single image with required alt text, caption, and credit.
7. **`gallery`**: Grid, carousel, or masonry image gallery.
8. **`annotated_image`**: Image with percentage-positioned annotations and per-annotation sources.
9. **`image_diff`**: Before/after image comparison with draggable split.
10. **`video`**: Video with transcript segments and chapter markers.
11. **`audio`**: Audio player with transcript, chapters, speakers, and cue points.
12. **`slide_deck`**: Embedded slide presentation with source attribution per slide.
13. **`embed`**: External social/media embed with an allow-listed provider.
14. **`video_gallery`**: Multiple videos in one block, each with poster art, chapters, and optional transcript segments.
15. **`podcast`**: Podcast show with episodes: episode numbers, artwork, transcripts, chapters, and speakers.
16. **`waveform`**: Audio/video waveform with amplitude samples and segments that reference other blocks (cue points).
17. **`transcript`**: Timestamped transcript with speaker attribution, linked to the audio or video it belongs to.

<!-- END GENERATED BLOCK CATALOG: media -->

<!-- BEGIN GENERATED BLOCK CATALOG: data -->

### 2.3 Data & quantitative blocks (20)

18. **`chart`**: Programmatic D3 visualization. 21 chart types: line, area, bar, stacked_bar, grouped_bar, scatter, heatmap, histogram, waterfall, donut, pie, kpi, comparison, slope, dot_plot, lollipop, diverging_bar, sparkline, bump, radar and small_multiples. Supports click-to-reveal annotations anchored to specific data points.
19. **`table`**: Data table with optional sorting, filtering, search, pagination, and CSV download.
20. **`data_explorer`**: Reusable interactive explorer over an embedded dataset. Supports dimension/metric switching, filters, and data download.
21. **`statistic`**: KPI / fact card with unit, trend, comparison period, source, and methodology.
22. **`ranking`**: Ranked list with rank movement, values, and explicit methodology.
23. **`uncertainty`**: Estimates with confidence intervals. Each point carries a point estimate, its lower and upper bounds, an optional sample size, and an optional source. Also supports a reference line for a consensus or target value.
24. **`correlation`**: Correlation matrix. The block carries the raw observations; the platform derives the Pearson coefficients, the sample sizes and the significance, so a reader can tell a well-evidenced relationship from one computed from three data points. Significant pairings are marked, and the summary states plainly that a correlation is not causation.
25. **`sensitivity`**: Sensitivity analysis. A base case plus a range for each input and an expression producing the output; the renderer moves one input at a time to the ends of its range and shows how far the outcome travels, so the reader can see which assumption actually drives the result.
26. **`prediction_leaderboard`**: Tracked predictions with a forecaster leaderboard. Each prediction carries a probability, and resolved ones carry an outcome; the platform scores forecasters by Brier score and reports whether they are well-calibrated rather than merely lucky.
27. **`financial`**: Timestamped financial metrics and optional time series.
28. **`election`**: Election results: seats, vote share, turnout, historical comparison.
29. **`disaster`**: Earthquake, storm, flood, or fire metrics with timestamps and affected areas.
30. **`science`**: Findings, measurements, equations, paper metadata, and scientific diagrams.
31. **`dataset`**: Published dataset with column definitions, a preview table, download formats, license, and methodology.
32. **`sankey`**: Flow diagram showing how a quantity moves between stages or sources, with the size of each flow drawn to scale.
33. **`treemap`**: Nested rectangles whose area shows the size of each part of a hierarchy, from the whole down to the leaves.
34. **`network_graph`**: Force-directed graph of people, organisations and things, showing who is connected to whom and how strongly.
35. **`regression`**: A fitted curve through scattered measurements, with the fit, its confidence band, the residuals and the equation.
36. **`anomaly`**: A series over time with the unusual readings marked out, and the method used to decide what counts as unusual.
37. **`survey_results`**: The results of a poll or survey, with the breakdown by subgroup, the sample size and the margin of error.

<!-- END GENERATED BLOCK CATALOG: data -->

#### Estimates carry their uncertainty

Every other chart in the platform asserts a point estimate with no error bars, which is the
single biggest credibility gap in newsroom data graphics. The `uncertainty` block draws
each estimate as a point marker with a whisker spanning its interval, and the interval,
the sample size and the methodology stay visible as text — the number is never the only
thing on screen.

```jsonc
{
  "blockType": "uncertainty",
  "data": {
    "title": "Projected electricity demand, 2030",
    "unit": "TWh",
    "intervalLabel": "95% credible interval",
    "points": [{ "label": "IEA", "value": 9400, "low": 8800, "high": 10100, "n": 12000 }],
    "referenceValue": 9000,
    "referenceLabel": "2025 level",
    "methodology": "5th-95th percentile across 12,000 scenario draws.",
  },
}
```

#### Animated maps

The `animated_map` block is a map that moves through time. The reader scrubs through the
frames with a slider, so the story shows **how a situation spread** rather than only its end
state — the treatment an outbreak, a disaster, a conflict or an election needs.

Marker size and colour follow the value, on a scale fixed across **every** frame. That detail
matters: if the scale were recomputed per frame, a marker would balloon just because it was
the only one on screen, and the reader would read growth that is not there.

```jsonc
{
  "blockType": "animated_map",
  "data": {
    "title": "How the outbreak spread",
    "valueLabel": "Confirmed cases",
    "unit": "cases",
    "frames": [
      {
        "at": "2026-03-01",
        "label": "1 March",
        "points": [
          { "id": "p1", "label": "Northern coast", "lng": 34.5, "lat": 41.2, "value": 12 },
        ],
      },
      {
        "at": "2026-03-08",
        "label": "8 March",
        "points": [
          { "id": "p1", "label": "Northern coast", "lng": 34.5, "lat": 41.2, "value": 180 },
        ],
      },
    ],
  },
}
```

#### Knowledge graphs

The `knowledge_graph` block draws the entities, sources and events behind a story and how they
relate. Nodes are **typed** (person, company, organization, source, story, event…) and each type
gets its own colour, and every edge carries a **named relationship** ("directs", "regulates",
"reported on") rather than a bare line.

The layout is a deterministic **radial** one: the focus node sits in the centre, its direct
relationships form the first ring, and theirs the second. That means the picture does not
shuffle between renders, and two stories' graphs can be compared side by side — both things a
force-directed layout cannot offer.

An edge that points at a node that is not in the block is skipped rather than drawn to
nowhere, and the relationships are also listed as text beneath the graph so they stay readable
when the picture is dense.

```jsonc
{
  "blockType": "knowledge_graph",
  "data": {
    "title": "Who is connected to whom",
    "nodes": [
      { "id": "n1", "label": "Northwind Energy", "type": "company" },
      { "id": "n2", "label": "Ada Okafor", "type": "person" },
    ],
    "edges": [{ "id": "e1", "from": "n2", "to": "n1", "relation": "directs" }],
    "focusNodeId": "n1",
  },
}
```

#### Knowledge checks

The `quiz` block is a reader-facing knowledge check: each question has options, exactly one
correct answer, and an explanation that is revealed once the reader has answered — so the block
teaches rather than only scoring. The correct option stays visible after answering, and the
reader sees their score at the end.

Unlike a poll, a knowledge check is about the reader rather than the readership, so the answers
stay in the reader's own browser. (A poll is different: its tally is shared and interesting to
everyone, so it is counted on the server.)

#### Correlation analysis

The `correlation` block carries the **raw observations**, and the platform derives the
coefficients, the sample sizes and the significance. That distinction matters: a heatmap of
hand-written correlation values tells the reader nothing about how thin the evidence is, and a
coefficient computed from three observations looks exactly like one computed from three
hundred.

Each cell shows the coefficient **and** the number of observations behind it. Pairings that
clear the block's significance threshold are ringed, so the marking survives a monochrome print
and a colour-blind reader, and the summary states plainly that a correlation is not evidence
of causation.

```jsonc
{
  "blockType": "correlation",
  "data": {
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
  },
}
```

The coefficient is Pearson's _r_. Significance is a two-tailed _t_-test on _r_ with
`n - 2` degrees of freedom, evaluated through the regularised incomplete beta function in
`libs/shared/src/statistics.ts`.

#### Sensitivity analysis

The `sensitivity` block stores a base case, a range for each input, and the expression
that produces the output. The platform moves one input at a time to the ends of its range
and measures how far the outcome travels, then draws the result as a tornado chart sorted
by swing size — the standard way to show which assumption actually drives a result.

```jsonc
{
  "blockType": "sensitivity",
  "data": {
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
  },
}
```

Two things can quietly mislead here, and the block says so rather than hiding them:

- An input the expression never mentions **cannot** move the outcome. Showing it with a
  zero swing would tell the reader the assumption does not matter, when the truth is that
  the model ignores it — so it is excluded and the exclusion is stated.
- The base reference line is drawn at the model's **computed** base case. If the stated
  `baseOutput` disagrees with it, the discrepancy is reported.

The expression is evaluated in the same restricted arithmetic sandbox the `calculator`
block uses: only `+ - * / ( )` and the input identifiers are accepted.

#### Prediction leaderboards

A newsroom that publishes forecasts has to say who was right. The `prediction_leaderboard`
block tracks predictions with a probability and, once resolved, an outcome. It scores
forecasters by **Brier score** (lower is better: 0 is perfect, 0.25 is a coin flip, 1 is
always wrong) and reports **calibration** alongside it, because a forecaster can have a
good average score and still be badly calibrated.

Only resolved predictions count towards a score — an open prediction says nothing about a
forecaster's track record yet.

#### Chart annotations

A chart can carry **annotations** — short explanations anchored to a specific data point.
Each annotation names the `xValue` it points at (and optionally the `seriesKey`), plus a
`label`, a `body`, and an optional `sourceId`.

```jsonc
{
  "blockType": "chart",
  "data": {
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
  },
}
```

The renderer draws a numbered marker at the anchored data point; the reader opens it by
clicking the marker or the numbered button beneath the chart. An annotation that does not
match any data point is skipped rather than drawn at a wrong position — a mis-anchored
marker would be worse than no marker at all. On mobile, where charts are rendered as
values rather than an image, the annotations travel with the values they refer to.

<!-- BEGIN GENERATED BLOCK CATALOG: map -->

### 2.4 Map, timeline & diagram blocks (5)

38. **`animated_map`**: Map that moves through time. The reader scrubs through the frames, so the story shows how a situation spread rather than only its end state. Marker size and colour follow the value, on a scale fixed across every frame so the markers do not jump as the reader scrubs.
39. **`map`**: Map with point, choropleth, heatmap, route, or comparison layers. Markers and GeoJSON layers are structured data, not screenshots.
40. **`timeline`**: Chronological milestones; each item can carry entities, sources, and media.
41. **`diagram`**: Mermaid, declarative SVG, flowchart, or sequence diagram.
42. **`flow`**: Process / explainer steps with optional branches and citations.

<!-- END GENERATED BLOCK CATALOG: map -->

<!-- BEGIN GENERATED BLOCK CATALOG: interactive -->

### 2.5 Interactive blocks (8)

43. **`quiz`**: Knowledge check. Each question has options, one correct answer, and an explanation revealed once the reader has answered — so the block teaches rather than only scoring. The reader's answers stay in their own browser.
44. **`what_if`**: Interactive scenario explorer. The reader moves sliders over a range for each input and the outcome recomputes live from the block's own expressions, with an optional breakdown of the outcome into components and a baseline for comparison.
45. **`live_comments`**: Reader comments inside the article body. The thread is loaded on mount and kept live over the story's realtime channel, so a comment posted while the reader is mid-article appears without a refresh.
46. **`live_ticker`**: Market and numerical ticker with per-item sparklines. Binds to a live feed key to refresh in place over the realtime channel.
47. **`live_data`**: Named live datasets with provider, refresh interval, timestamp, license, and methodology. Binds to a live feed key to refresh in place over the realtime channel.
48. **`calculator`**: Generic calculator with structured inputs, safe formula expressions, outputs, units, assumptions, and sources.
49. **`poll`**: Reader poll. Votes are counted on the server — one vote per reader, shared live across everyone reading the story.
50. **`document_viewer`**: Paginated document viewer with sourced highlights.

<!-- END GENERATED BLOCK CATALOG: interactive -->

<!-- BEGIN GENERATED BLOCK CATALOG: immersive -->

### 2.6 Immersive & motion blocks (5)

51. **`scrolly`**: A scroll-driven narrative: a sticky scene that changes as the reader moves through each step of the story.
52. **`motion_chart`**: A chart that draws itself in — bars growing, lines drawing on, figures counting up — honouring reduced-motion.
53. **`sandbox`**: Custom HTML, CSS and JavaScript drawn in a sandboxed frame, with the block’s own data handed to it.
54. **`scene_3d`**: A three-dimensional scene — a globe, a point cloud, a bar chart or a model — drawn in WebGL and explorable.
55. **`map_3d`**: A map in three dimensions: the land raised and shaded, the story’s own shapes lifted off it, or the round earth.

<!-- END GENERATED BLOCK CATALOG: immersive -->

#### Live blocks are actually live

`live_ticker` and `live_data` store the snapshot they were published with. When the block
also carries a **`liveKey`**, it is bound to a _live feed_ — a named set of current values
held by the platform (`live_feeds` table, exposed at `GET /api/live/feeds/:key` and
published by the MCP `set_live_feed` tool).

A bound block:

1. fetches the current feed when it mounts, so a reader landing mid-story sees fresh numbers;
2. subscribes to the feed's realtime channel (`live_<key>`) and patches values in place the
   moment they are published; and
3. falls back to polling on the block's `refreshIntervalSeconds` if the realtime connection
   is unavailable.

The feed is persisted rather than held in process memory, so a published story still resolves
its feed after a deploy, and the API and the MCP server operate on the same feed. Without a
`liveKey` the block renders its stored snapshot exactly as before.

#### Scenario explorers and live comment threads

Two interactive blocks that need no authoring effort beyond their own data:

- **`what_if`** gives the reader sliders over a range for each input, and the outcome is
  recomputed live from the block's own expressions. The baseline (the outcome at the default
  values) is always shown, so the reader can see how far they have pushed the model away from
  the published case. An optional `breakdown` splits the outcome into named components,
  drawn as a stacked bar.

  ```jsonc
  {
    "blockType": "what_if",
    "data": {
      "title": "What would it take to cut household energy bills by a fifth?",
      "outcomeLabel": "Average household bill",
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
    },
  }
  ```

  The schema refuses an input whose `defaultValue` falls outside its own range — that would
  render a slider in an impossible position and start the scenario from a value the reader
  cannot see.

- **`live_comments`** puts the reader discussion inside the article body. The thread is
  fetched on mount and then kept live over the story's realtime channel, so a comment posted
  while the reader is mid-article appears without a refresh. Only approved comments are
  shown, and the block can be restricted to particular author roles.

  Comment events are published on the story's channel (`story_<storyId>`) rather than a
  global one, so a reader who subscribes to the story gets them without any other traffic.
  Subscribers of `all` still receive them.

#### Polls are counted on the server

`poll` votes are recorded server-side in the `poll_votes` table, not in the reader's browser:

- A reader has **at most one vote per poll block**. Casting again replaces the previous
  choice rather than adding a second vote.
- The tally is the sum of the **baseline counts stored in the block payload** (seed votes, or
  votes cast through another channel) and the **votes recorded against the story**. The story
  payload is never rewritten as votes come in, so a published article is not touched by
  reader traffic.
- Every vote is broadcast on the story's realtime channel (`story_<storyId>`) as `poll.vote`,
  so all readers watching the story see the same live consensus tally.
- `GET /api/stories/:id/blocks/:blockId/poll` returns the tally plus the requesting
  reader's own choice; `POST` on the same path casts a vote.

<!-- BEGIN GENERATED BLOCK CATALOG: context -->

### 2.7 Evidence, source & context blocks (11)

56. **`knowledge_graph`**: Knowledge graph over the entities, sources and events in a story. Nodes are typed, edges carry a named relationship, and the layout is a deterministic radial one — the focus node in the centre, its relationships in the first ring — so the picture does not shuffle between renders and two stories can be compared.
57. **`source`**: Registered source citation card.
58. **`entity`**: Person, organization, company, country, location, or product card.
59. **`related_stories`**: Related story references resolved by the frontend.
60. **`what_changed`**: Structured change summary between two story versions.
61. **`comparison`**: Two-option comparison card.
62. **`citation`**: A claim coupled to one or more registered source IDs.
63. **`evidence`**: Claim/evidence summary: claims with status and methodology, plus supporting, contradicting, or contextual evidence.
64. **`perspective`**: Documented perspectives anchored to their sources. Not a forced two-sides frame.
65. **`fact_check`**: Claim-level fact-check result with confidence methodology and review metadata.
66. **`interview`**: Structured Q&A interview with optional audio/video media and per-segment sources.

<!-- END GENERATED BLOCK CATALOG: context -->

### 2.7 Renderer parity

Every registered block type has a renderer on **both** the web and the mobile surface. A test
(`tests/unit/blocks/block-renderer-coverage.test.ts`) fails the build if a type is added to the
registry without a matching renderer, because a missing renderer would silently drop content
from the published article.

### 2.8 Keeping this document honest

The catalog in section 2 is generated from the registry by `pnpm docs:blocks`
(`scripts/generate-block-catalog.ts`). Three things keep it from drifting:

- `tests/unit/docs/block-catalog-doc.test.ts` fails the build when the document and the
  registry disagree, and names the command that fixes it.
- CI regenerates the catalog and fails if it produces a diff.
- A registry category that no documented section covers is reported as an error by the
  generator, so a new category is never silently dropped from the documentation.

Because the registry is the source of truth, the per-block descriptions in the catalog are the
registry's own `description` fields. Those are worth keeping accurate: they are what an agent
reads before choosing a block type.

---

## 3. Extending the Block Model

Adding a new block type (e.g. `financial_terminal`) requires no database migration, because
blocks are stored as JSONB. It does require touching nine places:

1. **`libs/schemas/src/blocks.ts`** — the Zod schema, plus the type in the
   `StoryBlockSchema` discriminated union.
2. **`libs/schemas/src/block-registry.ts`** — a `define(...)` entry with a category, a
   description and an example. The description is what an agent reads before choosing a
   block type, so it is worth writing carefully.
3. **Web renderer** — a `case` in `libs/blocks-ui/src/blocks/BlockItem.tsx` plus the
   view component.
4. **Mobile renderer** — a `case` in
   `apps/mobile/src/components/mobile-blocks/MobileBlockItem.tsx` plus the view component.
   The renderer-parity test fails the build if this is missed.
5. **`libs/content/src/index.ts`** — a `case` in `extractTextContent`, so the block's text
   reaches the extracted article body (and therefore search and SEO).
6. **MCP tool** — an `add_<type>_block` tool in `apps/mcp-server/src/tools/blocks/`, so an
   agent can author the block.
7. **`docs/content-model.md`** — run `pnpm docs:blocks` to regenerate the catalog.
8. **Tests** — schema validation, renderer output, and the registry entry.
9. **Block Studio sample** — a sample payload and any variants for the new type in
   `libs/block-studio/src/samples.ts`, so the block is previewable in the studio.

Two more files are worth touching, though neither is required:

- **`libs/block-studio/src/hints.ts`** — a `BLOCK_HINTS` entry, so the studio's generated form
  groups the fields the way an editor would expect, and hides the ones that do not apply to the
  block being edited.
- **`apps/mcp-server/src/tools/blocks/`** — the MCP tool, if the block is one an agent should
  be able to author on its own.

A **new category** costs three more touches: the `BlockCategory` union in
`libs/schemas/src/block-registry.ts`, the `CATEGORY_ORDER` and `CATEGORY_LABELS` maps in
`libs/block-studio/src/types.ts`, and the `CATALOG_SECTIONS` list in `scripts/block-catalog-doc.ts`
— without which the generator reports the category as uncatalogued and the build fails.

```typescript
// 1. In libs/schemas/src/blocks.ts
export const FinancialTerminalBlockDataSchema = z.object({
  ticker: z.string(),
  currentPrice: z.number(),
  currency: z.string().default('USD'),
  sparkline: z.array(z.number()),
});

export const FinancialTerminalBlockSchema = BaseBlockSchema.extend({
  blockType: z.literal('financial_terminal'),
  data: FinancialTerminalBlockDataSchema,
});
```

Two conventions worth keeping:

- **Optional, not defaulted, for new fields.** A Zod `.default()` makes a field required in
  the _output_ type, which breaks every existing block that omits it. Use `.optional()` and
  handle the absent case at the call site.
- **Never show a number without its provenance.** A block that displays a value should also
  display its source, methodology and — where the value is an estimate rather than a
  measurement — its uncertainty. The `uncertainty` and `sensitivity` blocks exist for exactly
  this reason.
