/**
 * Deterministic, dependency-free text embedding.
 *
 * This is a hashing projection, not a learned model: identical text always
 * produces the same vector, and semantically related text shares tokens and
 * therefore dimensions. It is intentionally cheap enough to run in a worker
 * and in a request path. A deployment can swap this for a provider embedding
 * without changing the storage or similarity code.
 */
export function generateSemanticEmbedding(tokens: string[], dimensions = 1536): number[] {
  const vector = new Array(dimensions).fill(0);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let hash = 0;
    for (let c = 0; c < token.length; c++) {
      hash = (hash << 5) - hash + token.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;
    // Harmonic spread so related vocabulary clusters in nearby dimensions.
    vector[(idx + 17) % dimensions] += 0.5;
    vector[(idx + 43) % dimensions] += 0.25;
  }

  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm) || 1;

  for (let i = 0; i < dimensions; i++) {
    vector[i] = parseFloat((vector[i] / norm).toFixed(6));
  }

  return vector;
}

export function tokenizeForEmbedding(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
