import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from '@ai-news/shared';
import { ApiError } from './errors/api-error';
import { ZodError } from 'zod';
import { logger } from '@ai-news/observability';

@Catch()
export class Rfc7807ExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    if ((host.getType() as string) === 'graphql') {
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    if (!response || typeof response.status !== 'function') {
      return;
    }
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let title = 'Internal Server Error';
    let detail = 'An unexpected error occurred processing your request.';
    let invalidParams: unknown = undefined;

    if (exception instanceof ApiError) {
      status = exception.statusCode;
      code = exception.code;
      title = exception.name;
      detail = exception.message;
      invalidParams = exception.details;
    } else if (exception instanceof DomainError) {
      status = exception.statusCode || HttpStatus.BAD_REQUEST;
      code = exception.code || exception.name;
      title = exception.name;
      detail = exception.message;
      if (exception.details && Array.isArray(exception.details)) {
        invalidParams = exception.details;
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      title = 'Validation Failed';
      detail = 'The request payload failed schema validation.';
      invalidParams = exception.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      const resObj =
        typeof res === 'object' && res !== null ? (res as Record<string, unknown>) : null;
      code = resObj && typeof resObj.error === 'string' ? resObj.error : 'HTTP_EXCEPTION';
      title = exception.name;
      detail =
        resObj && typeof resObj.error_description === 'string'
          ? resObj.error_description
          : resObj && typeof resObj.message === 'string'
            ? resObj.message
            : exception.message;
    } else if (exception instanceof Error) {
      detail = exception.message;
    }

    const typeSlug = code
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/_/g, '-');

    const problemDetails = {
      type: `https://api.globalpulse.news/errors/${typeSlug}`,
      title,
      status,
      code,
      error: code,
      error_description: detail,
      detail,
      instance: request.url,
      timestamp: new Date().toISOString(),
      ...(invalidParams ? { invalidParams, errors: invalidParams } : {}),
    };

    logger.warn(`Handled error [${status} ${code}]: ${detail} on ${request.url}`);

    response.status(status).header('Content-Type', 'application/problem+json').send(problemDetails);
  }
}
