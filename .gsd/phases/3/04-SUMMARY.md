# Plan 3.4 Summary: Watchlist Backend Endpoints (`GET / POST / DELETE /api/watchlist`)

> **Status:** Completed ✅  
> **Wave:** 1  
> **Target:** Watchlist SQL stored procedures, in-memory state tracking, FastAPI route handlers (`routes_watchlist.py`), 50-stock limit enforcement (FR-38), and comprehensive automated verification.

---

## 1. What Was Built

1. **PostgreSQL Migration (`add_to_watchlist`, `remove_from_watchlist`)**:
   - Location: [20261010000007_watchlist.sql](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/supabase/migrations/20261010000007_watchlist.sql) (mirrored in [supabase/migrations/20261010000007_watchlist.sql](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/supabase/migrations/20261010000007_watchlist.sql)).
   - `add_to_watchlist(p_symbol text)`: Validates active stock in `instruments`, checks existing user item count against the 50-item limit (`watchlist_limit_reached`), and inserts into `watchlist_items` idempotently.
   - `remove_from_watchlist(p_symbol text)`: Deletes from `watchlist_items` where `user_id = auth.uid()` and returns updated count.

2. **In-Memory StateStore Watchlist Tracking**:
   - Updated [state.py](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/app/core/state.py) with `self.watchlists: Dict[str, Dict[str, str]]`, supporting `get_user_watchlist`, `add_to_watchlist` (enforcing 50-stock ceiling), and `remove_from_watchlist`.

3. **FastAPI Watchlist Route Handlers**:
   - Location: [routes_watchlist.py](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/app/api/routes_watchlist.py) (registered in [main.py](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/app/main.py)).
   - `GET /api/watchlist`: Returns user's watchlisted stocks enriched with real-time market data from the adapter: name, exchange, sector, last close, change in bps, and `added_at` timestamp.
   - `POST /api/watchlist`: Accepts `{"symbol": "..."}`, validates against active instruments (raising 400 `unknown_instrument` if absent), enforces max 50 items (raising 400 `watchlist_limit_reached`), and returns 201 Created.
   - `DELETE /api/watchlist/{symbol}` & `DELETE /api/watchlist`: Removes symbol by path parameter, query parameter, or JSON body payload idempotently.

---

## 2. Verification & Empirical Evidence

- **Python Pytest Suite**: **27/27 tests passed in 0.50s** ([server/tests/test_watchlist.py](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/tests/test_watchlist.py)):
  - `test_watchlist_happy_path_crud`: Proved complete create, read with enriched fields, and delete by path and body.
  - `test_watchlist_50_item_limit_enforced`: Filled 50 items and verified that adding a 51st instrument is blocked with 400 `watchlist_limit_reached`.
  - `test_watchlist_unknown_instrument_rejected`: Verified nonexistent ticker returns 400 `unknown_instrument`.
  - `test_watchlist_idempotent_operations`: Proved duplicate adds and deletes execute without errors or state inflation.
- **Node.js Test Suite**: **24/24 tests passed in 340ms** ([tests/trading/watchlist.test.ts](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/tests/trading/watchlist.test.ts)).
- **Nightly Reconciliation Audit**: Confirmed 0 discrepancies across all user wallets and ledgers.

---

## 3. Key Decisions

- **Dual-Path DELETE Support**: Accommodates both RESTful path parameter deletion (`DELETE /api/watchlist/TCS`) and body payload deletion (`DELETE /api/watchlist` with `{"symbol": "TCS"}`), matching frontend client implementations.
- **API Error Normalization**: Updated exception handling in [main.py](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/app/main.py) to transparently serialize structured error dictionaries with request ID tracing conforming strictly to `docs/api.md`.
