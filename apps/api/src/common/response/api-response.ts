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
    cursor?: string,
    offset?: number
  ): ApiResponseEnvelope<T[]> {
    return {
      success: true,
      data: items,
      meta: {
        total,
        limit,
        cursor,
        nextCursor: cursor,
        offset,
        hasMore: cursor
          ? true
          : offset !== undefined
            ? offset + items.length < total
            : items.length === limit,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
