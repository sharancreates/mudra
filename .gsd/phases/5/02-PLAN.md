---
phase: 5
plan: 2
wave: 1
lead: "Person A (Frontend & UX Lead)"
depends_on: []
files_modified:
  - client/src/components/explorer/StockTable.tsx
  - client/src/components/mudra/MudraMenu.tsx
  - client/src/components/mudra/MudraHeader.tsx
  - client/src/components/mudra/MudraShell.tsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Market Explorer StockTable has zero 'Trade' action buttons and no Action table column"
    - "Clicking an instrument row or ticker in Market Explorer navigates cleanly to /stock/[symbol]"
    - "MudraMenu overlay has 0 references to 'Trade Stock' and maintains clean 4-item numbering (01 Home, 02 Explore Market, 03 Portfolio, 04 Leaderboard)"
    - "When signing out from anywhere (including /dashboard), the route redirects to home ('/') and session is purged"
  artifacts:
    - client/src/components/explorer/StockTable.tsx
    - client/src/components/mudra/MudraMenu.tsx
    - client/src/components/mudra/MudraHeader.tsx
---

# Plan 5.2: Navigation Clean-up & Sign-Out Redirection

<objective>
Streamline application navigation by eliminating clutter and establishing intuitive routing: remove trade action buttons and the Action column from Market Explorer (`StockTable.tsx`), remove the redundant "Trade Stock" link from the mobile hamburger menu (`MudraMenu.tsx`), and implement a complete Sign Out action that purges local/Supabase session state and redirects the user to home (`/`).
</objective>

<context>
Load for context:
- client/src/components/explorer/StockTable.tsx
- client/src/components/mudra/MudraMenu.tsx
- client/src/components/mudra/MudraHeader.tsx
- client/src/components/mudra/MudraShell.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove Trade Action Buttons and Action Column from Market Explorer</name>
  <files>
    client/src/components/explorer/StockTable.tsx
  </files>
  <action>
    1. In `client/src/components/explorer/StockTable.tsx`:
       - Remove `<th ...>Action</th>` column header from `<thead>`.
       - Remove the `<td ...>` containing the `<Link href="/stock/${stock.symbol}">Trade ...</Link>` button from each row in `<tbody>`.
       - Adjust table formatting so the remaining columns (`★`, `Instrument`, `Sector`, `EOD Close`, `Day Change`) span cleanly across the table width with optimal spacing.
       - Ensure clicking the stock symbol or instrument name continues to route smoothly to `/stock/${stock.symbol}`.
    AVOID: Breaking watchlist star toggle buttons or search filter reset buttons.
  </action>
  <verify>
    npm test
  </verify>
  <done>
    Market Explorer StockTable displays 0 'Trade' buttons and 0 'Action' column headers.
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove 'Trade Stock' from Hamburger Menu and Implement Sign Out with Redirect to Home</name>
  <files>
    client/src/components/mudra/MudraMenu.tsx
    client/src/components/mudra/MudraHeader.tsx
    client/src/components/mudra/MudraShell.tsx
  </files>
  <action>
    1. In `client/src/components/mudra/MudraMenu.tsx`:
       - Remove `{ num: "04", label: "Trade Stock", href: "/stock/RELIANCE", ... }` from `menuItems`.
       - Renumber remaining menu items:
         * 01: Home (`/`)
         * 02: Explore Market (`/explore`)
         * 03: Portfolio (`/dashboard`)
         * 04: Leaderboard (`/leaderboard`)
       - If `user` is authenticated, render user info and a dedicated "Sign Out" button in `MudraMenu`.
    2. In `client/src/components/mudra/MudraHeader.tsx`:
       - When `user` is authenticated, display user pseudonym alongside a distinct "Sign Out" button (or dropdown pill) next to "Portfolio".
    3. In `client/src/components/mudra/MudraShell.tsx`:
       - Implement `handleSignOut()`:
         * Remove `mudra_user` from `localStorage`.
         * Reset `user` state to `null`.
         * Call `supabase.auth.signOut()` if Supabase client is available.
         * Explicitly redirect the user to home (`/`) via `router.push('/')` (ensuring the route never stays on `/dashboard` or any protected path).
         * Pass `onSignOut` down to `MudraHeader` and `MudraMenu`.
  </action>
  <verify>
    npm test
  </verify>
  <done>
    MudraMenu has 0 'Trade Stock' links with 4 cleanly numbered items, and signing out removes user session and redirects to '/'.
  </done>
</task>

</tasks>

<must_haves>
After all tasks complete, verify:
- [ ] Market Explorer table has no "Action" column or "Trade" buttons.
- [ ] Hamburger menu does not contain "Trade Stock".
- [ ] Signing out on `/dashboard` routes immediately to `/`.
- [ ] Session in `localStorage` is cleared upon sign out.
</must_haves>

<success_criteria>
- [ ] All table rows in Market Explorer link to `/stock/[symbol]` without dedicated action buttons.
- [ ] Hamburger overlay menu contains exactly 4 navigation entries (01-04).
- [ ] Sign out button is accessible in both header and menu, directing to `/`.
- [ ] Node tests and Pytest suites pass 100%.
</success_criteria>
