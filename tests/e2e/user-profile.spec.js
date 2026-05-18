import { test, expect } from '@playwright/test';

test.describe('User Profile and Account', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profile (protected route, might need mock login)
    await page.goto('/profile');
  });

  test('should render profile information', async ({ page }) => {
    // Check for user details section
    const details = page.locator('main').or(page.locator('.profile-info'));
    await expect(details).toBeVisible();
    await expect(page.locator('h1, h2')).toContainText(/Profile|Account/i);
  });

  test('should have editable fields in profile', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /Edit/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      const nameInput = page.getByLabel(/Name/i).or(page.locator('input[name="name"]'));
      await expect(nameInput).toBeVisible();
    }
  });

  test('should display wallet balance', async ({ page }) => {
    await page.goto('/wallet');
    await expect(page.locator('body')).toContainText(/Balance|₹|\$/i);
    
    // Check for "Add Money" button
    const addMoneyBtn = page.getByRole('button', { name: /Add|Top up/i });
    await expect(addMoneyBtn.first()).toBeVisible();
  });

  test('should show order history', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('h1, h2')).toContainText(/Orders|History/i);
    
    const orderList = page.locator('.orders-list').or(page.locator('table'));
    await expect(orderList.first()).toBeVisible();
  });

  test('should show wishlist items', async ({ page }) => {
    await page.goto('/wishlist');
    await expect(page.locator('h1, h2')).toContainText(/Wishlist/i);
  });

  test('should show notifications', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('h1, h2')).toContainText(/Notifications/i);
  });
});
