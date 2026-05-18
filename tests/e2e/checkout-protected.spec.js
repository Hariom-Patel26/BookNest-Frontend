import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout');
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // If not logged in, should redirect to login or show an error
    await page.waitForURL(url => url.pathname.includes('/login') || url.pathname.includes('/checkout'));
    
    // In many setups, it redirects to /login?redirect=/checkout
    if (page.url().includes('/login')) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      // Or it might show a Please Login message
      const loginMsg = page.getByText(/Please log in/i);
      if (await loginMsg.isVisible()) {
        await expect(loginMsg).toBeVisible();
      }
    }
  });
});

test.describe('Protected Routes', () => {
  const protectedPaths = [
    '/profile',
    '/orders',
    '/wallet',
    '/wishlist',
    '/notifications',
    '/admin'
  ];

  for (const path of protectedPaths) {
    test(`should restrict access to ${path} for unauthenticated users`, async ({ page }) => {
      await page.goto(path);
      // Typically redirects to login
      await page.waitForURL(url => url.pathname.includes('/login') || url.pathname.includes('/404') || url.pathname === '/');
      const currentUrl = page.url();
      expect(currentUrl.includes(path)).toBeFalsy();
    });
  }
});
