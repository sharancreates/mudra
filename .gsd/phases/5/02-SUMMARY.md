# Phase 5 Plan 5.2 Summary: Navigation Clean-up & Sign-Out Redirection

## Overview
**Lead:** Person A (Frontend & UX Lead)  
**Collaborator:** Person B (Backend & Data Lead)  
**Status:** Completed  
**Execution Date:** 2026-10-15  

Plan 5.2 addressed user experience and routing friction across application navigation:
1. Eliminated the redundant "Trade" action buttons and the "Action" column header from Market Explorer (`StockTable.tsx`), allowing clean direct row and ticker navigation to stock details.
2. Removed "Trade Stock" from the mobile hamburger menu (`MudraMenu.tsx`), establishing a focused 4-item core menu (01 Home, 02 Explore Market, 03 Portfolio, 04 Leaderboard).
3. Resolved the sign-out route bug: signing out now completely purges both local and Supabase session state and explicitly redirects the user directly to home (`/`) instead of remaining on `/dashboard`.

---

## Deliverables Completed

### 1. Market Explorer Clean-up (`client/src/components/explorer/StockTable.tsx`)
- Removed `<th ...>Action</th>` column header from `<thead>`.
- Removed `<td ...>` containing the "Trade" action link from every table row in `<tbody>`.
- Preserved row clickability routing cleanly to `/stock/${stock.symbol}`.
- Verified watchlist star toggling and search reset functionality remain intact.

### 2. Hamburger Navigation Refactoring (`client/src/components/mudra/MudraMenu.tsx`)
- Removed `{ num: "04", label: "Trade Stock", href: "/stock/RELIANCE", ... }`.
- Restructured navigation list to 4 essential entries:
  - `01`: Home (`/`)
  - `02`: Explore Market (`/explore`)
  - `03`: Portfolio (`/dashboard`)
  - `04`: Leaderboard (`/leaderboard`)
- Added authenticated user status card in the menu with trader pseudonym and dedicated "Sign Out" button.
- Added "Sign In to Mudra" trigger for unauthenticated visitors.

### 3. Header Sign-Out & Session Redirection (`MudraHeader.tsx` & `MudraShell.tsx`)
- Updated `MudraHeader.tsx`:
  - When authenticated, renders "Portfolio" pill alongside a clean "Sign Out" button with subtle border and hover effects.
- Implemented `handleSignOut()` in `MudraShell.tsx`:
  - Purges `mudra_user` key from `localStorage`.
  - Resets `user` state to `null`.
  - Calls `supabase.auth.signOut()` if Supabase client is active.
  - Redirects immediately to home (`/`) via Next.js `router.push('/')`.
  - Passed `onSignOut` callback to both `MudraHeader` and `MudraMenu`.

---

## Test Verification
- **Node.js Test Runner**: 55/55 passed in 354ms (100%)
- **Section 15.1 Launch Audit**: 5/5 pillars [OK] (PASSED)
- **Pytest Test Suite**: 52/52 passed (100%)

---

## Git Commit Manifest
- `e7a9882`: `feat(5-2): remove trade action buttons and action column from market explorer`
- `a8b423a`: `feat(5-2): remove trade stock from hamburger menu and add sign out with redirect to home`
