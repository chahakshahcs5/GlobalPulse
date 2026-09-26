import { test, expect } from '@playwright/test';

test.describe('Sources Registry & Topic Hubs E2E', () => {
  test('renders provenance and fact-check registry with verified sources', async ({ page }) => {
    await page.goto('/sources');

    // Verify registry header
    await expect(page.locator('text=PROVENANCE & FACT-CHECK REGISTRY')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Verified Sources & Documentation');

    // Verify presence of primary news sources
    await expect(page.locator('text=Reuters').first()).toBeVisible();
    await expect(page.locator('text=External Link ↗').first()).toBeVisible();
  });

  test('renders topic dashboard with related dispatches and coverage count', async ({ page }) => {
    await page.goto('/topics/global-trade');

    // Verify topic title
    await expect(page.locator('text=TOPIC DASHBOARD')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Global Trade');

    // Verify topic coverage count badge
    await expect(page.locator('text=Covered Stories')).toBeVisible();

    // Verify links to story reader
    const readStoryLinks = page.locator('a:has-text("Read Story →")');
    await expect(readStoryLinks.first()).toBeVisible();
  });
});
