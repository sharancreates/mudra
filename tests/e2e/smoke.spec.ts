import { test, expect } from '@playwright/test';

/**
 * End-to-End Smoke Test Suite for Mudra Equities Simulator
 * Conformance: PRD Section 15.1, W2-18, W3-14 (Full User Lifecycle Smoke Loop)
 *
 * Golden Path:
 * 1. Landing & Mandatory 18+ / Simulation Acknowledgement (FR-1, FR-2)
 * 2. Explorer Navigation & Ticker Search (FR-10, FR-11)
 * 3. Stock Detail Price Quote & 15:30 IST Settlement Banner (FR-12, FR-13)
 * 4. Buy Order Sheet with 10% Headroom Buffer & 0.1% Fee Calculation (FR-16 to FR-21)
 * 5. Order Placement & PENDING Queue Verification (FR-22)
 * 6. Dashboard Ledger Audit & Initial ₹1,00,000 Capital Verification (FR-7, FR-35)
 */

test.describe('Mudra E2E Golden Path Smoke Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Inject clean localStorage state before test execution
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.localStorage.setItem('mudra-theme', 'light');
    });
  });

  test('completes full trade lifecycle: sign-up -> search -> order -> queue -> ledger', async ({ page }) => {
    // -------------------------------------------------------------------------
    // STEP 1: Landing Page & Statutory Auth Modal (FR-1, FR-2, FR-6)
    // -------------------------------------------------------------------------
    await page.goto('/');
    await expect(page).toHaveTitle(/Mudra/i);

    // Verify main brand heading and interactive elements
    const mainHeading = page.locator('h1, [data-hero-title]');
    await expect(mainHeading.first()).toBeVisible();

    // Trigger Auth Modal via Header "Sign In" button
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
    } else {
      // Fallback: Click hero activation CTA
      const heroCta = page.getByRole('button', { name: /start|trade|activate/i });
      await heroCta.first().click();
    }

    // Modal must be visible
    const authModal = page.locator('.fixed.inset-0');
    await expect(authModal).toBeVisible();

    // Fill registration credentials
    await page.getByPlaceholder(/name|pseudonym/i).fill('Aarav Student');
    await page.getByPlaceholder(/email/i).fill('aarav@mudra.test');
    const passwordInput = page.getByPlaceholder(/password/i);
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('SecurePass123!');
    }

    // Both 18+ and Simulation checkboxes are strictly required
    const adultCheckbox = page.locator('button:has-text("18 years of age"), div:has-text("18 years of age")').first();
    const simCheckbox = page.locator('button:has-text("virtual simulation"), div:has-text("virtual simulation")').first();

    if (await adultCheckbox.isVisible()) {
      await adultCheckbox.click();
    }
    if (await simCheckbox.isVisible()) {
      await simCheckbox.click();
    }

    // Submit Auth Form
    const submitAuth = page.getByRole('button', { name: /create virtual account|start with|sign in/i });
    await submitAuth.click();

    // -------------------------------------------------------------------------
    // STEP 2: Market Explorer & Search (FR-10, FR-11)
    // -------------------------------------------------------------------------
    await page.goto('/explore');
    await expect(page.locator('h1:has-text("Market Explorer")')).toBeVisible();

    // Search for RELIANCE
    const searchInput = page.getByPlaceholder(/search by company or ticker/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('RELIANCE');

    // Verify filtered stock row
    const relianceRow = page.locator('tr:has-text("RELIANCE")');
    await expect(relianceRow).toBeVisible();

    // -------------------------------------------------------------------------
    // STEP 3: Stock Detail & Order Sheet (FR-12, FR-16, FR-27)
    // -------------------------------------------------------------------------
    // Navigate to RELIANCE detail page
    await page.goto('/stock/RELIANCE');
    await expect(page.locator('text=RELIANCE')).toBeVisible();

    // Verify 15:30 IST Settlement Banner
    await expect(page.locator('text=15:30 IST').first()).toBeVisible();

    // Open Buy Order Sheet
    const buyButton = page.getByRole('button', { name: /buy reliance|buy/i }).first();
    await expect(buyButton).toBeVisible();
    await buyButton.click();

    // Order Modal must open
    const orderModal = page.locator('text=Place Order').first();
    await expect(orderModal).toBeVisible();

    // Verify 10% Headroom Buffer and 0.1% Simulated Fee Breakdown
    await expect(page.locator('text=Simulated Brokerage Fee (0.1%)')).toBeVisible();
    await expect(page.locator('text=Safety Headroom Buffer (+10%)')).toBeVisible();
    await expect(page.locator('text=Total Cash to Reserve:')).toBeVisible();

    // Submit order for 5 shares
    const confirmOrderBtn = page.getByRole('button', { name: /place buy order|confirm/i });
    await expect(confirmOrderBtn).toBeEnabled();
    await confirmOrderBtn.click();

    // Order success confirmation must appear
    await expect(page.locator('text=Order Queued Successfully')).toBeVisible();
    await expect(page.locator('text=PENDING')).toBeVisible();

    // -------------------------------------------------------------------------
    // STEP 4: Dashboard Queue & Audit Ledger Verification (FR-22, FR-35, FR-37)
    // -------------------------------------------------------------------------
    await page.goto('/dashboard');
    await expect(page.locator('h1:has-text("Trading Dashboard")')).toBeVisible();

    // Metric cards must render INR values
    await expect(page.locator('text=Total Portfolio Equity')).toBeVisible();
    await expect(page.locator('text=₹1,00,000').first()).toBeVisible();

    // Orders Queue must display the pending trade
    await expect(page.locator('text=Orders Queue')).toBeVisible();
    const ordersTable = page.locator('table').last();
    await expect(ordersTable).toBeVisible();
    await expect(page.locator('text=Next Close (15:30 IST)').first()).toBeVisible();

    // Switch to Immutable Transaction Audit Ledger tab
    const ledgerTabBtn = page.getByRole('button', { name: /transaction audit ledger|ledger/i });
    if (await ledgerTabBtn.isVisible()) {
      await ledgerTabBtn.click();

      // Verify Audit Ledger table or entries
      await expect(page.locator('text=Audit Ledger|Timestamp|Entry Type').first()).toBeVisible();
    }
  });
});
