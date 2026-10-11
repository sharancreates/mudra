---
phase: 2
plan: 1
wave: 1
depends_on:
  - 1.9
files_modified:
  - server/requirements.txt
  - server/pytest.ini
  - server/app/config.py
  - server/app/core/logger.py
  - server/app/core/math.py
  - server/app/core/market_adapter.py
  - server/app/models/schemas.py
  - server/app/api/routes_status.py
  - server/app/api/routes_instruments.py
  - server/app/api/routes_orders.py
  - server/app/main.py
  - server/app/scripts/reconcile.py
  - server/tests/test_math.py
  - server/tests/test_place_order.py
  - server/tests/test_trade_loop.py
autonomous: true
user_setup:
  - "Ensure Python 3.10+ is installed (python --version)"
must_haves:
  truths:
    - "FastAPI server runs with DEBUG=True by default and logs all requests with request_id and timing"
    - "All monetary calculations use Python integer paise (int) with anti-float assertion guards"
    - "PRD Section 7.3 reference acceptance scenario (+₹242.86 realized P&L) passes in pytest"
    - "GET /api/status, GET /api/instruments, POST /api/orders, and GET /api/orders match docs/api.md contracts 100%"
    - "Nightly ledger reconciliation script confirms zero discrepancies"
    - "Any conversion failures trigger systematic GSD debugging protocol with persistent state in .gsd/DEBUG.md"
  artifacts:
    - server/requirements.txt
    - server/app/main.py
    - server/app/core/math.py
    - server/app/core/market_adapter.py
    - server/tests/test_math.py
    - server/tests/test_trade_loop.py
---

# Plan 2.1: FastAPI (Python) Backend Conversion with Debugging by Default

<objective>
Convert the Mudra backend from TypeScript/Node route handlers to a clean, idiomatic, high-performance FastAPI (Python 3.10+) application in `server/`. Preserve all integer paise financial calculations, reproduce the PRD Section 7.3 reference scenario to the paisa, enforce the frozen `docs/api.md` contract, and equip the server with systematic debugging by default (structured debug request logging, rich traceback exception handling, and verbose test suites).
</objective>

<context>
Load for context:
- docs/api.md (Frozen API contract)
- .gsd/SPEC.md (Specification & financial rules)
- .gsd/phases/2/RESEARCH.md (FastAPI architecture & debug specifications)
- .agents/skills/debugger/SKILL.md (GSD debugging protocol)
- server/src/trading/math.ts (Reference TypeScript trading math)
- server/src/data-adapter/index.ts (Reference data adapter)
- client/src/app/api/orders/route.ts (Reference order placement logic)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Setup Python Environment & Debugging-by-Default Infrastructure</name>
  <files>
    server/requirements.txt
    server/pytest.ini
    server/app/config.py
    server/app/core/logger.py
  </files>
  <action>
    1. Create `server/requirements.txt`:
       ```
       fastapi>=0.110.0
       uvicorn[standard]>=0.28.0
       pydantic>=2.6.0
       python-multipart>=0.0.9
       pytest>=8.0.0
       httpx>=0.27.0
       pytz>=2024.1
       ```
    2. Create `server/pytest.ini` with verbose debugging configuration:
       ```ini
       [pytest]
       addopts = -v -s --tb=short
       testpaths = tests
       python_files = test_*.py
       ```
    3. Create `server/app/config.py`:
       - Define `Settings` using Pydantic `BaseSettings`:
         * `DEBUG: bool = True` (enabled by default for development and diagnostics)
         * `LOG_LEVEL: str = "DEBUG"`
         * `HOST: str = "127.0.0.1"`
         * `PORT: int = 8000`
         * `DATA_CSV_PATH: str = "data/sample_prices.csv"` (with multi-candidate fallback search)
    4. Create `server/app/core/logger.py`:
       - Configure standard library `logging` with ISO-8601 timestamps, log levels, and contextual request ID tags.
       - Provide helper `get_logger(name)` for modular debug logging across all services.
  </action>
  <verify>
    `pip install -r server/requirements.txt` installs successfully. `python -c "import fastapi, pydantic, pytest; print('Environment OK')"` exits 0.
  </verify>
</task>

<task type="auto">
  <name>Task 2: Implement Integer Paise Trading Math Engine with Anti-Float Guards</name>
  <files>
    server/app/core/math.py
    server/tests/test_math.py
  </files>
  <action>
    1. Create `server/app/core/math.py`:
       - Port all calculation logic from `server/src/trading/math.ts`.
       - **Anti-Float Guard**: Add `assert isinstance(x, int), f"Float contamination: {x}"` on all monetary inputs.
       - `calculate_fee(trade_value_paise: int) -> int`: `(trade_value_paise + 500) // 1000` (0.1% rounded to nearest paisa).
       - `calculate_buy_reservation(last_close_paise: int, qty: int) -> dict`:
         * `est_price = (last_close_paise * 110 + 50) // 100` (10% buffer)
         * `trade_value = est_price * qty`
         * `fee = calculate_fee(trade_value)`
         * `total_reserved = trade_value + fee`
         * Returns `{"estimated_price_paise": est_price, "estimated_fee_paise": fee, "total_reserved_paise": total_reserved}`.
       - `get_next_execution_date(current_time: datetime = None) -> str`:
         * Convert to `Asia/Kolkata` (IST).
         * Cutoff at 15:30 IST. Orders at or after 15:30 IST route to next open trading day.
         * Skip Saturdays, Sundays, and scheduled NSE holidays.
       - Position accounting: weighted average cost, realized P&L on sales, and unrealized P&L against closing prices.
    2. Create `server/tests/test_math.py`:
       - Unit test fee rounding.
       - Unit test buy reservation (10% buffer + 0.1% fee).
       - **PRD Section 7.3 Reference Acceptance Scenario**:
         * Step 1: BUY 10 @ ₹1,400 (fee ₹14.00) -> Cash ₹85,986.00, Holding 10, Avg ₹1,401.40.
         * Step 2: BUY 5 @ ₹1,420 (fee ₹7.10) -> Cash ₹78,878.90, Holding 15, Cost ₹21,121.10, Avg ₹1,408.07.
         * Step 3: SELL 6 @ ₹1,450 (fee ₹8.70) -> Realized **+₹242.86** (`24286` paise), Cash ₹87,570.20, Holding 9, Cost ₹12,672.66.
         * Step 4: Close at ₹1,460.00 -> Unrealized **+₹467.34** (`46734` paise), Total Equity **₹1,00,710.20** (`10071020` paise).
         * Total profit = Realized (`24286`) + Unrealized (`46734`) = `71020` paise.
       - Unit test 15:30 IST cutoff behavior on weekdays, weekends, and holidays.
  </action>
  <verify>
    `pytest server/tests/test_math.py` passes 100% with verbose output.
  </verify>
</task>

<task type="auto">
  <name>Task 3: Implement Market Data Adapter & Freshness Evaluator</name>
  <files>
    server/app/core/market_adapter.py
  </files>
  <action>
    1. Create `server/app/core/market_adapter.py`:
       - Port `SampleMarketDataAdapter` from `server/src/data-adapter/index.ts`.
       - Implement robust path resolution checking `data/sample_prices.csv`, `server/data/sample_prices.csv`, and parent paths.
       - Parse CSV rows and maintain `metadata_map` storing genuine company name, sector, and exchange.
       - In-memory pricing map and history index sorted by date.
       - Compute `change_bps` between latest close and prior close.
       - Implement `search_instruments(query, sector, limit, offset)`.
       - Implement `get_instrument(symbol)`.
       - Implement `get_latest_close(symbol)`.
       - Implement `evaluate_market_freshness(latest_loaded_date, current_time)`:
         * Evaluate IST time.
         * Check market hours (09:15 to 15:30 IST).
         * Freshness states: `FRESH`, `DELAYED` (past 21:00 IST without today close), `OUTDATED` (>=2 trading days stale).
       - Provide singleton factory `get_market_data_adapter()`.
  </action>
  <verify>
    `python -c "from app.core.market_adapter import get_market_data_adapter; a = get_market_data_adapter(); print('Loaded stocks:', len(a.search_instruments()))"` prints 50 stocks loaded.
  </verify>
</task>

<task type="auto">
  <name>Task 4: Build FastAPI App, Pydantic Schemas, Debug Middleware & Route Handlers</name>
  <files>
    server/app/models/schemas.py
    server/app/api/routes_status.py
    server/app/api/routes_instruments.py
    server/app/api/routes_orders.py
    server/app/main.py
  </files>
  <action>
    1. Create `server/app/models/schemas.py`:
       - `InstrumentSchema`: `symbol`, `name`, `exchange`, `sector`, `last_close_paise` (int), `change_bps` (int), `as_of` (str), `tradable` (bool).
       - `OrderRequest`: `symbol` (str), `side` ('BUY' | 'SELL'), `qty` (int >= 1), `client_order_id` (str).
       - `OrderResponse`: `order_id` (str), `status` (str), `target_trade_date` (str), `reserved_paise` (int).
       - `OrderItem`: `id`, `symbol`, `side`, `qty`, `status`, `reason`, `fill_price_paise`, `created_at`.
       - `StatusResponse`: `prices_as_of` (str), `state` ('FRESH' | 'DELAYED' | 'OUTDATED'), `market_open` (bool).
       - `ApiErrorResponse`: `{ "error": { "code": str, "message": str, "request_id": str, "detail": Optional[str] } }`.
    2. Create `server/app/main.py`:
       - Initialize FastAPI with title `"Mudra Virtual Trading API"` and debug configuration.
       - Add CORS middleware allowing `http://localhost:3000` (Person A's frontend).
       - **Debug Request Logging Middleware**:
         * Generates `request_id = f"req_{secrets.token_hex(4)}"`.
         * Records start time, logs method, path, query parameters at `DEBUG` level.
         * Injects `X-Request-ID` header into response.
         * Logs execution duration in milliseconds upon completion.
       - **Global Exception Handler**:
         * Catches unhandled exceptions, logs full traceback with `request_id`.
         * Returns standard `{ "error": { "code": "server_error", "message": str(e), "request_id": req_id } }` with HTTP 500.
    3. Create Route Handlers matching `docs/api.md`:
       - `server/app/api/routes_status.py`: `GET /api/status`.
       - `server/app/api/routes_instruments.py`:
         * `GET /api/instruments?q=&sector=&page=&limit=` -> `{ "items": [...] }`.
         * `GET /api/instruments/{symbol}` -> single instrument or 404 `unknown_instrument`.
       - `server/app/api/routes_orders.py`:
         * `POST /api/orders`: Validates request body, checks quantity, verifies instrument, enforces ₹25,000 max order cap, enforces idempotency on `client_order_id`, reserves cash with 10% safety buffer + 0.1% fee, and returns 201 Created.
         * `GET /api/orders?status=&symbol=` -> `{ "items": [...], "next": None }`.
  </action>
  <verify>
    `uvicorn app.main:app --port 8000` boots cleanly. Swagger documentation accessible at `http://127.0.0.1:8000/docs`.
  </verify>
</task>

<task type="auto">
  <name>Task 5: Author Pytest Test Suites & Nightly Ledger Reconciliation</name>
  <files>
    server/tests/conftest.py
    server/tests/test_place_order.py
    server/tests/test_trade_loop.py
    server/app/scripts/reconcile.py
  </files>
  <action>
    1. Create `server/tests/conftest.py`:
       - Provide FastAPI `TestClient(app)` fixture.
    2. Create `server/tests/test_place_order.py`:
       - Happy path BUY: reserves 10% buffer + 0.1% fee, status `PENDING`.
       - Idempotency test: repeating same `client_order_id` 5 times returns identical order with no duplicate deduction.
       - Insufficient cash rejection (`400 insufficient_cash`).
       - Quantity validation rejection (`400 bad_quantity`).
       - Unknown instrument rejection (`404 unknown_instrument`).
    3. Create `server/tests/test_trade_loop.py`:
       - End-to-end integration test validating signup wallet initialization (₹1,00,000), stock search, order submission, order history query, and status check.
    4. Create `server/app/scripts/reconcile.py`:
       - Audit function validating `wallet.cash + wallet.reserved == 10_000_000 + sum(ledger.cash_delta)`.
       - Returns `0` if all accounts clean, non-zero if discrepancy found.
  </action>
  <verify>
    `pytest server/tests/ -v -s` passes all tests with 0 failures.
  </verify>
</task>

<task type="auto">
  <name>Task 6: Connect Person A's Frontend Proxy to FastAPI Backend</name>
  <files>
    client/next.config.mjs
    client/src/lib/api.ts
  </files>
  <action>
    1. Configure Next.js rewrites in `client/next.config.mjs` (or proxy settings):
       - Route all `/api/:path*` requests to `http://127.0.0.1:8000/api/:path*` when running with external backend.
    2. Verify `client/src/lib/api.ts` seamlessly calls FastAPI without any client-side schema incompatibilities.
  </action>
  <verify>
    Frontend at `http://localhost:3000` successfully renders live market data from FastAPI at `http://localhost:8000`.
  </verify>
</task>

</tasks>

<debugging_protocol>
## Systematic Debugging Protocol (By Default)

If any test or conversion task encounters an error during execution:
1. **Never suppress errors**: Let the debug middleware and traceback handler report the exact root cause.
2. **Follow GSD 3-Strike Rule**:
   - Change one variable at a time.
   - Form falsifiable hypotheses.
   - If 3 fix attempts fail, pause and document findings in `.gsd/DEBUG.md`.
3. **Float Contamination Zero Tolerance**:
   - If monetary values show decimals (e.g. `1400.0` instead of `140000`), immediately flag as a bug and convert to integer paise.
</debugging_protocol>
