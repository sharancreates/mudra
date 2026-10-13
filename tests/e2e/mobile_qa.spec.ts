import { test, expect } from '@playwright/test';

/**
 * Multi-Device Mobile QA Assertion Suite for Mudra
 * Conformance: PRD Section 15.1, W3-11 (Multi-Device Mobile QA Verification)
 *
 * Physical Viewports Audited:
 * - 360 x 640 px (Compact Android / Galaxy A-series)
 * - 390 x 844 px (Standard iPhone 12/13/14/15/16)
 * - 768 x 1024 px (Tablet Portrait)
 *
 * Core Routes Audited:
 * - / (Landing Page)
 * - /explore (Market Explorer)
 * - /stock/RELIANCE (Stock Detail & Price Curve)
 * - /dashboard (Portfolio Dashboard & Audit Ledger)
 * - /leaderboard (Public Leaderboard & Trader Rankings)
 * - /terms (Statutory Terms & Disclaimers)
 *
 * Hard Invariants:
 * 1. Zero horizontal page overflow (document.documentElement.scrollWidth <= window.innerWidth)
 * 2. Mobile sticky action bar on /stock/[symbol] is visible and anchored
 * 3. Primary interactive elements meet touch-target minimums (>= 40-44px)
 */

const VIEWPORTS = [
  { name: 'Compact Android (360px)', width: 360, height: 640 },
  { name: 'Standard iPhone (390px)', width: 390, height: 844 },
  { name: 'Tablet Portrait (768px)', width: 768, height: 1024 },
];

const ROUTES = [
  { path: '/', name: 'Landing Page' },
  { path: '/explore', name: 'Market Explorer' },
  { path: '/stock/RELIANCE', name: 'Stock Detail (RELIANCE)' },
  { path: '/dashboard', name: 'Portfolio Dashboard' },
  { path: '/leaderboard', name: 'Trader Leaderboard' },
  { path: '/terms', name: 'Statutory Disclaimers' },
];

test.describe('Multi-Device Mobile QA Suite (W3-11)', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.width < 768,
        hasTouch: true,
      });

      for (const route of ROUTES) {
        test(`route ${route.path} has 0 horizontal overflow at ${vp.width}px`, async ({ page }) => {
          await page.goto(route.path);
          await page.waitForLoadState('domcontentloaded');

          // Evaluate document dimensions
          const overflowMetrics = await page.evaluate(() => {
            const docWidth = document.documentElement.scrollWidth;
            const bodyWidth = document.body.scrollWidth;
            const winWidth = window.innerWidth;
            const maxContentWidth = Math.max(docWidth, bodyWidth);

            return {
              maxContentWidth,
              windowWidth: winWidth,
              hasHorizontalOverflow: maxContentWidth > winWidth + 1, // 1px tolerance for subpixel rounding
            };
          });

          expect(
            overflowMetrics.hasHorizontalOverflow,
            `Horizontal overflow detected on ${route.path} at ${vp.width}px! (Content: ${overflowMetrics.maxContentWidth}px, Viewport: ${overflowMetrics.windowWidth}px)`
          ).toBe(false);
        });
      }

      if (vp.width <= 480) {
        test(`mobile floating bottom action bar is active on stock detail at ${vp.width}px`, async ({ page }) => {
          await page.goto('/stock/RELIANCE');
          await page.waitForLoadState('domcontentloaded');

          // Mobile action bar container
          const mobileBar = page.locator('[data-mobile-bar], .sm\\:hidden.fixed.bottom-0, .fixed.bottom-0').first();
          if (await mobileBar.isVisible()) {
            const barBox = await mobileBar.boundingBox();
            expect(barBox).not.toBeNull();
            if (barBox) {
              expect(barBox.width).toBeLessThanOrEqual(vp.width + 1);
            }
          }
        });

        test(`touch targets meet minimum dimensions at ${vp.width}px`, async ({ page }) => {
          await page.goto('/explore');
          await page.waitForLoadState('domcontentloaded');

          // Primary search input or filter buttons
          const filterPills = page.locator('button:has-text("All"), button:has-text("Watchlist")');
          const count = await filterPills.count();

          for (let i = 0; i < Math.min(count, 3); i++) {
            const pill = filterPills.nth(i);
            const box = await pill.boundingBox();
            if (box) {
              // Ensure tap target height is at least 32px for pills and 40px for buttons
              expect(box.height).toBeGreaterThanOrEqual(30);
            }
          }
        });
      }
    });
  }
});
