import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import dotenv from 'dotenv';

// The repository keeps one `.env` at the root. Next only looks inside the app
// directory, so load the root file explicitly before reading any variables.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const localEnv = join(repoRoot, '.env.local');
if (existsSync(localEnv)) dotenv.config({ path: localEnv });
dotenv.config({ path: join(repoRoot, '.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Windows and Linux build the same tree. On Termux, where no native SWC
  // binary exists, either build on Windows and ship .next/standalone, or use
  // the @next/swc-wasm-nodejs fallback documented in docs/platforms.md.
  output: 'standalone',
  // The portal does not use next/image. Turning optimisation off keeps sharp
  // (a native optional dependency of Next) out of the runtime path on Termux,
  // where no bionic build exists.
  images: { unoptimized: true },
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  transpilePackages: [
    '@ai-news/schemas',
    '@ai-news/shared',
    '@ai-news/database',
    '@ai-news/content',
    '@ai-news/stories',
    '@ai-news/events',
    '@ai-news/topics',
    '@ai-news/entities',
    '@ai-news/sources',
    '@ai-news/search',
    '@ai-news/auth',
    '@ai-news/media',
    '@ai-news/api-client',
    '@ai-news/blocks-ui',
    '@ai-news/block-studio',
  ],
  async redirects() {
    return [
      {
        source: '/kiosk',
        destination: '/display',
        permanent: true,
      },
      {
        source: '/wall',
        destination: '/display',
        permanent: true,
      },
    ];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next injects inline bootstrap scripts; a nonce-based policy is a
      // follow-up, but these directives still block external script origins.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()',
          },
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains',
                },
              ]
            : []),
        ],
      },
    ];
  },
  // Proxy API requests to the backend during local development
  // so the browser doesn't need CORS and the frontend can use relative URLs
  async rewrites() {
    const apiPort = process.env.PORT || '4000';
    const apiUrl =
      process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      `http://localhost:${apiPort}`;
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${apiUrl}/health`,
      },
      {
        source: '/graphql',
        destination: `${apiUrl}/graphql`,
      },
      {
        source: '/graphiql',
        destination: `${apiUrl}/graphiql`,
      },
      {
        source: '/rss.xml',
        destination: `${apiUrl}/rss.xml`,
      },
      {
        source: '/atom.xml',
        destination: `${apiUrl}/atom.xml`,
      },
      {
        source: '/sitemap.xml',
        destination: `${apiUrl}/sitemap.xml`,
      },
      {
        source: '/feeds/:path*',
        destination: `${apiUrl}/feeds/:path*`,
      },
    ];
  },
};

export default nextConfig;
