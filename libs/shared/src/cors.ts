import {
  DEFAULT_API_PORT,
  DEFAULT_MCP_PORT,
  DEFAULT_STUDIO_PORT,
  DEFAULT_WEB_PORT,
  localOrigin,
} from './runtime-ports';

/**
 * Centralized Cross-Origin Resource Sharing (CORS) Security Policies
 * Shared across API Gateway, MCP Server, and Microservices
 */

export const PRODUCTION_ALLOWED_ORIGINS = [
  'https://globalpulse.news',
  'https://www.globalpulse.news',
  'https://admin.globalpulse.news',
];

export const DEVELOPMENT_ALLOWED_ORIGINS = [
  ...PRODUCTION_ALLOWED_ORIGINS,
  ...[
    DEFAULT_API_PORT,
    DEFAULT_MCP_PORT,
    DEFAULT_WEB_PORT,
    DEFAULT_STUDIO_PORT,
    // The container compose file has historically exposed 3000/3001; keep
    // accepting them without spelling out a localhost URL in every file.
    3000,
    3001,
  ].flatMap((port) => [localOrigin(port), localOrigin(port, '127.0.0.1')]),
];

export const DEFAULT_ALLOWED_ORIGINS =
  process.env.NODE_ENV === 'production' ? PRODUCTION_ALLOWED_ORIGINS : DEVELOPMENT_ALLOWED_ORIGINS;

export const ALLOWED_CORS_HEADERS = [
  'Content-Type',
  'Authorization',
  'x-request-id',
  'x-client-id',
  'X-Requested-With',
];

export const ALLOWED_CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

export function getAllowedOrigins(): string[] {
  const envAllowed = process.env.ALLOWED_ORIGINS;
  if (envAllowed) {
    return envAllowed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_ALLOWED_ORIGINS;
  }
  return DEVELOPMENT_ALLOWED_ORIGINS;
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  if (allowed.includes('*')) return true;
  return allowed.includes(origin);
}

export function resolveCorsOrigin(origin: string | undefined): string | null {
  const allowed = getAllowedOrigins();
  if (allowed.includes('*')) {
    return origin || '*';
  }
  if (!origin) {
    // When no origin header is provided (e.g. server-to-server or non-browser client)
    return null;
  }
  return allowed.includes(origin) ? origin : null;
}
