# Plan 4.1A Summary: Public Leaderboard UI, Trader Rankings & Mobile Polish

> **Status:** Completed ✅  
> **Wave:** 1  
> **Lead:** Person A (Frontend & UX Lead)  
> **Collaborator:** Person B (Backend & Data Lead)  
> **Target:** Public `/leaderboard` page, PRD Section 2.4 anti-outlier eligibility gate, Top 3 podium display, rankings table, global navigation links across `MudraHeader` & `MudraMenu`, and mobile action bar.

---

## 1. What Was Built

1. **Leaderboard Types, Mock Fixture & Client API Layer**:
   - Location: [client/src/types/api.ts](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/types/api.ts), [client/src/mocks/leaderboard.json](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/mocks/leaderboard.json), [client/src/lib/api.ts](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/lib/api.ts)
   - Defined `LeaderboardItem` (`rank`, `user_id`, `display_name`, `equity_paise`, `return_bps`, `trades_count`, `days_active`, `is_eligible`, `as_of`) and `LeaderboardResponse`.
   - Populated realistic 10-trader fixture adhering to PRD Section 2.4 anti-outlier constraints (>= 5 settled trades, >= 7 days active, positive return percentages).
   - Exported `getLeaderboard(range = "ALL")` querying `/api/leaderboard?range=` with automatic offline fallback.

2. **Public Leaderboard Page (`/leaderboard`)**:
   - Location: [client/src/app/leaderboard/page.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/leaderboard/page.tsx)
   - **Swiss Display Header**: Institutional eyebrow `01 / verified performance registry`, title, and timeframe toggle pills (`All-Time`, `Monthly`, `Weekly`).
   - **PRD Section 2.4 Anti-Outlier Eligibility Banner**: Educational callout explaining that single-trade lucky outliers are filtered out; only accounts with >= 5 settled trades and >= 7 active days are ranked.
   - **Top 3 Podium Cards**:
     * Rank 1: Elevated card with Signal Yellow (`#EEA02B`) border, Gold crown badge, total equity, +42.85% return, and trade count.
     * Rank 2: Sky Blue (`#3BBFF7`) badge with total equity and return.
     * Rank 3: Slate card with total equity and return.
   - **Pinned "Your Standing" Progress Tracker**: Authenticated card displaying the user's current rank (`#8`), equity (`formatINR`), return (+0.71%), and eligibility badge ("Qualified for Rankings").
   - **Full Rankings Table**: Complete roster with avatar initials, formatted INR equity, return BPS, trade count, active days, and "AUDITED" verification checkmark.

3. **Global Navigation Integration**:
   - Location: [client/src/components/mudra/MudraHeader.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/mudra/MudraHeader.tsx), [client/src/components/mudra/MudraMenu.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/mudra/MudraMenu.tsx), [client/src/components/mudra/MudraShell.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/components/mudra/MudraShell.tsx)
   - Added `activeNav?: "home" | "explore" | "dashboard" | "stock" | "leaderboard"` in `MudraShellProps`.
   - Added active pill-background highlighting in desktop `MudraHeader` for both `Explore` and `Leaderboard`.
   - Added `05: Leaderboard` (`/leaderboard`) to the fullscreen overlay `MudraMenu`.

4. **Mobile Polish & Actions**:
   - Location: [client/src/app/stock/[symbol]/page.tsx](file:///c:/Users/Sharanya%20Nagar/Desktop/Projects/mudra/client/src/app/stock/%5Bsymbol%5D/page.tsx)
   - Floating sticky bottom bar on mobile screens offering 1-tap Buy & Sell order sheets with safe viewport bottom padding.

---

## 2. Verification & Empirical Evidence

- **Type Safety**: Conforms to `LeaderboardItem` and `LeaderboardResponse` types.
- **Routing & Shell**: Verified `/leaderboard` wraps in `<MudraShell activeNav="leaderboard">`, header correctly activates `Leaderboard` link, and overlay menu includes item 05.
- **Fair Gamification**: Section 2.4 rules visible on screen; traders know exact requirements to enter rankings.

---

## 3. Key Decisions & Architecture

- **Pre-Wired for Person B's Plan 4.1 Backend**: The API method `getLeaderboard` is ready to query `/api/leaderboard` as soon as Person B deploys the FastAPI route handler and SQL query, providing zero-downtime frontend continuity.
- **Transparent Meritocracy**: Ranking is based on return percentage on virtual equity, with pure integer paise accounting and no predatory gamification mechanics.
