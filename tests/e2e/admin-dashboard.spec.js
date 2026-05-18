import { test, expect } from '@playwright/test';

test.describe('Admin Management', () => {
  // We'll mock the admin authentication state for these tests
  test.beforeEach(async ({ page }) => {
    // In a real scenario, you'd set a cookie or localStorage token here
    // For now, we navigate directly to the dashboard
    await page.goto('/admin');
  });

  test('should render admin dashboard overview', async ({ page }) => {
    // Check for dashboard stats cards
    const statsContainer = page.locator('main').or(page.locator('.dashboard-stats'));
    await expect(statsContainer).toBeVisible();
    
    // Check for specific stat labels often found in dashboards
    await expect(page.locator('body')).toContainText(/Total Books|Total Orders|Total Users/i);
  });

  test('should navigate to admin book management', async ({ page }) => {
    await page.goto('/admin/books');
    await expect(page.locator('h1, h2')).toContainText(/Books|Inventory/i);
    
    // Check if "Add Book" button exists
    const addBtn = page.getByRole('button', { name: /Add|Create|New/i });
    await expect(addBtn.first()).toBeVisible();
  });

  test('should navigate to admin order management', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('h1, h2')).toContainText(/Orders/i);
    
    // Check if table exists
    const table = page.locator('table').or(page.locator('.orders-list'));
    await expect(table.first()).toBeVisible();
  });

  test('should navigate to admin user management', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('h1, h2')).toContainText(/Users|Customers/i);
  });

  test('should navigate to admin analytics', async ({ page }) => {
    await page.goto('/admin/analytics');
    await expect(page.locator('h1, h2')).toContainText(/Analytics|Reports/i);
    
    // Check for charts or data visualizations
    const charts = page.locator('.recharts-wrapper').or(page.locator('canvas'));
    await expect(charts.first()).toBeVisible();
  });
  
  test('should navigate to admin reviews management', async ({ page }) => {
    await page.goto('/admin/reviews');
    await expect(page.locator('h1, h2')).toContainText(/Reviews/i);
  });
});
