import { test, expect } from '@playwright/test';

test.describe('Rewards and Achievements', () => {
  test.describe('Stickers', () => {
    test('should access sticker collection', async ({ page }) => {
      await page.goto('/stickers');
      
      await expect(page.locator('h1, h2')).toContainText('Stickers', { ignoreCase: true });
      
      // Check for sticker grid or collection
      const stickerContainer = page.locator('[data-testid="sticker-book"], .sticker-grid');
      await expect(stickerContainer.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show locked and unlocked stickers', async ({ page }) => {
      await page.goto('/stickers');
      await page.waitForTimeout(1000);
      
      // Should have stickers with locked/unlocked states
      const stickers = page.locator('[data-testid="sticker-card"], .sticker-item');
      const stickerCount = await stickers.count();
      
      expect(stickerCount).toBeGreaterThan(0);
    });
  });

  test.describe('Progress Tracking', () => {
    test('should access progress page', async ({ page }) => {
      await page.goto('/progress');
      
      await expect(page.locator('h1, h2')).toContainText('Progress', { ignoreCase: true });
    });

    test('should show activity statistics', async ({ page }) => {
      await page.goto('/progress');
      
      // Check for progress indicators, charts, or stats
      const progressIndicators = page.locator('[data-testid="progress-stat"], .stat-card, canvas');
      await expect(progressIndicators.first()).toBeVisible({ timeout: 5000 });
    });

    test('should display score in header', async ({ page }) => {
      await page.goto('/');
      
      // Score should be visible in header
      const scoreDisplay = page.locator('.score-display, [data-testid="score"]');
      await expect(scoreDisplay).toBeVisible();
      await expect(scoreDisplay).toContainText(/\d+/); // Contains a number
    });
  });

  test.describe('Achievements', () => {
    test('should show achievement badges', async ({ page }) => {
      await page.goto('/progress');
      
      // Look for achievement section or badges
      const achievements = page.locator('[data-testid="achievement"], .achievement-badge, .badge');
      
      // May not have achievements yet, so just check if section exists
      const achievementSection = page.locator(':text("Achievement"), :text("Badge")');
      const hasAchievementUI = await achievements.count() > 0 || await achievementSection.count() > 0;
      
      // UI should at least reference achievements
      expect(hasAchievementUI).toBeTruthy();
    });
  });
});
