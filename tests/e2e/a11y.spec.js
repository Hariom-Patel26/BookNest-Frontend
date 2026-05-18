import { test, expect } from '@playwright/test';

test.describe('Accessibility and Semantic HTML', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have a main landmark', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Ensure there's at least one H1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('images should have alt text', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Alt can be empty for decorative images, but it should exist
      expect(alt).not.toBeNull();
    }
  });

  test('buttons should have descriptive text or labels', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).innerText();
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('links should have descriptive text', async ({ page }) => {
    const links = page.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).innerText();
      const ariaLabel = await links.nth(i).getAttribute('aria-label');
      // Filter out icon-only links that might not have text but should have aria-label
      if (!text) {
        expect(ariaLabel).toBeTruthy();
      }
    }
  });
});
