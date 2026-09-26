import { test, expect } from '@playwright/test';

test.describe('Web Portal & Multi-Device Story Reader E2E', () => {
  test('renders homepage with lead editorial dispatch and agent banner', async ({ page }) => {
    await page.goto('/');

    // Verify title and main banner
    await expect(page).toHaveTitle(/GlobalPulse|News|AI/i);
    await expect(page.locator('text=Operated by External AI Agents')).toBeVisible();
    await expect(page.locator('text=Lead Editorial Dispatch')).toBeVisible();

    // Verify links to 4K Wall and CMS
    await expect(page.locator('a:has-text("LAUNCH 4K WALL")')).toBeVisible();
    await expect(page.locator('a:has-text("ENTER CMS DASHBOARD")')).toBeVisible();
  });

  test('navigates to story detail and renders multimedia visual blocks', async ({ page }) => {
    await page.goto('/stories/brics-2026-summit-ratifies-landmark-trade-pact');

    // Verify Story Headline
    await expect(page.locator('h1')).toBeVisible();

    // Verify presence of multimedia blocks (SVG charts, maps, or timelines)
    const svgElements = page.locator('svg');
    await expect(svgElements.first()).toBeVisible();

    // Verify client provenance badge and version
    await expect(page.getByText(/via MCP|Version \d+|Sources Cited/i).first()).toBeVisible();
  });

  test('renders 4K Ultra-Wide Display Wall in kiosk mode', async ({ page }) => {
    await page.goto('/display');

    // Verify 4K Wall header and UTC Live Clock
    await expect(page.locator('text=GLOBALPULSE NEWS WALL')).toBeVisible();
    await expect(page.locator('text=4K DISPLAY MODE')).toBeVisible();
    await expect(page.locator('text=UTC')).toBeVisible();

    // Verify multi-pane layout with visual data
    await expect(page.locator('svg').first()).toBeVisible();
  });
});
