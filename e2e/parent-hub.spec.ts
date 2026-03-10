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
    await expect(page.locator('button[type="submit"]:has-text("Sign In")')).toBeVisible();
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
  const mockSession = {
    access_token: 'fake-access-token',
    refresh_token: 'fake-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: '12345678-1234-1234-1234-123456789012',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'parent@example.com',
      app_metadata: { provider: 'email' },
      user_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  };

  test.beforeEach(async ({ context }) => {
    // Inject the mock session into localStorage before any page loads
    await context.addInitScript((sessionStr) => {
      // The Supabase project ref in client.ts is kphdqgidwipqdthehckg
      window.localStorage.setItem('sb-kphdqgidwipqdthehckg-auth-token', sessionStr);
    }, JSON.stringify(mockSession));
  });

  test('should show parent dashboard when authenticated', async ({ page }) => {
    await page.goto('/parent');

    // Should not redirect to auth page
    await expect(page).toHaveURL(/\/parent$/);

    // Verify dashboard elements
    await expect(page.locator('h1')).toContainText('Parent Hub');
    await expect(page.locator('text=Children Profiles').first()).toBeVisible();
    await expect(page.locator('text=Daily Time Limit').first()).toBeVisible();
    await expect(page.locator('text=Protection').first()).toBeVisible();
  });

  test('should allow navigation to parental controls', async ({ page }) => {
    await page.goto('/parent');

    // Verify dashboard elements load
    await expect(page.locator('h1')).toContainText('Parent Hub');

    // Click on "Open Controls" or the Parental Controls card
    await page.locator('button:has-text("Open Controls")').click();

    // Verify navigation to parental controls
    await expect(page).toHaveURL(/\/parent\/controls/);
  });
});
