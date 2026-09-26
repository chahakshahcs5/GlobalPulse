export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

export interface PaginatedMeta {
  total: number;
  limit: number;
  cursor?: string;
  hasMore: boolean;
}

export class ApiResponse {
  static success<T>(data: T, meta?: Record<string, any>): ApiResponseEnvelope<T> {
    return {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated<T>(items: T[], total: number, limit = 50, cursor?: string): ApiResponseEnvelope<T[]> {
    return {
      success: true,
      data: items,
      meta: {
        total,
        limit,
        cursor,
        hasMore: items.length === limit,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
