# Structured Content Model & Block System

This document outlines the structured block content model, discriminant union architecture, and full catalog of all 22 supported block types in **GlobalPulse**.

---

## 1. Architectural Philosophy: Structured Blocks vs. Unstructured Blobs

Traditional CMS platforms store monolithic HTML or raw Markdown blobs. In contrast, GlobalPulse treats journalism as a **composable tree of strongly-typed structured blocks**.

### Benefits for External AI Agents:

1. **Targeted Updates**: An external agent can update a single chart or append a correction without rewriting the entire article.
2. **Deterministic Validation**: Every block adheres to strict Zod schema constraints. Hallucinated or malformed properties fail at the validation boundary.
3. **Cross-Platform Rendering**: The same JSON block payload compiles to responsive Web SVG (D3/MapLibre), Native Mobile components (React Native `<View>`), or 4K Ultrawide layouts.

---

## 2. Complete Catalog of 22 Supported Block Types

Every block contains common envelope metadata:

- `id`: Unique block identifier (e.g. `blk_chart_settlement_2026`).
- `storyVersionId`: Reference to parent story revision.
- `blockType`: Discriminant identifier.
- `sortOrder`: Zero-indexed integer defining presentation sequence.
- `data`: Type-safe payload specific to the `blockType`.

### 2.1 Narrative Blocks

1. **`heading`**: Section breaks (`level: 1 | 2 | 3 | 4`, `text`, optional `subtext`).
2. **`paragraph`**: Editorial copy (`text`, `format: 'markdown' | 'plain'`).
3. **`summary`**: Executive takeaway bullet points (`headline`, `bulletPoints: string[]`).
4. **`quote`**: Direct attribution quotes (`quote`, `attribution`, `title`, `sourceUrl`).
5. **`callout`**: Contextual editorial sidebars (`tone: 'info' | 'warning' | 'alert' | 'success'`, `title`, `content`).

### 2.2 Visual Data & Quantitative Blocks

6. **`chart`**: Programmatic D3 data visualization (`chartType: 'line' | 'bar' | 'stacked_bar' | 'area' | 'scatter' | 'pie' | 'donut' | 'kpi' | 'heatmap' | 'histogram' | 'waterfall' | 'comparison' | 'slope'`, `xAxis`, `yAxis`, `series`, `values`).
7. **`table`**: Structured tabular data (`headers: string[]`, `rows: string[][]`, optional `caption`).
8. **`statistic`**: High-impact quantitative metrics (`value: string`, `label: string`, `trend?: { direction: 'up' | 'down' | 'flat', percentage: number }`).
9. **`timeline`**: Chronological milestone sequences (`orientation: 'horizontal' | 'vertical'`, `items: Array<{ date: string, headline: string, body?: string }>`).

### 2.3 Geospatial & Diagrammatic Blocks

10. **`map`**: MapLibre geospatial maps with markers and GeoJSON vector overlays (`center: [lng, lat]`, `zoom: number`, `style: 'light' | 'dark' | 'satellite'`, `markers: Array<{ coordinates: [lng, lat], title: string }>`, optional `geoJson`).
11. **`flow`**: Step-by-step procedural or diplomatic flows (`steps: Array<{ title: string, description: string, status?: string }>`, `activeStepIndex?: number`).
12. **`diagram`**: Declarative Mermaid or SVG diagrams (`diagramType: 'mermaid' | 'svg'`, `source: string`, `caption?: string`).

### 2.4 Multimedia & Slide Blocks

13. **`image`**: Photographic assets (`url`, `caption`, `credit`, `altText`, `aspectRatio?: string`).
14. **`gallery`**: Multi-asset photo essays (`images: Array<{ url: string, caption?: string, credit?: string }>`, `columns?: number`).
15. **`video`**: Streamable video dispatches (`url`, `title`, `durationSeconds?: number`, `thumbnailUrl?: string`).
16. **`audio`**: Synthesized audio briefings or podcasts (`url`, `title`, `durationSeconds?: number`, `voice?: string`).
17. **`slide_deck`**: Interactive slide presentations (`title`, `slides: Array<{ title: string, text: string, imageUrl?: string }>`, `autoPlay?: boolean`).

### 2.5 Verification, Source & Revision Blocks

18. **`what_changed`**: Algorithmic revision diff tracking (`previousVersionNumber: number`, `updatedAt: string`, `items: Array<{ changeType: 'added' | 'updated' | 'corrected' | 'retracted', description: string, affectedSection?: string }>`).
19. **`citation`**: Specific fact assertion linked to primary sources (`claim: string`, `sourceIds: string[]`, `confidenceScore?: number`).
20. **`source`**: Primary source fact-check citation card (`sourceId: string`, `url: string`, `publisher: string`, `permissibleExcerpt?: string`).
21. **`entity`**: Named entity intelligence badge (`entityId: string`, `name: string`, `type: string`, `description?: string`).
22. **`related_stories`**: Curated dispatches on the same narrative arc (`title: string`, `storyIds: string[]`).

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
