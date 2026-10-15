---
phase: 5
plan: 3
wave: 2
lead: "Person B & Person A"
depends_on: ["5.1", "5.2"]
files_modified:
  - client/src/app/leaderboard/page.tsx
  - tests/trading/auth_navigation.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Leaderboard page (/leaderboard) is strictly gated to authenticated users: unauthenticated visitors see a locked auth gate with a direct Sign In CTA"
    - "Rankings table, Top 3 podium, and standing card are not visible to logged-out users"
    - "Automated test suite tests/trading/auth_navigation.test.ts comprehensively verifies all 7 user requirements"
    - "100% test pass parity is maintained across npm test (Node.js) and pytest server/tests/ (FastAPI)"
  artifacts:
    - client/src/app/leaderboard/page.tsx
    - tests/trading/auth_navigation.test.ts
---

# Plan 5.3: Protected Routes & Auth-Gated Leaderboard Verification

<objective>
Enforce authentication gating on `/leaderboard` so rankings are exclusively accessible to logged-in users (displaying an elegant locked gate with a Sign In trigger for visitors), author an automated test suite verifying all 7 user requirements, and ensure zero regressions across all frontend and backend test suites.
</objective>

<context>
Load for context:
- client/src/app/leaderboard/page.tsx
- client/src/components/auth/AuthModal.tsx
- client/src/components/explorer/StockTable.tsx
- client/src/components/mudra/MudraMenu.tsx
- client/src/components/mudra/MudraHeader.tsx
- tests/trading/launch_audit.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement Leaderboard Authentication Gate</name>
  <files>
    client/src/app/leaderboard/page.tsx
  </files>
  <action>
    1. In `client/src/app/leaderboard/page.tsx`:
       - Inspect user session state (`user` from `localStorage` or Supabase session).
       - When `user === null` (unauthenticated):
         * Do NOT render the Top 3 podium, leaderboard rankings table, or personal standing card.
         * Render a locked state banner with:
           - A padlock / shield icon in `var(--mudra-signal-yellow)`.
           - Heading: "Leaderboard Access Restricted".
           - Explanation: "Verified trader rankings and institutional performance standing are exclusive to registered Mudra accounts. Sign in or register to join the competition."
           - Action button: "Sign In / Join Sandbox" that triggers `AuthModal` (or routes to sign-in).
       - When `user` is authenticated:
         * Render full verified leaderboard, podium cards, timeframe toggles, and personal standing as normal.
    AVOID: FOUC (flash of unauthenticated content) while hydrating localStorage on initial client render.
  </action>
  <verify>
    npm test
  </verify>
  <done>
    Unauthenticated users see a locked authentication card on /leaderboard without exposed ranking data; logged-in users see full rankings.
  </done>
</task>

<task type="auto">
  <name>Task 2: Author Auth & Navigation Automated Test Suite</name>
  <files>
    tests/trading/auth_navigation.test.ts
  </files>
  <action>
    1. Author `tests/trading/auth_navigation.test.ts` asserting:
       - **Req 1 (Sign-Out Redirection)**: Verifies `MudraShell` and header/menu provide sign-out functionality that purges session and redirects to `/`.
       - **Req 2 (No Trade Buttons in Explorer)**: Scans `client/src/components/explorer/StockTable.tsx` and asserts 0 "Trade" button tags or Action column headers.
       - **Req 3 (Gated Leaderboard)**: Scans `client/src/app/leaderboard/page.tsx` and verifies authentication check guards leaderboard data.
       - **Req 4 (No Trade Stock in Hamburger Menu)**: Scans `client/src/components/mudra/MudraMenu.tsx` and confirms "Trade Stock" is absent and items are numbered 01-04.
       - **Req 5 (Email, Password, Pseudonym Required)**: Scans `client/src/components/auth/AuthModal.tsx` and verifies presence of email, password, and pseudonym inputs and validations.
       - **Req 6 (Google OAuth Integration)**: Scans `client/src/components/auth/AuthModal.tsx` and verifies Google OAuth integration via Supabase.
       - **Req 7 (Post Sign-in Landing on Dashboard)**: Confirms auth success invokes router navigation to `/dashboard`.
    2. Run full regression suites:
       - `npm test` (all TypeScript/Node tests)
       - `python -m pytest server/tests/` (FastAPI backend tests)
       - `python server/app/scripts/launch_audit.py` (pre-launch audit)
  </action>
  <verify>
    npm test && python -m pytest server/tests/
  </verify>
  <done>
    All 7 requirements are covered by automated assertions with 100% test pass rate across Node and Pytest.
  </done>
</task>

</tasks>

<must_haves>
After all tasks complete, verify:
- [ ] Unauthenticated users are blocked from viewing leaderboard rankings.
- [ ] `tests/trading/auth_navigation.test.ts` passes with 0 failures.
- [ ] Full regression suite passes without broken tests.
</must_haves>

<success_criteria>
- [ ] `/leaderboard` renders auth gate for logged-out visitors.
- [ ] `tests/trading/auth_navigation.test.ts` executes and passes all test assertions.
- [ ] All previous unit, integration, and statutory audit tests pass 100%.
</success_criteria>
