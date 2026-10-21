/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  transpilePackages: ['@ai-news/blocks-ui', '@ai-news/block-studio', '@ai-news/schemas'],
};

export default nextConfig;
