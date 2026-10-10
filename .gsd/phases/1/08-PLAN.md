---
phase: 1
plan: 8
wave: 4
depends_on:
  - 1.5
  - 1.7
files_modified:
  - src/app/api/orders/route.ts
  - src/app/api/instruments/route.ts
  - src/app/api/instruments/[symbol]/route.ts
  - src/app/api/status/route.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "POST /api/orders calls place_order() with the authenticated user context and returns 201 Created"
    - "GET /api/orders, GET /api/instruments, and GET /api/status return exact JSON payloads defined in docs/api.md"
    - "All errors strictly follow { error: { code, message, request_id } } format with HTTP 4xx status"
  artifacts:
    - src/app/api/orders/route.ts
    - src/app/api/instruments/route.ts
    - src/app/api/instruments/[symbol]/route.ts
    - src/app/api/status/route.ts
---

# Plan 1.8: Next.js Route Handlers & JSON Contract Conformance

<objective>
Implement the Next.js App Router API route handlers connecting Person A's frontend order sheet and market explorer to the backend database functions. Enforce authentication via Supabase Auth tokens, map database exceptions to standardized JSON error responses, and fulfill all frozen API specifications in `docs/api.md`.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- docs/api.md
- .gsd/phases/1/RESEARCH.md
- supabase/migrations/20261010000004_place_order.sql
</context>

<tasks>

<task type="auto">
  <name>Implement Orders API route handler (POST & GET)</name>
  <files>src/app/api/orders/route.ts</files>
  <action>
    Create `src/app/api/orders/route.ts`:
    
    Steps:
    1. Standardize error responder helper: `formatApiError(code, message, status, reqId)`.
    2. **POST handler:**
       - Extract authorization header (`Bearer <token>`). Authenticate using Supabase server client. Return 401 `not_authenticated` if missing/invalid.
       - Parse request JSON: `{ symbol, side, qty, client_order_id }`.
       - Validate body schema (symbol non-empty string, side in 'BUY'/'SELL', qty positive integer, client_order_id valid UUID). Return 400 `bad_quantity` / `bad_request` if invalid.
       - Execute RPC `place_order(p_symbol, p_side, p_qty, p_client_id)`.
       - Catch and translate SQL exceptions to standardized HTTP 4xx codes:
         * `insufficient_cash` -> 400 `{ code: 'insufficient_cash', message: 'Not enough virtual cash in wallet.' }`
         * `insufficient_holdings` -> 400 `{ code: 'insufficient_holdings', message: 'Not enough unreserved shares.' }`
         * `unknown_instrument` -> 404 `{ code: 'unknown_instrument', message: 'Instrument not found or inactive.' }`
       - Return 201 Created with `{ order_id, status: 'PENDING', target_trade_date, reserved_paise }`.
    3. **GET handler:**
       - Authenticate user.
       - Parse search params: `status`, `symbol`, `page`, `limit`.
       - Query `orders` table ordered by `created_at DESC`.
       - Return 200 OK with `{ items: [...], next: ... }`.
    
    AVOID: Exposing raw SQL stack traces or Supabase service-role keys in public route handlers.
    USE: Strict exception mapping and user-scoped Supabase client authentication.
  </action>
  <verify>
    Select-String -Path "src/app/api/orders/route.ts" -Pattern "POST", "GET", "place_order", "insufficient_cash"
  </verify>
  <done>
    `src/app/api/orders/route.ts` handles order creation and order history with complete error mapping matching `docs/api.md`.
  </done>
</task>

<task type="auto">
  <name>Implement Market Instruments and Status API route handlers</name>
  <files>
    src/app/api/instruments/route.ts
    src/app/api/instruments/[symbol]/route.ts
    src/app/api/status/route.ts
  </files>
  <action>
    Create the market discovery and status endpoints:
    
    Steps:
    1. In `src/app/api/instruments/route.ts`:
       - Handle `GET /api/instruments?q=&sector=&page=`.
       - Query `instruments` joined with latest `daily_prices`.
       - Return `{ items: [{ symbol, name, exchange, last_close_paise, change_bps, as_of }] }`.
    2. In `src/app/api/instruments/[symbol]/route.ts`:
       - Handle `GET /api/instruments/:symbol`.
       - Look up instrument by upper-cased symbol with sector, last close in paise, date, source, and tradability.
       - Return 200 with details or 404 with `unknown_instrument`.
    3. In `src/app/api/status/route.ts`:
       - Handle `GET /api/status`.
       - Query latest price date from `daily_prices` and check against current date and time.
       - Compute freshness state (`FRESH`, `DELAYED`, `OUTDATED`) and market open state (`market_open: boolean`).
       - Return 200 with `{ prices_as_of, state, market_open }`.
    
    AVOID: Returning null or unformatted dates without timezone awareness.
    USE: Consistent ISO dates and integer paise in API responses.
  </action>
  <verify>
    Select-String -Path "src/app/api/status/route.ts" -Pattern "GET", "prices_as_of", "state"
    Select-String -Path "src/app/api/instruments/route.ts" -Pattern "GET", "instruments"
  </verify>
  <done>
    Instruments and status route handlers are implemented, completing all frozen endpoints required for Person A integration.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `src/app/api/orders/route.ts` implements POST and GET matching `docs/api.md`
- [ ] `src/app/api/instruments/route.ts` and `src/app/api/status/route.ts` exist and return expected schemas
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Full backend API surface live and conforming to frozen contract
</success_criteria>
