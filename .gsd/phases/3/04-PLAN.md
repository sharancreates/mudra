---
phase: 3
plan: 4
wave: 1
depends_on:
  - 3.3
files_modified:
  - server/supabase/migrations/20261010000007_watchlist.sql
  - supabase/migrations/20261010000007_watchlist.sql
  - server/app/core/state.py
  - server/app/api/routes_watchlist.py
  - server/app/main.py
  - server/tests/test_watchlist.py
  - tests/trading/watchlist.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "GET /api/watchlist returns user watchlisted stocks enriched with closing price and change %"
    - "POST /api/watchlist adds symbol to user watchlist enforcing 50-item limit (FR-38)"
    - "DELETE /api/watchlist/{symbol} and DELETE /api/watchlist removes symbol idempotently"
    - "Adding an unknown symbol returns 400 unknown_instrument"
    - "Adding a 51st item returns 400 watchlist_limit_reached"
  artifacts:
    - server/supabase/migrations/20261010000007_watchlist.sql
    - server/app/api/routes_watchlist.py
    - server/tests/test_watchlist.py
    - tests/trading/watchlist.test.ts
---

# Plan 3.4: Watchlist Backend Endpoints (`GET / POST / DELETE /api/watchlist`)

<objective>
Implement the watchlist management endpoints and database stored procedures. Allow users to add, remove, and list watchlisted stocks with real-time market data enrichment, adhering to the 50-item limit per PRD FR-38.
</objective>

<context>
Load for context:
- docs/api.md
- .gsd/SPEC.md (FR-38)
- server/app/core/market_adapter.py
- server/app/core/state.py
- client/src/lib/watchlist.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author PostgreSQL Migration for Watchlist Stored Procedures</name>
  <files>
    server/supabase/migrations/20261010000007_watchlist.sql
    supabase/migrations/20261010000007_watchlist.sql
  </files>
  <action>
    Create migration `20261010000007_watchlist.sql`:
    1. Define `public.add_to_watchlist(p_symbol text) returns jsonb`:
       - `SECURITY DEFINER` and `set search_path = public`.
       - Lookup instrument by symbol. Raise `unknown_instrument` if not found.
       - Count existing items for user. If count >= 50 and not already watchlisted, raise `watchlist_limit_reached`.
       - Insert into `watchlist_items (user_id, instrument_id, added_at)` on conflict do nothing.
       - Return JSON summary `{"symbol": p_symbol, "action": "added"}`.
    2. Define `public.remove_from_watchlist(p_symbol text) returns jsonb`:
       - `SECURITY DEFINER` and `set search_path = public`.
       - Delete from `watchlist_items` where `user_id = auth.uid()` and `instrument_id = (select id from instruments where symbol = upper(p_symbol))`.
       - Return JSON summary `{"symbol": p_symbol, "action": "removed"}`.
    3. Grant execute to `authenticated`.
  </action>
  <verify>
    Select-String -Path "server/supabase/migrations/20261010000007_watchlist.sql" -Pattern "create or replace function public.add_to_watchlist", "create or replace function public.remove_from_watchlist"
  </verify>
  <done>
    Watchlist SQL functions created and mirrored in both migration directories.
  </done>
</task>

<task type="auto">
  <name>Task 2: Extend In-Memory StateStore for Watchlists</name>
  <files>
    server/app/core/state.py
  </files>
  <action>
    Update `StateStore` in `server/app/core/state.py`:
    1. Add `self.watchlists: Dict[str, Dict[str, str]] = {}` (key: `user_id` -> mapping of `symbol` to `added_at`).
    2. Add methods:
       - `get_user_watchlist(user_id: str) -> List[Dict[str, str]]`
       - `add_to_watchlist(user_id: str, symbol: str) -> Dict[str, Any]` (enforces max 50 items)
       - `remove_from_watchlist(user_id: str, symbol: str) -> bool`
    3. Reset `self.watchlists.clear()` in `reset()`.
  </action>
  <verify>
    `python -c "from app.core.state import get_state_store; s = get_state_store(); s.add_to_watchlist('u1', 'TCS'); assert 'TCS' in [w['symbol'] for w in s.get_user_watchlist('u1')]; print('Watchlist state OK')"` exits 0.
  </verify>
  <done>
    `StateStore` manages in-memory watchlists with 50-item limit enforcement.
  </done>
</task>

<task type="auto">
  <name>Task 3: Implement FastAPI Watchlist Route Handlers</name>
  <files>
    server/app/api/routes_watchlist.py
    server/app/main.py
  </files>
  <action>
    Create `server/app/api/routes_watchlist.py`:
    1. `GET /api/watchlist`:
       - Retrieves user's watchlist symbols.
       - Enriches each symbol with market data from adapter: name, exchange, sector, last close, change_bps, as_of, tradable, added_at.
       - Returns `{"items": [...]}`.
    2. `POST /api/watchlist`:
       - Payload: `{"symbol": str}`.
       - Validate symbol exists in market adapter (return 400 `unknown_instrument` if not).
       - Add to watchlist; return 400 `watchlist_limit_reached` if >= 50.
       - Returns 200/201 with updated watchlist summary.
    3. `DELETE /api/watchlist/{symbol}` and `DELETE /api/watchlist`:
       - Removes symbol from watchlist idempotently.
       - Returns 200 with `{ "symbol": symbol, "status": "removed" }`.
    4. Register `watchlist_router` in `server/app/main.py`.
  </action>
  <verify>
    `python -c "from app.api.routes_watchlist import router; print('Watchlist routes OK')"` exits 0.
  </verify>
  <done>
    FastAPI watchlist endpoints operational with full validation.
  </done>
</task>

<task type="auto">
  <name>Task 4: Author Verification Test Suites for Watchlist Functionality</name>
  <files>
    server/tests/test_watchlist.py
    tests/trading/watchlist.test.ts
  </files>
  <action>
    1. Create `server/tests/test_watchlist.py`:
       - Happy path: add symbol, list watchlist (assert enriched market fields), delete symbol.
       - 50-item limit: add 50 distinct stocks, assert 51st returns 400 `watchlist_limit_reached`.
       - Unknown instrument: add `FAKE_XYZ`, assert 400 `unknown_instrument`.
       - Idempotent add & delete: repeat add/delete without errors.
    2. Create `tests/trading/watchlist.test.ts` for Node test suite parity.
  </action>
  <verify>
    `python -m pytest server/tests/test_watchlist.py -v -s` passes 100%. `npm test` passes all tests.
  </verify>
  <done>
    Watchlist functionality comprehensively verified in both test frameworks.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `server/supabase/migrations/20261010000007_watchlist.sql` exists and defines `add_to_watchlist` and `remove_from_watchlist`
- [ ] `GET /api/watchlist`, `POST /api/watchlist`, and `DELETE /api/watchlist/{symbol}` function properly
- [ ] 50-item limit is enforced with 400 `watchlist_limit_reached`
- [ ] All Pytest and Node tests pass cleanly with 0 failures
</verification>

<success_criteria>
- [ ] FR-38 (Watchlist add, remove, list, 50 items limit) satisfied
- [ ] Clean JSON contracts conforming to docs/api.md
</success_criteria>
