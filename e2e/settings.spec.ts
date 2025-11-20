import { test, expect } from '@playwright/test';

test.describe('Settings and Configuration', () => {
  test('should access settings page', async ({ page }) => {
    await page.goto('/settings');
    
    await expect(page.locator('h1, h2')).toContainText('Settings', { ignoreCase: true });
  });

  test('should have Jubee customization options', async ({ page }) => {
    await page.goto('/');
    
    // Click customize button in header
    const customizeButton = page.locator('button:has-text("Customize"), button[aria-label*="Customize"]');
    await customizeButton.click();
    
    // Customization dialog/modal should appear
    const customizationModal = page.locator('[role="dialog"], [data-testid="jubee-personalization"]');
    await expect(customizationModal).toBeVisible({ timeout: 3000 });
  });

  test('should toggle Jubee visibility', async ({ page }) => {
    await page.goto('/');
    
    // Wait for Jubee to be visible
    const jubee = page.locator('[data-testid="jubee-mascot"]');
    await expect(jubee).toBeVisible({ timeout: 5000 });
    
    // Click hide/show button
    const toggleButton = page.locator('button:has-text("Hide"), button:has-text("Show"), button[aria-label*="Jubee"]');
    await toggleButton.first().click();
    
    // Jubee should be hidden
    await page.waitForTimeout(500);
    const isVisible = await jubee.isVisible().catch(() => false);
    
    // Either hidden or button text changed to "Show"
    const showButton = await page.locator('button:has-text("Show")').count();
    expect(!isVisible || showButton > 0).toBeTruthy();
  });

  test('should have language selector', async ({ page }) => {
    await page.goto('/settings');
    
    // Look for language selector
    const languageSelector = page.locator('[data-testid="language-selector"], select[name="language"], button:has-text("Language")');
    
    // Language settings should exist
    const hasLanguageUI = await languageSelector.count() > 0;
    expect(hasLanguageUI).toBeTruthy();
  });

  test('should have voice settings for Jubee', async ({ page }) => {
    await page.goto('/');
    
    // Open customization
    const customizeButton = page.locator('button:has-text("Customize")');
    await customizeButton.click();
    
    await page.waitForTimeout(500);
    
    // Look for voice selector within modal
    const voiceSelector = page.locator('[data-testid="voice-selector"], button:has-text("Voice"), select[name="voice"]');
    
    const hasVoiceUI = await voiceSelector.count() > 0;
    expect(hasVoiceUI).toBeTruthy();
  });
});
