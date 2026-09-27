import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from '@ai-news/shared';
import { ApiError } from './api-error';
import { ZodError } from 'zod';
import { createLogger } from '@ai-news/observability';

const logger = createLogger('api-error-handler');

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
  errors?: unknown[];
  timestamp: string;
}

export function globalErrorHandler(
  error: FastifyError | DomainError | ApiError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const timestamp = new Date().toISOString();
  const instance = request.url;

  // Handle DomainError from domain services
  if (error instanceof DomainError) {
    const errorSlug = error.name
      .replace(/Error$/, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase();
    const problem: ProblemDetails = {
      type: `https://news.platform/errors/${errorSlug}`,
      title: error.name,
      status: error.statusCode || 400,
      code: error.code,
      detail: error.message,
      instance,
      errors: error.details ? [error.details] : undefined,
      timestamp,
    };
    return reply.status(problem.status).send(problem);
  }

  // Handle ApiError
  if (error instanceof ApiError) {
    const problem: ProblemDetails = {
      type: `https://news.platform/errors/${error.code.toLowerCase().replace(/_/g, '-')}`,
      title: error.code,
      status: error.statusCode,
      code: error.code,
      detail: error.message,
      instance,
      errors: error.details ? [error.details] : undefined,
      timestamp,
    };
    return reply.status(problem.status).send(problem);
  }

  // Handle Zod Validation Errors
  if (error instanceof ZodError) {
    const problem: ProblemDetails = {
      type: 'https://news.platform/errors/validation-error',
      title: 'Validation Failed',
      status: 400,
      code: 'VALIDATION_ERROR',
      detail: 'The payload failed input validation requirements.',
      instance,
      errors: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
      timestamp,
    };
    return reply.status(400).send(problem);
  }

  // Handle Fastify Validation / HTTP Errors
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    const problemCode = 'code' in error && typeof error.code === 'string' ? error.code : 'HTTP_ERROR';
    const problem: ProblemDetails = {
      type: 'https://news.platform/errors/http-error',
      title: error.name || 'HTTP Error',
      status: error.statusCode,
      code: problemCode,
      detail: error.message,
      instance,
      timestamp,
    };
    return reply.status(error.statusCode).send(problem);
  }

  // Unhandled internal server error
  logger.error('Unhandled API exception', {
    url: request.url,
    method: request.method,
    errorMessage: error.message,
    stack: error.stack,
  });

  const internalProblem: ProblemDetails = {
    type: 'https://news.platform/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    detail: 'An unexpected error occurred while processing the request.',
    instance,
    timestamp,
  };

  return reply.status(500).send(internalProblem);
}
