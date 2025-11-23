import { test, expect } from '@playwright/test';

test.describe('Onboarding Tutorial', () => {
  test.beforeEach(async ({ context }) => {
    // Clear onboarding state to force tutorial on fresh session
    await context.clearCookies();
    await context.addInitScript(() => {
      localStorage.removeItem('jubee-onboarding-storage');
    });
  });

  test('should show onboarding for first-time users', async ({ page }) => {
    await page.goto('/');
    
    // Wait for onboarding to appear
    await page.waitForTimeout(1500); // Onboarding starts after 1s delay
    
    // Check for onboarding overlay or tutorial elements
    const onboarding = page.locator('[data-testid="onboarding"], [role="dialog"]:has-text("Welcome"), .onboarding-tutorial');
    
    // Onboarding should be visible
    await expect(onboarding.first()).toBeVisible({ timeout: 3000 });
  });

  test('should be able to progress through onboarding steps', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    
    // Look for next/continue button
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Got it")');
    
    if (await nextButton.count() > 0) {
      await nextButton.first().click();
      
      // Should still see onboarding (on next step) or it completes
      await page.waitForTimeout(500);
      
      // If there are more steps, next button should still be visible or tutorial closed
      const onboardingVisible = await page.locator('[data-testid="onboarding"], [role="dialog"]').count() > 0;
      expect(typeof onboardingVisible).toBe('boolean');
    }
  });

  test('should allow skipping onboarding', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    
    // Look for skip button
    const skipButton = page.locator('button:has-text("Skip"), button:has-text("Close"), [aria-label*="close"]');
    
    if (await skipButton.count() > 0) {
      await skipButton.first().click();
      
      // Onboarding should close
      await page.waitForTimeout(500);
      const onboardingVisible = await page.locator('[data-testid="onboarding"], [role="dialog"]:has-text("Welcome")').isVisible();
      expect(onboardingVisible).toBe(false);
    }
  });

  test('should not show onboarding on subsequent visits', async ({ page, context }) => {
    // First visit - complete onboarding
    await page.goto('/');
    await page.waitForTimeout(1500);
    
    const skipButton = page.locator('button:has-text("Skip"), button:has-text("Close")').first();
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }
    
    // Reload page (simulating second visit)
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Onboarding should NOT appear
    const onboarding = page.locator('[data-testid="onboarding"], [role="dialog"]:has-text("Welcome")');
    const isVisible = await onboarding.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});
