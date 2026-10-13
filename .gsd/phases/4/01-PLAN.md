---
phase: 4
plan: 1
wave: 1
lead: "Person B (Backend & Data Lead)"
collaborator: "Person A (Frontend & UX Lead)"
depends_on: ["3.5", "4.1A"]
files_modified:
  - supabase/migrations/20261010000008_leaderboard.sql
  - server/supabase/migrations/20261010000008_leaderboard.sql
  - server/app/models/schemas.py
  - server/app/core/state.py
  - server/app/api/routes_leaderboard.py
  - server/app/main.py
  - server/tests/test_leaderboard.py
  - tests/trading/leaderboard.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "GET /api/leaderboard returns ranked traders with integer paise equity and return_bps"
    - "PRD Section 2.4 anti-outlier gate strictly enforces >= 5 filled trades and >= 7 active days for ranking eligibility"
    - "Authenticated requests return personalized user_standing tracking rank and eligibility progress"
    - "Zero float contamination across all calculations and response payloads"
  artifacts:
    - supabase/migrations/20261010000008_leaderboard.sql
    - server/app/api/routes_leaderboard.py
    - server/tests/test_leaderboard.py
    - tests/trading/leaderboard.test.ts
---

# Plan 4.1: Leaderboard SQL Query, Anti-Outlier Filter & API Endpoint

<objective>
Implement Person B's Phase 4 backend deliverables: author the Leaderboard SQL migration (`20261010000008_leaderboard.sql`), extend the Python `StateStore` with trader metrics, implement the `GET /api/leaderboard` FastAPI endpoint supporting PRD Section 2.4 anti-outlier eligibility filtering (>= 5 filled trades & >= 7 active days), and author exhaustive test suites achieving 100% test pass parity across Pytest and Node.js.
</objective>

<context>
Load for context:
- docs/api.md
- client/src/types/api.ts
- server/app/models/schemas.py
- server/app/core/state.py
- server/app/main.py
- supabase/migrations/20261010000001_initial_schema.sql
- .gsd/phases/4/01A-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author Leaderboard SQL Migration</name>
  <files>
    supabase/migrations/20261010000008_leaderboard.sql
    server/supabase/migrations/20261010000008_leaderboard.sql
  </files>
  <action>
    Author `20261010000008_leaderboard.sql`:
    1. Define function/view `get_leaderboard(p_user_id uuid default null, p_timeframe text default 'ALL')`.
    2. Aggregate trader metrics:
       - Filled trades count from `orders` (`status = 'FILLED'`).
       - Active days count from distinct trading dates across orders and snapshots.
       - Current equity in paise (cash + value of open holdings at latest closing price).
       - Return BPS: `((equity_paise - 10000000) * 10000) / 10000000`.
       - Anti-outlier eligibility flag: `trades_count >= 5 AND days_active >= 7`.
    3. Rank eligible traders by `return_bps DESC, trades_count DESC`.
    4. Mirror migration in `server/supabase/migrations/20261010000008_leaderboard.sql`.
  </action>
  <verify>
    Test SQL syntax and verify file exists in both migration directories.
  </verify>
  <done>
    PostgreSQL migration defines production-grade leaderboard aggregation and PRD Section 2.4 gate.
  </done>
</task>

<task type="auto">
  <name>Task 2: Extend StateStore & Pydantic Schemas for Leaderboard</name>
  <files>
    server/app/models/schemas.py
    server/app/core/state.py
  </files>
  <action>
    1. In `server/app/models/schemas.py`:
       - Define `LeaderboardItem` (rank, user_id, display_name, equity_paise, return_bps, trades_count, days_active, is_eligible, as_of).
       - Define `UserStanding` (rank, equity_paise, return_bps, trades_count, days_active, is_eligible).
       - Define `LeaderboardResponse` (items, user_standing, as_of).
    2. In `server/app/core/state.py`:
       - Add `profiles` dictionary and `get_or_create_profile(user_id, display_name)`.
       - Implement `get_leaderboard(timeframe="ALL", user_id=None)` method on `StateStore`.
       - Evaluate filled trades count and active trading days for each user.
       - Enforce PRD §2.4 anti-outlier gate: `is_eligible = (trades_count >= 5 and days_active >= 7)`.
       - Sort eligible users descending by `return_bps`, assign ranks 1..N.
       - Provide curated demo traders if fewer than 3 active users so leaderboard never appears blank in dev/test.
       - If `user_id` provided, compute `user_standing`.
  </action>
  <verify>
    `python -c "from app.core.state import get_state_store; s = get_state_store(); lb = s.get_leaderboard(); print('Leaderboard items:', len(lb['items']))"` exits 0.
  </verify>
  <done>
    `StateStore` and Pydantic schemas accurately model leaderboard queries and anti-outlier evaluation.
  </done>
</task>

<task type="auto">
  <name>Task 3: Implement FastAPI Route Handler GET /api/leaderboard</name>
  <files>
    server/app/api/routes_leaderboard.py
    server/app/main.py
  </files>
  <action>
    1. Create `server/app/api/routes_leaderboard.py`:
       - Define endpoint `GET /api/leaderboard` accepting query parameters `range: str = "ALL"` and `timeframe: Optional[str] = None`.
       - Parse `Authorization` header to extract `user_id`.
       - Query `state_store.get_leaderboard(timeframe=range, user_id=user_id)`.
       - Return `LeaderboardResponse`.
    2. Mount `routes_leaderboard.router` in `server/app/main.py`.
  </action>
  <verify>
    `python -c "from app.main import app; from fastapi.testclient import TestClient; c = TestClient(app); r = c.get('/api/leaderboard'); assert r.status_code == 200; print('Route OK', len(r.json()['items']))"` exits 0.
  </verify>
  <done>
    `GET /api/leaderboard` is registered, active, and returns valid responses.
  </done>
</task>

<task type="auto">
  <name>Task 4: Author Pytest & TypeScript Leaderboard Test Suites</name>
  <files>
    server/tests/test_leaderboard.py
    tests/trading/leaderboard.test.ts
  </files>
  <action>
    1. Create `server/tests/test_leaderboard.py`:
       - `test_leaderboard_basic_response`: verifies 200 OK, schema fields, integer paise, and `as_of`.
       - `test_leaderboard_anti_outlier_filtering`:
         * User 1: 1 trade, +50% return, 1 active day -> `is_eligible == False`, not ranked in official top ranks.
         * User 2: 5 trades, +10% return, 7 active days -> `is_eligible == True`, ranked.
         * User 3: 8 trades, +25% return, 10 active days -> `is_eligible == True`, ranked #1.
       - `test_leaderboard_user_standing`: authenticated user retrieves `user_standing` with exact eligibility progress.
       - `test_leaderboard_timeframe_parameter`: verifies `range=ALL`, `range=1M`, `range=1W` query parameters.
    2. Create `tests/trading/leaderboard.test.ts`:
       - Verify Node.js unit tests for anti-outlier ranking logic and user standing calculations.
  </action>
  <verify>
    `python -m pytest server/tests/test_leaderboard.py -v -s` passes 100%.
    `npm test` passes 100%.
  </verify>
  <done>
    Exhaustive tests guarantee anti-outlier compliance and schema conformity.
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] `python -m pytest server/tests/` passes 100%
- [ ] `npm test` passes 100%
- [ ] `python -m app.scripts.reconcile` exits 0 with 0 discrepancies
</verification>

<success_criteria>
- [ ] PRD Section 2.4 Anti-outlier criteria (>= 5 trades, >= 7 days) empirically proven
- [ ] Zero float contamination in equity and return calculations
- [ ] Exact contract parity between FastAPI backend and Person A's Next.js frontend
</success_criteria>
