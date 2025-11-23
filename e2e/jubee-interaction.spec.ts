import { test, expect } from '@playwright/test';

test.describe('Jubee Mascot Interactions', () => {
  test('should show Jubee on page load', async ({ page }) => {
    await page.goto('/');
    
    const jubee = page.locator('[data-testid="jubee-mascot"]');
    await expect(jubee).toBeVisible({ timeout: 5000 });
  });

  test('should be draggable', async ({ page }) => {
    await page.goto('/');
    
    const jubee = page.locator('[data-testid="jubee-mascot"]');
    await jubee.waitFor({ state: 'visible' });
    
    // Get initial position
    const initialBox = await jubee.boundingBox();
    expect(initialBox).toBeTruthy();
    
    // Drag Jubee
    await jubee.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100);
    await page.mouse.up();
    
    // Position should have changed
    const newBox = await jubee.boundingBox();
    expect(newBox?.x).not.toBe(initialBox?.x);
  });

  test('should persist position across page navigation', async ({ page }) => {
    await page.goto('/');
    
    const jubee = page.locator('[data-testid="jubee-mascot"]');
    await jubee.waitFor({ state: 'visible' });
    
    // Get position on home page
    const homePosition = await jubee.boundingBox();
    
    // Navigate to shapes
    await page.goto('/shapes');
    await jubee.waitFor({ state: 'visible' });
    
    // Position should be similar (allowing for some variance)
    const shapesPosition = await jubee.boundingBox();
    expect(Math.abs(shapesPosition!.x - homePosition!.x)).toBeLessThan(50);
  });
});
