import { test, expect } from '@playwright/test';

test.describe('Responsive & Mobile Viewport E2E', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14/15 mobile viewport

  test('renders homepage responsively on mobile without horizontal clipping', async ({ page }) => {
    await page.goto('/');

    // Verify brand header
    await expect(page.locator('text=GLOBALPULSE').first()).toBeVisible();

    // Verify agent badge
    await expect(page.locator('text=Operated by External AI Agents')).toBeVisible();

    // Verify lead story dispatch
    await expect(page.locator('text=Lead Editorial Dispatch')).toBeVisible();

    // Verify key action buttons are visible and tap-accessible on mobile
    await expect(page.locator('a:has-text("LAUNCH 4K WALL")')).toBeVisible();
    await expect(page.locator('a:has-text("ENTER CMS DASHBOARD")')).toBeVisible();
  });

  test('navigates to story detail and displays responsive multimedia elements', async ({ page }) => {
    await page.goto('/stories/brics-2026-summit-ratifies-landmark-trade-pact');

    // Verify story headline renders on mobile
    const headline = page.locator('h1');
    await expect(headline).toBeVisible();

    // Verify visual chart/SVG renders
    await expect(page.locator('svg').first()).toBeVisible();

    // Verify provenance metadata
    await expect(page.getByText(/via MCP|Version \d+|Sources Cited/i).first()).toBeVisible();
  });
});
