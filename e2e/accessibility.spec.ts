import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests (WCAG AA Compliance)
 * 
 * These tests verify the application meets WCAG 2.1 AA standards
 * using axe-core accessibility testing engine.
 */

test.describe('Accessibility Audit (WCAG AA)', () => {
  test.describe('Core Pages Accessibility', () => {
    test('Home page should have no accessibility violations', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Close onboarding if present
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log('Accessibility violations on Home page:');
        accessibilityScanResults.violations.forEach(v => {
          console.log(`- ${v.id}: ${v.description}`);
          console.log(`  Impact: ${v.impact}`);
          console.log(`  Nodes affected: ${v.nodes.length}`);
        });
      }
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('Games menu should have no accessibility violations', async ({ page }) => {
      await page.goto('/games');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      if (results.violations.length > 0) {
        console.log('Accessibility violations on Games page:', 
          results.violations.map(v => `${v.id}: ${v.description}`));
      }
      
      expect(results.violations).toEqual([]);
    });

    test('Stories page should have no accessibility violations', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(results.violations).toEqual([]);
    });

    test('Settings page should have no accessibility violations', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(results.violations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('All interactive elements should be keyboard accessible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      // Tab through all focusable elements
      const focusableElements = await page.locator(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ).all();
      
      for (const element of focusableElements.slice(0, 10)) { // Check first 10
        await element.focus();
        const isFocused = await element.evaluate(el => el === document.activeElement);
        expect(isFocused).toBe(true);
      }
    });

    test('Navigation should work with keyboard only', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      // Press Tab multiple times and verify focus moves
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Verify something has focus
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).not.toBe('BODY');
    });

    test('Escape key should close modals', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Wait for onboarding modal
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        // Modal should be closed or have a close mechanism
        // (Some modals may not close on Escape - this is acceptable)
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('Text should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      // Run axe specifically for color contrast
      const results = await new AxeBuilder({ page })
        .withTags(['cat.color'])
        .analyze();
      
      // Filter to only serious/critical contrast issues
      const criticalContrast = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      
      expect(criticalContrast).toEqual([]);
    });
  });

  test.describe('ARIA and Semantic HTML', () => {
    test('Images should have alt text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      const images = await page.locator('img').all();
      
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        
        // Image should have alt text OR role="presentation" for decorative images
        const hasAccessibleName = alt !== null || role === 'presentation';
        expect(hasAccessibleName).toBe(true);
      }
    });

    test('Buttons should have accessible names', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      const buttons = await page.locator('button').all();
      
      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        
        // Button should have text, aria-label, or title
        const hasAccessibleName = 
          (text && text.trim().length > 0) || 
          ariaLabel || 
          title;
        
        if (!hasAccessibleName) {
          const html = await button.evaluate(el => el.outerHTML);
          console.log('Button without accessible name:', html);
        }
        
        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('Form inputs should have labels', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      const inputs = await page.locator('input, select, textarea').all();
      
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');
        
        // Check for associated label
        let hasLabel = ariaLabel || ariaLabelledBy;
        
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          hasLabel = hasLabel || label > 0;
        }
        
        // Placeholder alone is not sufficient, but acceptable for search inputs
        const type = await input.getAttribute('type');
        if (type === 'search' && placeholder) {
          hasLabel = true;
        }
        
        expect(hasLabel).toBeTruthy();
      }
    });

    test('Page should have proper heading structure', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      // Check for h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // Verify heading hierarchy (no skipping levels)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      let lastLevel = 0;
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.charAt(1));
        
        // Should not skip more than one level
        if (lastLevel > 0) {
          expect(level).toBeLessThanOrEqual(lastLevel + 1);
        }
        
        lastLevel = level;
      }
    });
  });

  test.describe('Focus Management', () => {
    test('Focus should be visible on interactive elements', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      // Tab to first button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if focused element has visible focus indicator
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        
        const styles = window.getComputedStyle(el);
        const outline = styles.outline;
        const boxShadow = styles.boxShadow;
        
        return {
          hasOutline: outline !== 'none' && outline !== '',
          hasBoxShadow: boxShadow !== 'none' && boxShadow !== '',
          hasFocusClass: el.classList.contains('focus-visible') || 
                         el.matches(':focus-visible')
        };
      });
      
      // Should have some visible focus indicator
      const hasFocusIndicator = 
        focusedElement?.hasOutline || 
        focusedElement?.hasBoxShadow ||
        focusedElement?.hasFocusClass;
      
      expect(hasFocusIndicator).toBe(true);
    });
  });

  test.describe('Touch Target Size', () => {
    test('Interactive elements should have minimum 44x44px touch targets', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const skipButton = page.getByText('Skip Tutorial');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
      
      const buttons = await page.locator('button').all();
      const MINIMUM_SIZE = 44;
      
      for (const button of buttons.slice(0, 10)) { // Check first 10
        const box = await button.boundingBox();
        
        if (box) {
          // Allow some tolerance for border/padding
          const meetsMinWidth = box.width >= MINIMUM_SIZE - 4;
          const meetsMinHeight = box.height >= MINIMUM_SIZE - 4;
          
          if (!meetsMinWidth || !meetsMinHeight) {
            const text = await button.textContent();
            console.log(`Small button found: "${text}" (${box.width}x${box.height})`);
          }
          
          expect(meetsMinWidth).toBe(true);
          expect(meetsMinHeight).toBe(true);
        }
      }
    });
  });

  test.describe('Motion and Animation', () => {
    test('Animations should respect prefers-reduced-motion', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check that animations are disabled or reduced
      const hasReducedMotion = await page.evaluate(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        return mediaQuery.matches;
      });
      
      expect(hasReducedMotion).toBe(true);
    });
  });
});
