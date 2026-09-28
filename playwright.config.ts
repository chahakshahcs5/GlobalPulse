import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for AI News Platform Multi-Device & Display Wall E2E Testing
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: '4K Display Wall (32:9)',
      use: {
        viewport: { width: 3840, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 7'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 14'],
      },
    },
  ],
  webServer: {
    command: 'pnpm --filter @ai-news/web dev',
    url: 'http://localhost:3002',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
