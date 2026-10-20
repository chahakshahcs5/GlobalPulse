export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface PaginatedMeta {
  total: number;
  limit: number;
  cursor?: string;
  nextCursor?: string;
  offset?: number;
  hasMore: boolean;
}

export class ApiResponse {
  static success<T>(data: T, meta?: Record<string, unknown>): ApiResponseEnvelope<T> {
    return {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated<T>(
    items: T[],
    total: number,
    limit = 50,
    nextCursor?: string,
    offset?: number,
    hasMore?: boolean
  ): ApiResponseEnvelope<T[]> {
    // Callers that already computed an accurate hasMore/nextCursor (e.g. cursor-
    // paginated repositories) can pass `hasMore` explicitly. The fallback only
    // applies to simple array slices (review queues etc.).
    const computedHasMore =
      hasMore ??
      (offset !== undefined
        ? offset + items.length < total
        : items.length === limit && items.length < total);
    return {
      success: true,
      data: items,
      meta: {
        total,
        limit,
        cursor: nextCursor,
        nextCursor,
        offset,
        hasMore: computedHasMore,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
