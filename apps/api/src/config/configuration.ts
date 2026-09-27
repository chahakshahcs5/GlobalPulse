export interface AppConfig {
  port: number;
  host: string;
  apiBaseUrl: string;
  mcpBaseUrl: string;
  databaseUrl?: string;
  databaseEngine: 'prisma' | 'memory';
  redisUrl?: string;
  s3Endpoint?: string;
  s3Bucket: string;
  s3PublicUrl: string;
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  docsUrl: string;
}

export function getAppConfig(): AppConfig {
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';
  const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;
  const mcpPort = parseInt(process.env.MCP_PORT || '3001', 10);
  const mcpBaseUrl = process.env.MCP_BASE_URL || `http://localhost:${mcpPort}`;
  const s3Endpoint = process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  const s3Bucket = process.env.S3_BUCKET || 'news-media';
  const s3PublicUrl = process.env.S3_PUBLIC_URL || `${s3Endpoint}/${s3Bucket}`;

  return {
    port,
    host,
    apiBaseUrl,
    mcpBaseUrl,
    databaseUrl: process.env.DATABASE_URL,
    databaseEngine: (process.env.DATABASE_ENGINE as 'prisma' | 'memory') || 'prisma',
    redisUrl: process.env.REDIS_URL,
    s3Endpoint,
    s3Bucket,
    s3PublicUrl,
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-minimum-32-chars-globalpulse-key',
    jwtIssuer: process.env.JWT_ISSUER || process.env.OAUTH_ISSUER || 'https://auth.globalpulse.news',
    jwtAudience: process.env.JWT_AUDIENCE || process.env.OAUTH_AUDIENCE || 'https://api.globalpulse.news',
    docsUrl: process.env.DOCS_URL || `${apiBaseUrl}/docs`,
  };
}

export const appConfig = getAppConfig();
