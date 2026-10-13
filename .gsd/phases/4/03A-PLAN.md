---
phase: 4
plan: "3A"
wave: 1
lead: "Person A (Frontend & UX Lead)"
collaborator: "Person B (Backend & Data Lead)"
depends_on: ["4.2A"]
---

# Plan 4.3A: Playwright End-to-End Suite & Multi-Device Mobile QA Verification

## Objective
Fulfill Person A's remaining checklist deliverables from the StockSim India Weekly Deliverables Checklist:
1. **W2-18 / W3-14 (Playwright E2E Suite):** Automated headless browser smoke flow verifying the golden path:
   - Sign-up with mandatory 18+ and simulation checkboxes (FR-1, FR-2).
   - Search & select stock on Explorer.
   - Place a market order on Stock Detail with 10% headroom calculation and 0.1% fee breakdown.
   - Verify order in Dashboard Orders Queue (`PENDING` at 15:30 IST).
   - Audit initial capital and transaction records in Dashboard Audit Ledger.
2. **W3-11 (Multi-Device Mobile QA):** Automated viewport assertion checks across 360px, 390px, and 768px viewports on all 6 core routes (`/`, `/explore`, `/stock/RELIANCE`, `/dashboard`, `/leaderboard`, `/terms`), enforcing zero horizontal overflow (`scrollWidth <= clientWidth`) and >= 44px touch targets.

## Context
- [`.gsd/SPEC.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/SPEC.md) (Section 15.1: Launch Readiness Checklist)
- [`.gsd/ROADMAP.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/ROADMAP.md) (Phase 4)
- [`.gsd/DECISIONS.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/DECISIONS.md) (ADR-013)
- [`client/src/app/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/page.tsx)
- [`client/src/components/auth/AuthModal.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/auth/AuthModal.tsx)
- [`client/src/app/explore/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/explore/page.tsx)
- [`client/src/app/stock/[symbol]/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/stock/%5Bsymbol%5D/page.tsx)
- [`client/src/app/dashboard/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/dashboard/page.tsx)
- [`client/src/app/leaderboard/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/leaderboard/page.tsx)
- [`client/src/app/terms/page.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/terms/page.tsx)

---

## Tasks

<task type="auto">
  <name>Author Playwright E2E Smoke Test Suite</name>
  <files>tests/e2e/smoke.spec.ts, playwright.config.ts, package.json</files>
  <action>
    - Create `playwright.config.ts` configured for local Next.js client testing with headless Chromium.
    - Create `tests/e2e/smoke.spec.ts` covering the complete user trade lifecycle:
      1. Land on `/` -> click "Start Paper Trading" / open AuthModal.
      2. Verify both 18+ and simulation checkboxes are required (FR-1, FR-2); click checkboxes and submit.
      3. Navigate to `/explore` -> search for "RELIANCE" -> verify filtered results -> click into `/stock/RELIANCE`.
      4. On `/stock/RELIANCE`, open Buy Order Sheet -> enter quantity (10) -> verify estimated total includes 10% headroom buffer and 0.1% simulated fee -> submit order.
      5. Navigate to `/dashboard` -> verify order appears in "Orders Queue" with status "PENDING" and target session "15:30 IST".
      6. Switch to "Audit Ledger" tab -> verify initial capital allocation of ₹1,00,000.00 (10,000,000 paise).
    - Add `"test:e2e": "playwright test tests/e2e/smoke.spec.ts"` to `package.json`.
  </action>
  <verify>npx playwright test tests/e2e/smoke.spec.ts --list</verify>
  <done>Playwright configuration and smoke test specifications defined and syntactically validated.</done>
</task>

<task type="auto">
  <name>Author Multi-Device Mobile Viewport QA Assertion Suite</name>
  <files>tests/e2e/mobile_qa.spec.ts</files>
  <action>
    - Create `tests/e2e/mobile_qa.spec.ts` testing 3 physical viewports:
      * Small Android Phone: 360 × 640 px
      * Standard iPhone: 390 × 844 px
      * Tablet Portrait: 768 × 1024 px
    - For each viewport, load all 6 core application routes:
      * `/` (Landing Page)
      * `/explore` (50 Stocks Directory)
      * `/stock/RELIANCE` (Stock Detail)
      * `/dashboard` (Portfolio Dashboard)
      * `/leaderboard` (Trader Leaderboard)
      * `/terms` (Terms & Disclaimers)
    - Assert that `document.documentElement.scrollWidth <= window.innerWidth` (strictly 0 horizontal overflow).
    - Assert that key interactive buttons meet the accessibility minimum touch target height of 44px.
    - Assert that the mobile sticky bottom bar on `/stock/RELIANCE` is visible and positioned within viewport bounds.
  </action>
  <verify>npx playwright test tests/e2e/mobile_qa.spec.ts --list</verify>
  <done>Automated multi-device viewport test suite verified and ready for CI execution.</done>
</task>

---

## Success Criteria
- [ ] `playwright.config.ts` and E2E test files authored with TypeScript typings.
- [ ] Golden-path smoke flow (Sign-up → Explore → Order Placement → Orders Queue → Ledger) defined and verified.
- [ ] Automated multi-viewport test asserts 0 horizontal overflow at 360px, 390px, and 768px across all 6 core routes.
- [ ] `package.json` contains runnable `test:e2e` scripts.
