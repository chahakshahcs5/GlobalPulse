export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Insufficient permissions'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(resource = 'Resource', id?: string): ApiError {
    const msg = id ? `${resource} with ID '${id}' was not found` : `${resource} not found`;
    return new ApiError(404, 'NOT_FOUND', msg);
  }

  static conflict(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static unprocessable(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(422, 'UNPROCESSABLE_ENTITY', message, details);
  }

  static internal(message = 'An unexpected internal error occurred'): ApiError {
    return new ApiError(500, 'INTERNAL_SERVER_ERROR', message);
  }
}
