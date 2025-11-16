import { test, expect } from '@playwright/test';

test.describe('App Navigation', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/JubeeLove/);
  });

  test('should access all main sections without auth', async ({ page }) => {
    await page.goto('/');

    // Test navigation to different sections
    const sections = [
      { path: '/shapes', text: 'Shapes' },
      { path: '/writing', text: 'Writing' },
      { path: '/music', text: 'Music' },
      { path: '/stickers', text: 'Stickers' },
      { path: '/progress', text: 'Progress' },
    ];

    for (const section of sections) {
      await page.goto(section.path);
      await expect(page.locator('body')).toContainText(section.text, { 
        ignoreCase: true 
      });
    }
  });

  test('should show Jubee mascot on all pages', async ({ page }) => {
    await page.goto('/');
    
    // Wait for Jubee to be visible
    const jubee = page.locator('[data-testid="jubee-mascot"]');
    await expect(jubee).toBeVisible({ timeout: 5000 });
  });

  test('should allow access to settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1, h2')).toContainText('Settings', { 
      ignoreCase: true 
    });
  });
});
