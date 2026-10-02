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
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '0.0.0.0';
  const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;
  const mcpPort = parseInt(process.env.MCP_PORT || '4001', 10);
  const mcpBaseUrl = process.env.MCP_BASE_URL || `http://localhost:${mcpPort}`;
  const s3Endpoint =
    process.env.S3_ENDPOINT ||
    process.env.B2_ENDPOINT ||
    process.env.MINIO_ENDPOINT ||
    'http://localhost:9000';
  const s3Bucket = process.env.S3_BUCKET || process.env.B2_BUCKET || 'news-media';
  const s3Region = process.env.S3_REGION || process.env.B2_REGION || 'us-east-005';
  const s3PublicUrl =
    process.env.S3_PUBLIC_URL ||
    process.env.B2_PUBLIC_URL ||
    (s3Endpoint.includes('backblazeb2.com')
      ? `https://${s3Bucket}.s3.${s3Region}.backblazeb2.com`
      : `${s3Endpoint}/${s3Bucket}`);

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
    jwtIssuer:
      process.env.JWT_ISSUER || process.env.OAUTH_ISSUER || 'https://auth.globalpulse.news',
    jwtAudience:
      process.env.JWT_AUDIENCE || process.env.OAUTH_AUDIENCE || 'https://api.globalpulse.news',
    docsUrl: process.env.DOCS_URL || `${apiBaseUrl}/docs`,
  };
}

export function validateConfig(config: AppConfig): void {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret || rawSecret.includes('dev-secret') || rawSecret.length < 32) {
      throw new Error(
        'SECURITY ALERT: Production deployment requires a custom, cryptographically secure JWT_SECRET of at least 32 characters.'
      );
    }
    if (config.databaseEngine === 'prisma' && !config.databaseUrl) {
      throw new Error(
        'DATABASE CONFIG ERROR: DATABASE_URL must be specified when DATABASE_ENGINE is set to prisma in production.'
      );
    }
  }
}

export const appConfig = getAppConfig();
validateConfig(appConfig);
