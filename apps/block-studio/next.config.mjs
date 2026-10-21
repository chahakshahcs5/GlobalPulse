/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  transpilePackages: ['@ai-news/blocks-ui', '@ai-news/block-studio', '@ai-news/schemas'],
  // The studio loads real blocks from the newsroom API, so it needs the same
  // proxy the web portal uses.
  async rewrites() {
    const apiUrl =
      process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return [
      { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
      { source: '/health', destination: `${apiUrl}/health` },
    ];
  },
};

export default nextConfig;
