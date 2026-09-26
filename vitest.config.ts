import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
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
    },
  },
});
