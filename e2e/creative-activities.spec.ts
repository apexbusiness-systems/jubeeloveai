import { test, expect } from '@playwright/test';

test.describe('Creative Activities', () => {
  test.describe('Writing Canvas', () => {
    test('should load writing canvas', async ({ page }) => {
      await page.goto('/writing');
      
      // Check for canvas element
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible({ timeout: 5000 });
    });

    test('should allow drawing on canvas', async ({ page }) => {
      await page.goto('/writing');
      
      const canvas = page.locator('canvas');
      await canvas.waitFor({ state: 'visible' });
      
      // Get canvas bounding box
      const box = await canvas.boundingBox();
      expect(box).toBeTruthy();
      
      // Simulate drawing (mouse down, move, up)
      await page.mouse.move(box!.x + 50, box!.y + 50);
      await page.mouse.down();
      await page.mouse.move(box!.x + 150, box!.y + 100);
      await page.mouse.up();
      
      // Canvas should now have content (check if clear button appears)
      const clearButton = page.locator('button:has-text("Clear"), button:has-text("Reset")');
      await expect(clearButton.first()).toBeVisible();
    });

    test('should have color selection', async ({ page }) => {
      await page.goto('/writing');
      
      // Check for color picker or color buttons
      const colorControls = page.locator('[data-testid="color-picker"], button[data-color], input[type="color"]');
      await expect(colorControls.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Shape Sorter', () => {
    test('should load shape sorter activity', async ({ page }) => {
      await page.goto('/shapes');
      
      await expect(page.locator('body')).toContainText('Shapes', { ignoreCase: true });
      
      // Check for shape elements
      const shapes = page.locator('[data-testid="shape"], svg, canvas');
      await expect(shapes.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Gallery', () => {
    test('should access drawing gallery', async ({ page }) => {
      await page.goto('/gallery');
      
      await expect(page.locator('h1, h2')).toContainText('Gallery', { ignoreCase: true });
    });

    test('should show empty state or saved drawings', async ({ page }) => {
      await page.goto('/gallery');
      
      // Either shows saved drawings or an empty state message
      const hasDrawings = await page.locator('[data-testid="drawing-card"], .drawing-item').count() > 0;
      const hasEmptyState = await page.locator(':text("No drawings"), :text("empty")').count() > 0;
      
      expect(hasDrawings || hasEmptyState).toBeTruthy();
    });
  });
});
