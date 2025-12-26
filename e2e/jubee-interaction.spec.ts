import { test, expect } from '@playwright/test';

test.describe('Jubee Mascot Interactions', () => {
  test('should show Jubee on page load', async ({ page }) => {
    await page.goto('/');
    
    const jubee = page.locator('[data-testid="jubee-mascot"]');
    await expect(jubee).toBeVisible({ timeout: 5000 });
  });

  test('should be draggable on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    
    const jubee = page.locator('[data-jubee-container="true"]');
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
    expect(newBox?.y).not.toBe(initialBox?.y);
  });

  test('should stay within bounds when dragged on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    
    const jubee = page.locator('[data-jubee-container="true"]');
    await jubee.waitFor({ state: 'visible' });
    
    // Try to drag Jubee off-screen to the right
    const initialBox = await jubee.boundingBox();
    expect(initialBox).toBeTruthy();
    
    // Attempt to drag beyond viewport
    await jubee.hover();
    await page.mouse.down();
    await page.mouse.move(500, initialBox!.y); // Beyond viewport width
    await page.mouse.up();
    
    // Jubee should be clamped within viewport
    const newBox = await jubee.boundingBox();
    expect(newBox).toBeTruthy();
    expect(newBox!.x + newBox!.width).toBeLessThanOrEqual(390); // Within viewport width
  });

  test('should stay within bounds when dragged on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    const jubee = page.locator('[data-jubee-container="true"]');
    await jubee.waitFor({ state: 'visible' });
    
    // Try to drag Jubee off-screen to the top
    const initialBox = await jubee.boundingBox();
    expect(initialBox).toBeTruthy();
    
    // Attempt to drag beyond viewport top
    await jubee.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x, -100); // Beyond viewport top
    await page.mouse.up();
    
    // Jubee should be clamped within viewport
    const newBox = await jubee.boundingBox();
    expect(newBox).toBeTruthy();
    expect(newBox!.y).toBeGreaterThanOrEqual(0); // Within viewport height
  });

  test('should maintain responsive dimensions across viewport changes', async ({ page }) => {
    await page.goto('/');
    
    const jubee = page.locator('[data-jubee-container="true"]');
    await jubee.waitFor({ state: 'visible' });
    
    // Desktop: 256x288
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(100);
    let box = await jubee.boundingBox();
    expect(box?.width).toBe(256);
    expect(box?.height).toBe(288);
    
    // Tablet: 208x240
    await page.setViewportSize({ width: 800, height: 1024 });
    await page.waitForTimeout(100);
    box = await jubee.boundingBox();
    expect(box?.width).toBe(208);
    expect(box?.height).toBe(240);
    
    // Mobile: 160x192
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    box = await jubee.boundingBox();
    expect(box?.width).toBe(160);
    expect(box?.height).toBe(192);
  });

  test('should persist position across page navigation', async ({ page }) => {
    await page.goto('/');
    
    const jubee = page.locator('[data-jubee-container="true"]');
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
