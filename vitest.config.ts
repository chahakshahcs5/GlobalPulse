import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_ENGINE: 'memory',
      // Dev tokens for test suites (format: role:clientType)
      DEV_TOKEN_ADMIN: 'admin:internal_service',
      DEV_TOKEN_EDITOR: 'editor:human_web',
      DEV_TOKEN_JOURNALIST: 'journalist:human_web',
      DEV_TOKEN_READER: 'reader:human_mobile',
      DEV_TOKEN_GEMINI: 'ai_agent:gemini_spark',
      DEV_TOKEN_CHATGPT: 'ai_agent:chatgpt',
      DEV_TOKEN_CLAUDE: 'ai_agent:claude',
      DEV_TOKEN_TEST: 'editor:human_web',
    },
  },
  resolve: {
    alias: {
      '@ai-news/schemas': path.resolve(__dirname, 'libs/schemas/src/index.ts'),
      '@ai-news/shared': path.resolve(__dirname, 'libs/shared/src/index.ts'),
      '@ai-news/database': path.resolve(__dirname, 'libs/database/src/index.ts'),
      '@ai-news/content': path.resolve(__dirname, 'libs/content/src/index.ts'),
      '@ai-news/stories': path.resolve(__dirname, 'libs/stories/src/index.ts'),
      '@ai-news/events': path.resolve(__dirname, 'libs/events/src/index.ts'),
      '@ai-news/topics': path.resolve(__dirname, 'libs/topics/src/index.ts'),
      '@ai-news/entities': path.resolve(__dirname, 'libs/entities/src/index.ts'),
      '@ai-news/sources': path.resolve(__dirname, 'libs/sources/src/index.ts'),
      '@ai-news/search': path.resolve(__dirname, 'libs/search/src/index.ts'),
      '@ai-news/auth': path.resolve(__dirname, 'libs/auth/src/index.ts'),
      '@ai-news/media': path.resolve(__dirname, 'libs/media/src/index.ts'),
      '@ai-news/observability': path.resolve(__dirname, 'libs/observability/src/index.ts'),
      '@ai-news/jobs': path.resolve(__dirname, 'libs/jobs/src/index.ts'),
      '@ai-news/graphql': path.resolve(__dirname, 'libs/graphql/src/index.ts'),
      'react-native': path.resolve(__dirname, 'apps/mobile/src/react-native-compat.tsx'),
      '@modelcontextprotocol/sdk': path.resolve(
        __dirname,
        'apps/mcp-server/node_modules/@modelcontextprotocol/sdk/dist/esm'
      ),
      'react-dom': path.resolve(__dirname, 'apps/web/node_modules/react-dom'),
      react: path.resolve(__dirname, 'apps/web/node_modules/react'),
      'lucide-react': path.resolve(__dirname, 'apps/web/node_modules/lucide-react'),
      zod: path.resolve(__dirname, 'libs/schemas/node_modules/zod'),
      rxjs: path.resolve(__dirname, 'apps/api/node_modules/rxjs'),
      fastify: path.resolve(__dirname, 'apps/api/node_modules/fastify'),
    },
  },
});
