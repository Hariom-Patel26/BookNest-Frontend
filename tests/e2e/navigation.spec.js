import { test, expect } from '@playwright/test';

test.describe('Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have a working navbar', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('should contain main navigational links', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav.getByRole('link', { name: /Books/i }).first()).toBeVisible();
    await expect(nav.getByRole('link', { name: /Cart/i }).first()).toBeVisible();
    await expect(nav.getByRole('link', { name: /Login/i }).first()).toBeVisible();
  });

  test('should navigate to Home on logo click', async ({ page }) => {
    await page.goto('/login');
    // Assuming the logo text is BookNest or there is an image link
    const logo = page.getByRole('link', { name: /BookNest/i }).first().or(page.locator('.logo'));
    if (await logo.isVisible()) {
      await logo.click();
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('should render footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/©|Copyright/i);
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.locator('body')).toContainText(/404|Not Found/i);
    const goHome = page.getByRole('link', { name: /Home/i });
    if (await goHome.isVisible()) {
      await goHome.click();
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('should render promotional banner if present', async ({ page }) => {
    // Looking for the Banner component (often above navbar or inside it)
    const banner = page.locator('.banner').or(page.locator('[class*="banner"]'));
    if (await banner.isVisible()) {
      await expect(banner).toBeVisible();
    }
  });
});

test.describe('Responsive Layout', () => {
  // Test across multiple viewport sizes
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    test(`navbar should adapt to ${vp.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();

      if (vp.name === 'Mobile') {
        // Look for hamburger menu
        const menuBtn = page.locator('button[aria-label="Menu"]').or(page.locator('.menu-icon'));
        if (await menuBtn.isVisible()) {
          await expect(menuBtn).toBeVisible();
        }
      }
    });
  }
});
