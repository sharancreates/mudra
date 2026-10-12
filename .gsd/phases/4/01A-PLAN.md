---
phase: 4
plan: "1A"
wave: 1
lead: "Person A (Frontend & UX Lead)"
collaborator: "Person B (Backend & Data Lead)"
depends_on: ["3.4A", "3.5"]
---

# Plan 4.1A: Public Leaderboard UI, Trader Rankings & Mobile Polish

## Objective
Implement Person A's Phase 4 frontend deliverables: author the public Leaderboard page (`/leaderboard`) showcasing top virtual traders ranked by total return percentage in accordance with PRD Section 2.4 anti-abuse rules (>= 5 filled trades & 7+ days active), add typed leaderboard client API methods with realistic fixtures, integrate global navigation links across `MudraHeader` and `MudraMenu`, and polish mobile trading actions on `stock/[symbol]`.

## Context
- [`.gsd/SPEC.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/SPEC.md) (Section 2.4: Fair Educational Gamification)
- [`.gsd/ROADMAP.md`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/.gsd/ROADMAP.md) (Phase 4)
- [`client/src/types/api.ts`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/types/api.ts)
- [`client/src/lib/api.ts`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/lib/api.ts)
- [`client/src/components/mudra/MudraHeader.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/mudra/MudraHeader.tsx)
- [`client/src/components/mudra/MudraMenu.tsx`](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/mudra/MudraMenu.tsx)

---

## Tasks

<task type="auto">
  <name>Author Leaderboard Types, Mock Fixture & Client API Layer</name>
  <files>client/src/types/api.ts, client/src/mocks/leaderboard.json, client/src/lib/api.ts</files>
  <action>
    - Add `LeaderboardItem` and `LeaderboardResponse` types in `client/src/types/api.ts`.
    - Create `client/src/mocks/leaderboard.json` containing 10 realistic Indian trader pseudonyms, equity amounts (e.g. ₹1,00,000 to ₹1,42,500), return BPS (+4,250 bps), trade counts (5 to 42 trades), and days active (7 to 64 days).
    - Add `getLeaderboard(timeframe?: "ALL" | "1M" | "1W")` in `client/src/lib/api.ts` with network fetch to `/api/leaderboard` and offline fallback.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Typed API client seamlessly provides leaderboard items with offline safety.</done>
</task>

<task type="auto">
  <name>Build Public Leaderboard Page with Top 3 Podium and Rankings Table</name>
  <files>client/src/app/leaderboard/page.tsx</files>
  <action>
    - Create Next.js 14 client page wrapped in `<MudraShell activeNav="leaderboard">`.
    - Swiss header with eyebrow "01 / verified performance rankings", title "Trader Leaderboard", and timeframe toggle pills ("All-Time", "Monthly", "Weekly").
    - Section explaining PRD anti-abuse rule: "Anti-Outlier Gate: Only accounts with >= 5 settled trades and >= 7 days of trading activity are ranked to eliminate single-trade luck."
    - Top 3 Podium Cards with stylized rank badges (1st: Signal Yellow `#EEA02B`, 2nd: Sky Blue `#3BBFF7`, 3rd: Slate), display names, total equity, return %, and verified trades count.
    - Responsive rankings table listing Rank 4-10+ with avatar initials, formatted INR equity, return BPS, trade count, and eligibility status.
    - Pinned "Your Standing" progress card for authenticated users, tracking trades executed (e.g. "3/5 trades") and days active toward eligibility.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Leaderboard page renders cleanly with responsive cards, table, and user standing tracker.</done>
</task>

<task type="auto">
  <name>Integrate Navigation Links Across MudraHeader, MudraMenu and MudraShell</name>
  <files>client/src/components/mudra/MudraShell.tsx, client/src/components/mudra/MudraHeader.tsx, client/src/components/mudra/MudraMenu.tsx</files>
  <action>
    - Update `MudraShell.tsx` `activeNav` prop type to include `"leaderboard"`.
    - Add "Leaderboard" link to desktop header in `client/src/components/mudra/MudraHeader.tsx`.
    - Add "05: Leaderboard" to fullscreen overlay navigation in `client/src/components/mudra/MudraMenu.tsx`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Users can navigate to `/leaderboard` from anywhere in the application.</done>
</task>

<task type="auto">
  <name>Add Mobile Floating Trade Action Bar on Stock Detail Page</name>
  <files>client/src/app/stock/[symbol]/page.tsx</files>
  <action>
    - Add fixed bottom action bar for mobile viewports (`md:hidden`) with Buy (Sky Blue) and Sell (Outline/Red) buttons that immediately open the Order Sheet modal.
    - Ensure proper bottom padding on the page container so content is never obscured by the fixed bar.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Mobile users have instant 1-tap access to Buy and Sell order sheets on stock pages.</done>
</task>

---

## Success Criteria
- [ ] `/leaderboard` renders top traders with exact paise formatting and return percentages.
- [ ] PRD Section 2.4 eligibility criteria (>= 5 trades, 7+ days) are clearly visualized.
- [ ] Header and overlay menu allow seamless 1-click navigation to `/leaderboard`.
- [ ] Mobile viewports feature sticky bottom action bar on stock detail page.
- [ ] `npx tsc --noEmit` compiles cleanly with 0 type errors.
