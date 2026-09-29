import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { validateConfig } from '../../../apps/api/src/config/configuration';

describe('Production Security Hardening & Secret Governance', () => {
  describe('CORS Restrictions', () => {
    let app: FastifyInstance;
    const origOrigins = process.env.ALLOWED_ORIGINS;

    beforeAll(async () => {
      process.env.ALLOWED_ORIGINS = 'https://globalpulse.news,https://admin.globalpulse.news';
      app = buildServer();
      await app.ready();
    });

    afterAll(async () => {
      if (origOrigins !== undefined) {
        process.env.ALLOWED_ORIGINS = origOrigins;
      } else {
        delete process.env.ALLOWED_ORIGINS;
      }
      await app.close();
    });

    it('allows requests originating from approved domains', async () => {
      const res = await app.inject({
        method: 'OPTIONS',
        url: '/api/categories',
        headers: {
          origin: 'https://globalpulse.news',
          'access-control-request-method': 'GET',
        },
      });

      expect(res.headers['access-control-allow-origin']).toBe('https://globalpulse.news');
    });

    it('denies CORS headers to untrusted origins', async () => {
      const res = await app.inject({
        method: 'OPTIONS',
        url: '/api/categories',
        headers: {
          origin: 'https://malicious-scam-site.org',
          'access-control-request-method': 'GET',
        },
      });

      // Disallowed origin should not receive an allowed origin header reflecting the evil domain
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Production Environment & Secret Validation', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;
    const originalDbUrl = process.env.DATABASE_URL;

    afterAll(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      process.env.JWT_SECRET = originalSecret;
      process.env.DATABASE_URL = originalDbUrl;
    });

    it('rejects startup in production mode if JWT_SECRET is the default dev key', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      process.env.JWT_SECRET = 'dev-secret-minimum-32-chars-globalpulse-key';

      expect(() => {
        validateConfig({
          port: 3000,
          host: '0.0.0.0',
          apiBaseUrl: 'http://localhost:3000',
          mcpBaseUrl: 'http://localhost:3001',
          databaseEngine: 'memory',
          s3Bucket: 'news',
          s3PublicUrl: 'http://localhost:9000/news',
          jwtSecret: process.env.JWT_SECRET || '',
          jwtIssuer: 'https://auth.globalpulse.news',
          jwtAudience: 'https://api.globalpulse.news',
          docsUrl: 'http://localhost:3000/docs',
        });
      }).toThrow(/SECURITY ALERT.*JWT_SECRET/i);
    });

    it('rejects startup in production mode if JWT_SECRET is too short (< 32 chars)', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      process.env.JWT_SECRET = 'short_insecure_secret';

      expect(() => {
        validateConfig({
          port: 3000,
          host: '0.0.0.0',
          apiBaseUrl: 'http://localhost:3000',
          mcpBaseUrl: 'http://localhost:3001',
          databaseEngine: 'memory',
          s3Bucket: 'news',
          s3PublicUrl: 'http://localhost:9000/news',
          jwtSecret: process.env.JWT_SECRET || '',
          jwtIssuer: 'https://auth.globalpulse.news',
          jwtAudience: 'https://api.globalpulse.news',
          docsUrl: 'http://localhost:3000/docs',
        });
      }).toThrow(/SECURITY ALERT.*32 characters/i);
    });

    it('rejects startup in production mode if DATABASE_ENGINE is prisma but DATABASE_URL is missing', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      process.env.JWT_SECRET =
        'a_secure_custom_production_secret_key_exceeding_32_characters_12345';
      delete process.env.DATABASE_URL;

      expect(() => {
        validateConfig({
          port: 3000,
          host: '0.0.0.0',
          apiBaseUrl: 'http://localhost:3000',
          mcpBaseUrl: 'http://localhost:3001',
          databaseEngine: 'prisma',
          databaseUrl: undefined,
          s3Bucket: 'news',
          s3PublicUrl: 'http://localhost:9000/news',
          jwtSecret: process.env.JWT_SECRET || '',
          jwtIssuer: 'https://auth.globalpulse.news',
          jwtAudience: 'https://api.globalpulse.news',
          docsUrl: 'http://localhost:3000/docs',
        });
      }).toThrow(/DATABASE CONFIG ERROR.*DATABASE_URL/i);
    });

    it('accepts valid configuration in production mode with strong secrets', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      process.env.JWT_SECRET =
        'a_secure_custom_production_secret_key_exceeding_32_characters_12345';
      process.env.DATABASE_URL = 'postgresql://usr:pwd@localhost:5432/db';

      expect(() => {
        validateConfig({
          port: 3000,
          host: '0.0.0.0',
          apiBaseUrl: 'http://localhost:3000',
          mcpBaseUrl: 'http://localhost:3001',
          databaseEngine: 'prisma',
          databaseUrl: process.env.DATABASE_URL,
          s3Bucket: 'news',
          s3PublicUrl: 'http://localhost:9000/news',
          jwtSecret: process.env.JWT_SECRET || '',
          jwtIssuer: 'https://auth.globalpulse.news',
          jwtAudience: 'https://api.globalpulse.news',
          docsUrl: 'http://localhost:3000/docs',
        });
      }).not.toThrow();
    });
  });
});
