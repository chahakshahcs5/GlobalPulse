import { test, expect } from '@playwright/test';

test.describe('Newsroom Editorial CMS Workflow E2E', () => {
  test('displays editorial management dashboard with human override controls', async ({ page }) => {
    await page.goto('/admin');

    // Verify CMS headers and governance indicators
    await expect(page.locator('text=Newsroom Editorial CMS')).toBeVisible();
    await expect(page.locator('text=HUMAN EDITORIAL CONTROL')).toBeVisible();
    await expect(page.locator('text=AI AGENT GOVERNANCE')).toBeVisible();

    // Verify story management table/cards exist
    const publishToggles = page.locator('button:has-text("PUBLISH"), button:has-text("UNPUBLISH")');
    await expect(publishToggles.first()).toBeVisible();
  });

  test('allows human editor to toggle publication state', async ({ page }) => {
    await page.goto('/admin');

    // Find the first toggle button
    const firstButton = page
      .locator('button:has-text("PUBLISH"), button:has-text("UNPUBLISH")')
      .first();
    const initialText = await firstButton.textContent();

    // Click to toggle
    await firstButton.click();

    // Verify text changed
    const expectedNewText = initialText?.includes('UNPUBLISH') ? 'PUBLISH' : 'UNPUBLISH';
    await expect(page.locator(`button:has-text("${expectedNewText}")`).first()).toBeVisible();
  });
});
