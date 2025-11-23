import { test, expect } from '@playwright/test';

test.describe('Story Reading Experience', () => {
  test('should access story library', async ({ page }) => {
    await page.goto('/stories');
    
    await expect(page.locator('h1, h2')).toContainText('Stories', { ignoreCase: true });
    
    // Check for story cards
    const storyCards = page.locator('[data-testid="story-card"], .story-card');
    await expect(storyCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open and read a story', async ({ page }) => {
    await page.goto('/stories');
    
    // Wait for stories to load
    await page.waitForTimeout(1000);
    
    // Click first story card
    const firstStory = page.locator('[data-testid="story-card"], .story-card').first();
    await firstStory.click();
    
    // Should navigate to story reader
    await expect(page).toHaveURL(/\/stories\/.+/);
    
    // Check for story content
    const storyText = page.locator('[data-testid="story-text"], .story-content, p');
    await expect(storyText.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have page navigation controls', async ({ page }) => {
    await page.goto('/stories');
    await page.waitForTimeout(1000);
    
    // Open first story
    const firstStory = page.locator('[data-testid="story-card"], .story-card').first();
    await firstStory.click();
    
    // Wait for story to load
    await page.waitForTimeout(1500);
    
    // Check for next/previous buttons or page indicators
    const navControls = page.locator('button:has-text("Next"), button:has-text("Previous"), [aria-label*="next"], [aria-label*="previous"]');
    const pageIndicator = page.locator('[data-testid="page-number"], .page-indicator');
    
    // At least one navigation method should exist
    const hasNavControls = await navControls.count() > 0;
    const hasPageIndicator = await pageIndicator.count() > 0;
    expect(hasNavControls || hasPageIndicator).toBeTruthy();
  });

  test('should have audio narration controls', async ({ page }) => {
    await page.goto('/stories');
    await page.waitForTimeout(1000);
    
    // Open first story
    const firstStory = page.locator('[data-testid="story-card"], .story-card').first();
    await firstStory.click();
    
    await page.waitForTimeout(1500);
    
    // Check for play/pause audio controls
    const audioControls = page.locator('button[aria-label*="play"], button[aria-label*="audio"], audio');
    
    // Audio controls might auto-play or be available
    const hasAudioControls = await audioControls.count() > 0;
    expect(hasAudioControls).toBeTruthy();
  });

  test('should access reading practice', async ({ page }) => {
    await page.goto('/reading');
    
    await expect(page.locator('body')).toContainText('Reading', { ignoreCase: true });
  });
});
