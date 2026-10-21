/**
 * Read and write values inside a block payload by path.
 *
 * Paths are dot-separated: `xAxis.key` for an object key, `series.0.name`
 * for the first element of an array. The studio uses them to move a single
 * form control's value into the payload without rebuilding the whole tree.
 */

export type PathSegment = string;

export function splitPath(path: string): PathSegment[] {
  if (path.length === 0) return [];
  return path.split('.');
}

export function getAtPath(source: unknown, path: string): unknown {
  if (path.length === 0) return source;
  const segments = splitPath(path);
  let current: unknown = source;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/** Returns a copy of `source` with `path` set to `value`. */
export function setAtPath<T>(source: T, path: string, value: unknown): T {
  const segments = splitPath(path);
  if (segments.length === 0) return value as T;

  const [head, ...rest] = segments;

  if (rest.length === 0) {
    if (Array.isArray(source)) {
      const next = [...source];
      const index = Number(head);
      if (index >= next.length) next.push(value);
      else next[index] = value;
      return next as unknown as T;
    }
    const base = (source ?? {}) as Record<string, unknown>;
    return { ...base, [head]: value } as unknown as T;
  }

  if (Array.isArray(source)) {
    const index = Number(head);
    const next = [...source];
    const child = next[index];
    next[index] = setAtPath(child, rest.join('.'), value);
    return next as unknown as T;
  }

  const base = (source ?? {}) as Record<string, unknown>;
  const child = base[head];
  return {
    ...base,
    [head]: setAtPath(child, rest.join('.'), value),
  } as unknown as T;
}

/** Returns a copy of `source` with the value at `path` removed. */
export function removeAtPath<T>(source: T, path: string): T {
  const segments = splitPath(path);
  if (segments.length === 0) return source;

  const [head, ...rest] = segments;
  if (rest.length === 0) {
    if (Array.isArray(source)) {
      const index = Number(head);
      if (!Number.isInteger(index) || index < 0 || index >= source.length) return source;
      return [...source.slice(0, index), ...source.slice(index + 1)] as unknown as T;
    }
    const base = { ...((source ?? {}) as Record<string, unknown>) };
    delete base[head];
    return base as unknown as T;
  }

  if (Array.isArray(source)) {
    const index = Number(head);
    if (!Number.isInteger(index) || index < 0 || index >= source.length) return source;
    const next = [...source];
    next[index] = removeAtPath(next[index], rest.join('.'));
    return next as unknown as T;
  }

  const base = { ...((source ?? {}) as Record<string, unknown>) };
  base[head] = removeAtPath(base[head], rest.join('.'));
  return base as unknown as T;
}
