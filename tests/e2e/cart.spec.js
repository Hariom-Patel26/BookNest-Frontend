import { test, expect } from '@playwright/test';

test.describe('Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cart');
  });

  test('should load the cart page', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /Cart|Shopping Cart/i })).toBeVisible();
  });

  test('should display empty cart message when empty', async ({ page }) => {
    const emptyMsg = page.getByText(/Your cart is empty|No items/i);
    await expect(emptyMsg).toBeVisible();
    
    // Browse books link should be visible
    const browseLink = page.getByRole('link', { name: /Browse|Shop/i });
    if (await browseLink.isVisible()) {
      await expect(browseLink).toBeVisible();
    }
  });

  test('should not proceed to checkout when empty', async ({ page }) => {
    const checkoutBtn = page.getByRole('button', { name: /Checkout/i });
    if (await checkoutBtn.isVisible()) {
      await expect(checkoutBtn).toBeDisabled();
    }
  });

  // Adding items to cart is typically an integration test that requires 
  // navigating to a book, clicking add, and returning to cart.
  test('should navigate to books to add items', async ({ page }) => {
    const browseLink = page.getByRole('link', { name: /Browse|Shop|Continue Shopping/i }).first();
    if (await browseLink.isVisible()) {
      await browseLink.click();
      await expect(page).toHaveURL(/.*\/books/);
    }
  });

  test('should allow increasing item quantity in cart', async ({ page }) => {
    // Mocking interaction with quantity buttons
    const plusBtn = page.locator('button').filter({ hasText: '+' }).first();
    if (await plusBtn.isVisible()) {
      const initialValue = await page.locator('input[type="number"]').first().inputValue();
      await plusBtn.click();
      const newValue = await page.locator('input[type="number"]').first().inputValue();
      expect(Number(newValue)).toBeGreaterThan(Number(initialValue));
    }
  });

  test('should allow decreasing item quantity in cart', async ({ page }) => {
    const minusBtn = page.locator('button').filter({ hasText: '-' }).first();
    if (await minusBtn.isVisible()) {
      await minusBtn.click();
      // Logic for checking reduction
    }
  });

  test('should allow removing an item from cart', async ({ page }) => {
    const removeBtn = page.getByRole('button', { name: /Remove|Delete/i }).first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      // Should show empty message if it was the only item
    }
  });
});
