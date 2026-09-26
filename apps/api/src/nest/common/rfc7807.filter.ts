import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from '@ai-news/shared';
import { ZodError } from 'zod';
import { ApiError } from '../../common/errors/api-error';

@Catch()
export class Rfc7807ExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const timestamp = new Date().toISOString();
    const instance = request?.url || '';

    // If it's a DomainError
    if (exception instanceof DomainError) {
      const errorSlug = exception.name
        .replace(/Error$/, '')
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase();

      return reply.status(exception.statusCode || 400).send({
        type: `https://news.platform/errors/${errorSlug}`,
        title: exception.name,
        status: exception.statusCode || 400,
        code: exception.code,
        detail: exception.message,
        instance,
        errors: exception.details ? [exception.details] : undefined,
        timestamp,
      });
    }

    // If it's an ApiError
    if (exception instanceof ApiError) {
      return reply.status(exception.statusCode).send({
        type: `https://news.platform/errors/${exception.code.toLowerCase().replace(/_/g, '-')}`,
        title: exception.code,
        status: exception.statusCode,
        code: exception.code,
        detail: exception.message,
        instance,
        errors: exception.details ? [exception.details] : undefined,
        timestamp,
      });
    }

    // If it's a ZodError
    if (exception instanceof ZodError) {
      const errors = (exception as ZodError).issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      return reply.status(400).send({
        type: 'https://news.platform/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: 'Request validation failed against schema',
        instance,
        errors,
        timestamp,
      });
    }

    // If it's an HttpException (NestJS standard)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      let detail = exception.message;
      let code = status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'HTTP_ERROR';

      if (typeof response === 'object' && response !== null) {
        const respObj = response as any;
        if (respObj.message && typeof respObj.message === 'string') {
          detail = respObj.message;
        }
        if (respObj.code) {
          code = respObj.code;
        }
      }

      return reply.status(status).send({
        type: `https://news.platform/errors/${code.toLowerCase().replace(/_/g, '-')}`,
        title: exception.name,
        status,
        code,
        detail,
        instance,
        timestamp,
      });
    }

    // Fallback unhandled error
    const err = exception as any;
    return reply.status(500).send({
      type: 'https://news.platform/errors/internal-server-error',
      title: 'Internal Server Error',
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      detail: err?.message || 'An unexpected error occurred',
      instance,
      timestamp,
    });
  }
}
