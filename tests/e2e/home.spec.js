import { test, expect } from '@playwright/test';

test.describe('BookNest E2E Tests', () => {
  test('should load the home page successfully', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Check if the page title contains "BookNest" (adjust if your title is different)
    // We'll just verify the page loads by checking for common elements
    
    // Check if the navbar is visible
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Check if the main banner/heading is present
    // You can adjust the locator based on your actual UI
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check if there is an email input field
    const emailInput = page.getByRole('textbox', { name: /email/i }).first().or(page.locator('input[type="email"]'));
    await expect(emailInput).toBeVisible();
  });
});
