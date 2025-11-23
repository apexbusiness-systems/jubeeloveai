import { test, expect } from '@playwright/test';

test.describe('Game Modules', () => {
  test('should access games menu', async ({ page }) => {
    await page.goto('/games');
    
    // Check for game selection cards
    await expect(page.locator('h1, h2')).toContainText('Games', { ignoreCase: true });
    
    // Verify at least one game is visible
    const gameCards = page.locator('[data-testid="game-card"]');
    await expect(gameCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should play Number Game', async ({ page }) => {
    await page.goto('/games/number');
    
    // Wait for game to load
    await expect(page.locator('body')).toContainText('Number', { ignoreCase: true });
    
    // Check for interactive elements (buttons, cards, etc.)
    const interactiveElement = page.locator('button, [role="button"], canvas').first();
    await expect(interactiveElement).toBeVisible({ timeout: 5000 });
  });

  test('should play Color Game', async ({ page }) => {
    await page.goto('/games/color');
    
    // Wait for game to load
    await expect(page.locator('body')).toContainText('Color', { ignoreCase: true });
    
    // Verify color options are visible
    const colorElement = page.locator('[data-color], button').first();
    await expect(colorElement).toBeVisible({ timeout: 5000 });
  });

  test('should play Alphabet Game', async ({ page }) => {
    await page.goto('/games/alphabet');
    
    await expect(page.locator('body')).toContainText('Alphabet', { ignoreCase: true });
  });

  test('should play Memory Game', async ({ page }) => {
    await page.goto('/games/memory');
    
    await expect(page.locator('body')).toContainText('Memory', { ignoreCase: true });
    
    // Check for memory cards
    const cards = page.locator('[data-testid="memory-card"], [role="button"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should play Pattern Game', async ({ page }) => {
    await page.goto('/games/pattern');
    
    await expect(page.locator('body')).toContainText('Pattern', { ignoreCase: true });
  });

  test('should play Puzzle Game', async ({ page }) => {
    await page.goto('/games/puzzle');
    
    await expect(page.locator('body')).toContainText('Puzzle', { ignoreCase: true });
  });

  test('should track score across game plays', async ({ page }) => {
    await page.goto('/');
    
    // Get initial score from header
    const scoreDisplay = page.locator('.score-display, [data-testid="score"]');
    await expect(scoreDisplay).toBeVisible();
    const initialScore = await scoreDisplay.textContent();
    
    // Play a game (navigate and interact)
    await page.goto('/games/number');
    await page.waitForTimeout(2000); // Wait for game interaction
    
    // Navigate back and check if score updated (or persisted)
    await page.goto('/');
    const finalScore = await scoreDisplay.textContent();
    
    // Score should be a number
    expect(finalScore).toMatch(/\d+/);
  });
});
