import { test, expect } from '@playwright/test';

/**
 * User Story: Non-Technical Parent's First Experience
 * 
 * As a non-technical parent exploring Jubee.Love for the first time,
 * I want to understand how to use the app through onboarding,
 * Then navigate to stories and read a complete story with my child,
 * So that I can feel confident using the educational platform.
 */

test.describe('Parent User Journey: First-Time Experience', () => {
  test.beforeEach(async ({ context }) => {
    // Simulate first-time user - clear all stored data
    await context.clearCookies();
    await context.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Complete parent journey: onboarding → story selection → full story reading', async ({ page }) => {
    // STEP 1: Parent arrives at Jubee.Love homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('✓ Parent lands on homepage');

    // STEP 2: Onboarding tutorial appears automatically
    await page.waitForTimeout(1500); // Onboarding starts after 1s delay
    
    const onboarding = page.locator('[data-testid="onboarding"], [role="dialog"]:has-text("Welcome")');
    await expect(onboarding.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Onboarding tutorial appears');

    // STEP 3: Parent progresses through onboarding steps
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Got it")').first();
    
    // Go through multiple onboarding steps (up to 5 attempts)
    for (let i = 0; i < 5; i++) {
      const buttonVisible = await nextButton.isVisible().catch(() => false);
      if (!buttonVisible) break;
      
      await nextButton.click();
      await page.waitForTimeout(800);
      console.log(`✓ Completed onboarding step ${i + 1}`);
    }

    // STEP 4: Parent completes or skips onboarding
    const skipButton = page.locator('button:has-text("Skip"), button:has-text("Close"), [aria-label*="close"]').first();
    const skipVisible = await skipButton.isVisible().catch(() => false);
    
    if (skipVisible) {
      await skipButton.click();
      console.log('✓ Parent completes onboarding');
    }

    await page.waitForTimeout(1000);

    // STEP 5: Parent notices the Stories navigation and clicks it
    const storiesNav = page.locator('a[href*="/stories"], button:has-text("Stories"), nav a:has-text("Stories")').first();
    await expect(storiesNav).toBeVisible({ timeout: 5000 });
    await storiesNav.click();
    
    console.log('✓ Parent navigates to Stories section');
    
    await page.waitForURL(/\/stories/);
    await page.waitForTimeout(1000);

    // STEP 6: Parent sees the story library
    await expect(page.locator('h1, h2')).toContainText('Stories', { ignoreCase: true });
    
    const storyCards = page.locator('[data-testid="story-card"], .story-card');
    await expect(storyCards.first()).toBeVisible({ timeout: 5000 });
    
    const storyCount = await storyCards.count();
    console.log(`✓ Parent sees ${storyCount} available stories`);

    // STEP 7: Parent selects the first story
    const firstStory = storyCards.first();
    const storyTitle = await firstStory.locator('h2, h3, [class*="title"]').first().textContent();
    
    await firstStory.click();
    console.log(`✓ Parent selects story: "${storyTitle}"`);
    
    await expect(page).toHaveURL(/\/stories\/.+/);
    await page.waitForTimeout(1500);

    // STEP 8: Story content loads with text
    const storyText = page.locator('[data-testid="story-text"], .story-content, p');
    await expect(storyText.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Story content loads successfully');

    // STEP 9: Parent notices audio controls (auto-play or manual)
    const audioControls = page.locator('button[aria-label*="play"], button[aria-label*="audio"], button[aria-label*="pause"], audio');
    const hasAudio = await audioControls.count() > 0;
    expect(hasAudio).toBeTruthy();
    
    console.log('✓ Audio narration controls available');

    // STEP 10: Parent navigates through story pages
    const nextPageButton = page.locator('button:has-text("Next"), [aria-label*="next"]').first();
    const pageIndicator = page.locator('[data-testid="page-number"], .page-indicator');
    
    // Check for navigation controls
    const hasNextButton = await nextPageButton.isVisible().catch(() => false);
    const hasPageIndicator = await pageIndicator.isVisible().catch(() => false);
    
    expect(hasNextButton || hasPageIndicator).toBeTruthy();
    console.log('✓ Story navigation controls present');

    // Navigate through a few pages if possible
    if (hasNextButton) {
      for (let i = 0; i < 3; i++) {
        const buttonStillVisible = await nextPageButton.isVisible().catch(() => false);
        if (!buttonStillVisible) break;
        
        await nextPageButton.click();
        await page.waitForTimeout(1000);
        console.log(`✓ Parent advances to page ${i + 2}`);
      }
    }

    // STEP 11: Parent returns to story library
    const backButton = page.locator('button:has-text("Back"), [aria-label*="back"], a[href="/stories"]').first();
    const backVisible = await backButton.isVisible().catch(() => false);
    
    if (backVisible) {
      await backButton.click();
      await page.waitForTimeout(1000);
      console.log('✓ Parent returns to story library');
    }

    // STEP 12: Verify parent can see story library again
    await expect(storyCards.first()).toBeVisible({ timeout: 5000 });
    console.log('✓ User journey completed successfully');
  });

  test('Parent journey: onboarding skip → quick story preview', async ({ page }) => {
    // Alternative journey: Parent who wants to explore quickly
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Immediately skip onboarding
    await page.waitForTimeout(1500);
    const skipButton = page.locator('button:has-text("Skip"), button:has-text("Close")').first();
    
    if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipButton.click();
      console.log('✓ Impatient parent skips onboarding immediately');
    }

    await page.waitForTimeout(500);

    // Quick navigation to stories
    await page.goto('/stories');
    await page.waitForTimeout(1000);

    // Quick story preview
    const firstStory = page.locator('[data-testid="story-card"], .story-card').first();
    await expect(firstStory).toBeVisible({ timeout: 5000 });
    
    await firstStory.click();
    console.log('✓ Parent jumps directly to story reading');

    // Verify story loads
    const storyContent = page.locator('[data-testid="story-text"], .story-content, p');
    await expect(storyContent.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Quick exploration journey successful');
  });

  test('Parent journey: onboarding → explore UI → return to stories', async ({ page }) => {
    // Journey: Parent who explores multiple sections before settling on stories
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Complete onboarding quickly
    await page.waitForTimeout(1500);
    const skipButton = page.locator('button:has-text("Skip"), button:has-text("Close")').first();
    if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipButton.click();
    }

    await page.waitForTimeout(1000);

    // Explore different sections (curious parent behavior)
    const sections = ['/games', '/writing', '/stickers', '/stories'];
    
    for (const section of sections) {
      await page.goto(section);
      await page.waitForTimeout(800);
      console.log(`✓ Parent explores ${section}`);
    }

    // Settle on stories section
    await page.waitForTimeout(1000);
    const storyCard = page.locator('[data-testid="story-card"], .story-card').first();
    await expect(storyCard).toBeVisible({ timeout: 5000 });
    
    await storyCard.click();
    
    // Verify story loads for reading
    const storyText = page.locator('[data-testid="story-text"], .story-content, p');
    await expect(storyText.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Exploratory parent journey completed');
  });
});
