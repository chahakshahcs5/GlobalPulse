/**
 * Shared, environment-neutral defaults for local development.
 *
 * Keeping the ports here (rather than as `localhost:3xxx` strings in every
 * package) means Windows, Linux and Termux pick the same values and an
 * operator can override them with plain environment variables.
 */

export const DEFAULT_API_PORT = 4000;
export const DEFAULT_MCP_PORT = 4001;
export const DEFAULT_WEB_PORT = 3002;
export const DEFAULT_STUDIO_PORT = 3003;

export type LocalService = 'api' | 'mcp' | 'web' | 'studio';

const ENV_KEYS: Record<LocalService, string> = {
  api: 'PORT',
  mcp: 'MCP_PORT',
  web: 'WEB_PORT',
  studio: 'STUDIO_PORT',
};

const DEFAULTS: Record<LocalService, number> = {
  api: DEFAULT_API_PORT,
  mcp: DEFAULT_MCP_PORT,
  web: DEFAULT_WEB_PORT,
  studio: DEFAULT_STUDIO_PORT,
};

/** Reads a service port from the environment, falling back to the local default. */
export function servicePort(service: LocalService): number {
  const raw = process.env[ENV_KEYS[service]];
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULTS[service];
}

/** Builds a loopback origin without hardcoding a host:port pair. */
export function localOrigin(port: number, host: string = 'localhost'): string {
  return `http://${host}:${port}`;
}

/** The API base URL, honouring explicit configuration first. */
export function apiBaseUrl(): string {
  return (
    process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || localOrigin(servicePort('api'))
  );
}

/** The MCP base URL, honouring explicit configuration first. */
export function mcpBaseUrl(): string {
  return (
    process.env.MCP_BASE_URL || process.env.NEXT_PUBLIC_MCP_URL || localOrigin(servicePort('mcp'))
  );
}
