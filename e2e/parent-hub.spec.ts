import { test, expect } from '@playwright/test';

test.describe('Parent Hub Authentication', () => {
  test('should redirect to auth when accessing parent hub without login', async ({ page }) => {
    await page.goto('/parent');
    
    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should show login form on auth page', async ({ page }) => {
    await page.goto('/auth');
    
    // Check for email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Check for password input
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for sign in button
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should have working tab navigation between sign in and sign up', async ({ page }) => {
    await page.goto('/auth');
    
    // Should start on Sign In tab
    await expect(page.locator('[role="tab"][data-state="active"]')).toContainText('Sign In');
    
    // Click Sign Up tab
    await page.locator('[role="tab"]:has-text("Sign Up")').click();
    await expect(page.locator('[role="tab"][data-state="active"]')).toContainText('Sign Up');
  });
});

test.describe('Parent Hub (Authenticated)', () => {
  // Note: These tests would require setting up authentication
  // For now, we'll skip them or use mocked auth
  test.skip('should show parent dashboard when authenticated', async ({ page }) => {
    // TODO: Implement after setting up test authentication
  });

  test.skip('should allow navigation to parental controls', async ({ page }) => {
    // TODO: Implement after setting up test authentication
  });
});
