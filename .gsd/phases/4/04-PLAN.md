---
phase: 4
plan: 4
wave: 1
lead: "Person B (Backend & Data Lead)"
collaborator: "Person A (Frontend & UX Lead)"
depends_on: ["4.3"]
files_modified:
  - server/app/config.py
  - server/app/core/rate_limit.py
  - server/app/main.py
  - server/tests/test_rate_limit.py
  - tests/trading/rate_limit.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "API requests exceeding configured route rate limits receive HTTP 429 Too Many Requests"
    - "Error response adheres strictly to ADR-007: code 'rate_limited', request_id, and descriptive message"
    - "HTTP responses include standard rate limit headers: Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset"
    - "Authenticated requests are throttled per user_id; unauthenticated requests are throttled per IP"
    - "Health and status checks are exempt from strict mutation limits"
    - "100% test pass parity across Pytest and Node test runners"
  artifacts:
    - server/app/core/rate_limit.py
    - server/tests/test_rate_limit.py
    - tests/trading/rate_limit.test.ts
---

# Plan 4.4: Rate Limiting & Abuse Protection on API Routes

<objective>
Implement Person B's Phase 4 API protection and abuse mitigation deliverables: build a high-performance in-memory sliding-window rate limiting engine (`server/app/core/rate_limit.py`), mount rate limit middleware in FastAPI adhering to ADR-007 error specifications (`rate_limited`), enforce tiered rate limits across order mutations, general mutations, and read routes while exempting health monitoring probes, and author comprehensive Pytest and Node.js test suites.
</objective>

<context>
Load for context:
- docs/decisions.md (ADR-007)
- docs/api.md
- server/app/main.py
- server/app/config.py
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build Rate Limiter Engine & Middleware in FastAPI</name>
  <files>
    server/app/config.py
    server/app/core/rate_limit.py
    server/app/main.py
  </files>
  <action>
    1. In `server/app/config.py`:
       - Add rate limiting configurations:
         * `RATE_LIMIT_ENABLED: bool = True`
         * `RATE_LIMIT_ORDERS_PER_MINUTE: int = 20`
         * `RATE_LIMIT_MUTATIONS_PER_MINUTE: int = 60`
         * `RATE_LIMIT_READS_PER_MINUTE: int = 120`
    2. Create `server/app/core/rate_limit.py`:
       - Implement thread-safe sliding window counter `RateLimiter`:
         * Client key resolution: extracts `user_id` from Bearer token if present; otherwise client IP from `X-Forwarded-For` or `request.client.host`.
         * Tier classification by path and method:
           - Orders (`POST /api/orders`): 20 req/min
           - Watchlist & mutations (`POST /api/watchlist`, `DELETE /api/watchlist/{sym}`): 60 req/min
           - Reads (`GET /api/instruments`, `/api/portfolio`, `/api/leaderboard`, etc.): 120 req/min
           - Exempt (`GET /`, `/api/health`, `/api/status`): No throttle
         * State tracking: sliding window timestamps, remaining calculations, reset time epoch.
         * Methods: `check_rate_limit(request) -> Tuple[bool, int, int, int] (allowed, limit, remaining, reset_after)`.
         * `reset()` method for deterministic test resets.
    3. In `server/app/main.py`:
       - Register rate limiting middleware:
         * If rate limit exceeded, return HTTP 429 JSON response matching ADR-007:
           `{"error": {"code": "rate_limited", "message": "Too many requests. Please slow down.", "request_id": req_id}}`
         * Add headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
  </action>
  <verify>
    Run fast test hitting endpoint repeatedly and confirming 429 with `rate_limited` error code.
  </verify>
  <done>
    FastAPI app equipped with thread-safe tiered rate limiting and ADR-007 error compliance.
  </done>
</task>

<task type="auto">
  <name>Task 2: Author Pytest Rate Limiting & Abuse Protection Suite</name>
  <files>
    server/tests/test_rate_limit.py
  </files>
  <action>
    Create `server/tests/test_rate_limit.py`:
    1. `test_rate_limit_orders_quota_breach`:
       - Places orders up to limit; verifies next request returns 429, `code: "rate_limited"`, and `Retry-After` header.
    2. `test_rate_limit_headers_decrement`:
       - Verifies `X-RateLimit-Remaining` decreases with each request.
    3. `test_rate_limit_user_isolation`:
       - Verifies that exhausting User A's limit does not throttle User B.
    4. `test_rate_limit_health_exempt`:
       - Verifies `/api/health` and `/api/status` can be called past normal limits without throttling.
    5. `test_rate_limit_reset`:
       - Verifies `limiter.reset()` restores quotas immediately.
  </action>
  <verify>
    `python -m pytest server/tests/test_rate_limit.py -v` exits 0.
  </verify>
  <done>
    Pytest suite comprehensively validates rate limit tiers, headers, and isolation.
  </done>
</task>

<task type="auto">
  <name>Task 3: Author TypeScript Rate Limiting Contract & Algorithm Suite</name>
  <files>
    tests/trading/rate_limit.test.ts
  </files>
  <action>
    Create `tests/trading/rate_limit.test.ts`:
    1. Validates sliding window rate limiting algorithm invariants in TypeScript.
    2. Verifies ADR-007 error schema conformance (`rate_limited` code, request_id format).
    3. Verifies HTTP 429 status code and header contract (`Retry-After`, `X-RateLimit-*`).
  </action>
  <verify>
    `npm test` exits 0.
  </verify>
  <done>
    100% test pass parity across Pytest and Node test runners.
  </done>
</task>

</tasks>
