/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  ],
  // Proxy API requests to the backend during local development
  // so the browser doesn't need CORS and the frontend can use relative URLs
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
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
