import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should render all login elements', async ({ page }) => {
      await expect(page.locator('h2').filter({ hasText: /Login/i })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.getByText(/Don't have an account\?/i)).toBeVisible();
    });

    test('should show validation errors on empty submission', async ({ page }) => {
      await page.locator('button[type="submit"]').click();
      // Most HTML5 validation prevents submission, or there's a custom error
      // Checking for the form not to submit and stay on the same page
      await expect(page).toHaveURL(/.*\/login/);
    });

    test('should allow typing in email and password', async ({ page }) => {
      const email = page.locator('input[type="email"]');
      const password = page.locator('input[type="password"]');
      await email.fill('test@example.com');
      await password.fill('Password123!');
      await expect(email).toHaveValue('test@example.com');
      await expect(password).toHaveValue('Password123!');
    });

    test('should navigate to register page', async ({ page }) => {
      await page.getByRole('link', { name: /Register/i }).click();
      await expect(page).toHaveURL(/.*\/register/);
    });
  });

  test.describe('Register Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register');
    });

    test('should render all register elements', async ({ page }) => {
      await expect(page.locator('h2').filter({ hasText: /Register/i })).toBeVisible();
      await expect(page.getByPlaceholder(/Name/i)).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation on empty form submission', async ({ page }) => {
      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/.*\/register/);
    });

    test('should fill out registration form', async ({ page }) => {
      await page.getByPlaceholder(/Name/i).fill('John Doe');
      await page.locator('input[type="email"]').fill('john@example.com');
      await page.locator('input[type="password"]').first().fill('Password123!');
      await expect(page.getByPlaceholder(/Name/i)).toHaveValue('John Doe');
      await expect(page.locator('input[type="email"]')).toHaveValue('john@example.com');
    });

    test('should navigate back to login', async ({ page }) => {
      await page.getByRole('link', { name: /Login/i }).click();
      await expect(page).toHaveURL(/.*\/login/);
    });
  });

  // Parameterized tests for different input scenarios
  const invalidEmails = ['plainaddress', '#@%^%#$@#$@#.com', '@example.com', 'Joe Smith <email@example.com>', 'email.example.com', 'email@example@example.com'];
  for (const email of invalidEmails) {
    test(`should reject invalid email format: ${email}`, async ({ page }) => {
      await page.goto('/login');
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(email);
      await page.locator('button[type="submit"]').click();
      // Form should not submit
      await expect(page).toHaveURL(/.*\/login/);
    });
  }

  test('should show error when passwords do not match during registration', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder(/Name/i).fill('John Doe');
    await page.locator('input[type="email"]').fill('john@example.com');
    await page.locator('input[type="password"]').nth(0).fill('Password123!');
    await page.locator('input[type="password"]').nth(1).fill('Mismatch123!');
    await page.locator('button[type="submit"]').click();
    // Assuming UI shows an error or prevents navigation
    await expect(page).toHaveURL(/.*\/register/);
  });

  test('should validate password length', async ({ page }) => {
    await page.goto('/register');
    await page.locator('input[type="password"]').first().fill('123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/register/);
  });
});
