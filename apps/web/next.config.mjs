/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
};

export default nextConfig;
