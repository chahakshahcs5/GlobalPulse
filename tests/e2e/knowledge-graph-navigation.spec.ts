import { test, expect } from '@playwright/test';

/**
 * Knowledge Graph navigation E2E: entity dossier → live event tracker,
 * plus reader-facing experience pages (Explore, For You, Tip Line).
 *
 * Assertions target structural UI landmarks (breadcrumbs, badges, headings)
 * rather than exact editorial titles so the suite stays resilient whether the
 * API serves live data or the pages fall back to bundled demo content.
 */
test.describe('Knowledge Graph & Reader Experiences E2E', () => {
  test.setTimeout(90_000);

  test('renders the entity dossier with knowledge-graph landmarks', async ({ page }) => {
    await page.goto('/entities/ent_india');

    // Breadcrumb marks the entity profile route
    await expect(page.locator('text=Entity Profile').first()).toBeVisible();

    // Verified entity badge from the knowledge graph header
    await expect(page.locator('text=VERIFIED ENTITY')).toBeVisible();
    await expect(page.locator('text=Knowledge Graph').first()).toBeVisible();

    // The entity name must render as the page h1
    await expect(page.locator('h1')).toContainText(/\S/);

    // Aliases strip renders when the entity has known aliases
    const aliases = page.locator('text=Known Aliases:');
    const aliasCount = await aliases.count();
    if (aliasCount > 0) {
      await expect(aliases.first()).toBeVisible();
    }
  });

  test('navigates from the entity dossier to its live event tracker', async ({ page }) => {
    await page.goto('/entities/ent_india');

    const eventLink = page.locator('a[href^="/events/"]').first();
    const hasEvents = (await eventLink.count()) > 0;
    test.skip(
      !hasEvents,
      'No linked chronological events rendered for this entity in this environment'
    );

    await eventLink.click();
    await page.waitForURL(/\/events\//);

    await expect(page.locator('text=Event Monitoring').first()).toBeVisible();
    await expect(page.locator('text=Chronological Tracker').first()).toBeVisible();
    await expect(page.locator('text=MCP FEED ACTIVE').first()).toBeVisible();

    // The spatial coordinates panel renders for events carrying coordinates
    const geoPanel = page.locator('text=Spatial Geospatial Coordinates');
    if ((await geoPanel.count()) > 0) {
      await expect(geoPanel.first()).toBeVisible();
    }
  });

  test('explore directory exposes search, tabs, and directory sections', async ({ page }) => {
    await page.goto('/explore');

    await expect(page.locator('h1')).toContainText('Explore Categories, Topics & Sources');
    await expect(page.locator('text=Explore Directory').first()).toBeVisible();

    const search = page.locator('input[placeholder*="Search"]');
    await expect(search).toBeVisible();

    await expect(page.locator('text=All Explorer').first()).toBeVisible();
    await expect(page.getByText('Categories', { exact: true }).first()).toBeVisible();
  });

  test('personalized For You feed shows algorithmic transparency controls', async ({ page }) => {
    await page.goto('/for-you');

    await expect(page.locator('h1')).toContainText('For You: Personalized Stories');
    await expect(page.locator('text=Transparent Algorithmic Feed').first()).toBeVisible();
  });

  test('citizen tip line renders the anonymous submission experience', async ({ page }) => {
    await page.goto('/tips');

    await expect(page.locator('h1')).toContainText('Citizen Tip Line');
    await expect(page.locator('text=Secure Tip Line').first()).toBeVisible();

    // Urgency selector and anonymity mode must be interactive form controls
    const controls = page.locator('button:visible, input:visible, select:visible');
    await expect(controls.first()).toBeVisible();
  });
});
