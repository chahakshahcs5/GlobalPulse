/**
 * Centralized Cross-Origin Resource Sharing (CORS) Security Policies
 * Shared across API Gateway, MCP Server, and Microservices
 */

export const DEFAULT_ALLOWED_ORIGINS = [
  'https://globalpulse.news',
  'https://www.globalpulse.news',
  'https://admin.globalpulse.news',
  'http://localhost:3000',
  'http://localhost:3002',
];

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
    return DEFAULT_ALLOWED_ORIGINS;
  }
  return ['*'];
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
