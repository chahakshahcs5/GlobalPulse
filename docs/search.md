# Search, Deduplication & Semantic Indexing (`libs/search`)

This document details the hybrid search architecture, full-text tokenization, Jaccard similarity deduplication, and vector embedding indexing implemented in `libs/search`.

---

## 1. Multi-Modal Search Architecture

External AI agents frequently need to query existing news coverage before writing to prevent duplicate stories or to locate a previous version to update.

GlobalPulse combines three search tiers:

```mermaid
flowchart LR
    Query[Search Query / Ingest Dispatch] --> Pipeline{Search Engine Pipeline}
    Pipeline --> FullText[1. Full-Text Token Search]
    Pipeline --> Jaccard[2. Jaccard Similarity Deduplication]
    Pipeline --> Semantic[3. Vector Semantic Embeddings (pgvector)]
    FullText --> ScoredResults[Ranked & Scored Results]
    Jaccard --> ScoredResults
    Semantic --> ScoredResults
```

---

## 2. Jaccard Similarity & Story Deduplication

When an external agent (e.g. Gemini Spark) receives breaking news wires, it calls `search_stories` or `find_similar_stories` to determine if another reporter has already filed on this event.

### Similarity Algorithm
The service calculates the Jaccard index over extracted lexical tokens:

$$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$

```typescript
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  const tokensA = new Set(tokenize(textA));
  const tokensB = new Set(tokenize(textB));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);

  return intersection.size / union.size;
}
```

### Threshold Policies:
* **Score >= 0.75**: Highly confident match. The agent should update the existing story rather than creating a new draft.
* **Score between 0.40 and 0.74**: Related event. The agent should link the stories via `related_stories` blocks.
* **Score < 0.40**: Distinct news item. The agent creates a new independent draft.

---

## 3. Asynchronous Vector Indexing

When a story publishes:
1. `WorkerService` picks up the `search.index_story` job.
2. Extracts narrative text from `headline`, `summary`, and `paragraph` blocks.
3. Generates a 1536-dimensional embedding vector.
4. Stores the vector in PostgreSQL using the `pgvector` extension with an HNSW cosine similarity index:
   ```sql
   CREATE INDEX idx_stories_embedding ON stories USING hnsw (embedding vector_cosine_ops);
   ```
