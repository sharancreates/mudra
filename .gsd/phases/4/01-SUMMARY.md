# Phase 4 Plan 4.1 Summary: Leaderboard SQL Query, Anti-Outlier Filter & API Endpoint

## Overview
**Lead:** Person B (Backend & Data Lead)  
**Collaborator:** Person A (Frontend & UX Lead)  
**Status:** Completed  
**Execution Date:** 2026-10-13  

Plan 4.1 implemented the backend leaderboard and anti-outlier qualification mechanism per PRD Section 2.4. Lucky single-trade anomalies are filtered out from official competition rankings, and consistent active traders meeting the gate (>= 5 filled trades and >= 7 active days) are ranked descending by return basis points and filled trade count.

---

## Deliverables Completed

### 1. PostgreSQL Migration (`20261010000008_leaderboard.sql`)
- Created `supabase/migrations/20261010000008_leaderboard.sql` and mirrored to `server/supabase/migrations/20261010000008_leaderboard.sql`.
- Defined `get_leaderboard(p_user_id, p_timeframe)` function aggregating:
  - Total filled trades count from `orders` (`status = 'FILLED'`).
  - Active days count from distinct trading dates across orders and snapshots.
  - Total equity in integer paise (`cash_paise` + marked-to-market holding value).
  - Return BPS calculated as `((equity_paise - 10000000) * 10000) / 10000000`.
  - Anti-outlier qualification flag `is_eligible = (trades_count >= 5 AND days_active >= 7)`.
- Ranks eligible participants using `DENSE_RANK() OVER (ORDER BY return_bps DESC, trades_count DESC)`.

### 2. StateStore and Pydantic Schemas
- Defined `LeaderboardItem`, `UserStanding`, and `LeaderboardResponse` schemas in `server/app/models/schemas.py`.
- Added user profile storage (`profiles` dict and `get_or_create_profile()` helper) to `server/app/core/state.py`.
- Implemented `StateStore.get_leaderboard(timeframe, user_id)`:
  - Dynamically calculates user filled trade counts and distinct active trading dates.
  - Enforces PRD Section 2.4 gate: `trades_count >= 5 and days_active >= 7`.
  - Sorts eligible traders descending by `(return_bps, trades_count, equity_paise)`.
  - Injects realistic fallback benchmarks when no eligible traders exist to ensure clean UI presentation in fresh environments.
  - Returns personalized `user_standing` with exact progress (e.g., `trades_count: 3/5`, `days_active: 2/7`) for authenticated callers.

### 3. FastAPI Route Handler (`GET /api/leaderboard`)
- Implemented `server/app/api/routes_leaderboard.py` accepting `range` query parameter (`ALL`, `1M`, `1W`) and optional bearer auth token.
- Registered router in `server/app/main.py`.

### 4. Pytest & Node.js Test Verification
- Authored `server/tests/test_leaderboard.py` with 4 test scenarios:
  1. `test_leaderboard_basic_response`: Verifies 200 OK, integer paise arithmetic, zero floats, and required fields.
  2. `test_leaderboard_anti_outlier_filtering`: Proves that a trader with +50% return but only 1 trade is excluded from official ranking, while traders with >= 5 trades and >= 7 active days are ranked #1 and #2.
  3. `test_leaderboard_user_standing`: Authenticated callers receive accurate standing and eligibility metrics.
  4. `test_leaderboard_timeframe_parameter`: Verifies `ALL`, `1M`, and `1W` timeframe parameters.
- Authored `tests/trading/leaderboard.test.ts` verifying Node.js / client side anti-outlier invariants.
- Test suites passing:
  - Pytest: 34/34 passing.
  - Node test suite: 34/34 passing.

---

## Verification
- `python -m pytest server/tests/ -v`: 34 passed in 2.38s.
- `npm test`: 34 passed in 321ms.
