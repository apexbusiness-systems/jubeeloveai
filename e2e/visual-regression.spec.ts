import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * 
 * These tests capture screenshots for visual comparison to detect
 * unintended UI changes across deployments.
 */

test.describe('Visual Regression Tests', () => {
  test.describe('Core Pages', () => {
    test('Home page visual snapshot', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Close onboarding if present
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('home-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05, // Allow 5% pixel difference
      });
    });

    test('Games menu visual snapshot', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');
      
      // Close onboarding if present
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('games-menu.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });

    test('Stories page visual snapshot', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('stories-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });

    test('Settings page visual snapshot', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('settings-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });

    test('Gallery page visual snapshot', async ({ page }) => {
      await page.goto('/gallery');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('gallery-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });
  });

  test.describe('Component Snapshots', () => {
    test('Navigation bar visual snapshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      // Capture just the navigation
      const nav = page.locator('nav');
      await expect(nav).toHaveScreenshot('navigation-bar.png', {
        maxDiffPixelRatio: 0.05,
      });
    });

    test('Header visual snapshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      const header = page.locator('header');
      await expect(header).toHaveScreenshot('header.png', {
        maxDiffPixelRatio: 0.05,
      });
    });

    test('Onboarding modal visual snapshot', async ({ page }) => {
      // Clear localStorage to trigger onboarding
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Wait for onboarding modal
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(modal).toHaveScreenshot('onboarding-modal.png', {
          maxDiffPixelRatio: 0.05,
        });
      }
    });
  });

  test.describe('Responsive Visual Tests', () => {
    test('Mobile viewport snapshot', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('home-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });

    test('Tablet viewport snapshot', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('home-tablet.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });
  });

  test.describe('Dark Mode Visual Tests', () => {
    test('Home page dark mode snapshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('home-dark-mode.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });
  });
});
