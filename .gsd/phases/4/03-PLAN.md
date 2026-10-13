---
phase: 4
plan: 3
wave: 1
lead: "Person B (Backend & Data Lead)"
collaborator: "Person A (Frontend & UX Lead)"
depends_on: ["4.2"]
files_modified:
  - server/app/models/schemas.py
  - server/app/api/routes_status.py
  - server/app/main.py
  - server/app/scripts/healthcheck.py
  - .github/workflows/health-monitor.yml
  - server/tests/test_health_status.py
  - tests/trading/uptime_workflow.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "GET /api/status returns comprehensive system status, uptime, market data freshness, and component health"
    - "GET /api/health serves as a fast liveness probe returning HTTP 200 with status ok"
    - "Backwards compatibility preserved for existing clients reading prices_as_of, state, and market_open"
    - "GitHub Actions health monitor workflow runs on a recurring schedule (*/30 * * * *) with latency checks and alerting"
    - "CLI utility server/app/scripts/healthcheck.py enables standalone and CI health validation"
    - "100% test pass parity across Pytest and Node test runners"
  artifacts:
    - server/app/scripts/healthcheck.py
    - .github/workflows/health-monitor.yml
    - server/tests/test_health_status.py
    - tests/trading/uptime_workflow.test.ts
---

# Plan 4.3: Health Monitor and Uptime Check

<objective>
Implement Person B's Phase 4 observability and availability deliverables: enhance the system status and health endpoints (`/api/status` & `/api/health`) with diagnostic metrics while preserving backwards compatibility, author the standalone health check script (`server/app/scripts/healthcheck.py`), deploy the recurring GitHub Actions uptime monitor workflow (`.github/workflows/health-monitor.yml`), and author comprehensive test suites verifying uptime checks and latency SLAs.
</objective>

<context>
Load for context:
- server/app/main.py
- server/app/api/routes_status.py
- server/app/models/schemas.py
- client/src/types/api.ts
- .github/workflows/daily-prices.yml
- .github/workflows/weekly-backup.yml
</context>

<tasks>

<task type="auto">
  <name>Task 1: Enhance Status & Health Endpoints in FastAPI</name>
  <files>
    server/app/models/schemas.py
    server/app/api/routes_status.py
    server/app/main.py
  </files>
  <action>
    1. In `server/app/models/schemas.py`:
       - Expand `StatusResponse` to include optional diagnostic fields:
         * `status: str = "ok"`
         * `version: str = "0.2.0"`
         * `uptime_seconds: float = 0.0`
         * `timestamp: str`
         * `database: Optional[Dict[str, Any]] = None`
         * `components: Optional[Dict[str, Any]] = None`
         * Retain `prices_as_of: str`, `state: str`, and `market_open: bool` for full contract compatibility.
       - Add `HealthResponse` schema with `status: str = "ok"`, `timestamp: str`, and `version: str = "0.2.0"`.
    2. In `server/app/api/routes_status.py`:
       - Implement `GET /api/status` computing:
         * Market adapter state and `prices_as_of`.
         * Process uptime since start.
         * StateStore component counts (wallets, orders, active instruments).
         * Market trading session status (market_open, next trading day).
       - Implement `GET /api/health` lightweight liveness/readiness probe.
    3. In `server/app/main.py`:
       - Track application boot time using monotonic clock or UTC timestamp.
  </action>
  <verify>
    Test `GET /api/status` and `GET /api/health` via TestClient.
  </verify>
  <done>
    Status and health endpoints provide deep diagnostic metrics without breaking existing API contracts.
  </done>
</task>

<task type="auto">
  <name>Task 2: Build Health Check Script & GitHub Uptime Workflow</name>
  <files>
    server/app/scripts/healthcheck.py
    .github/workflows/health-monitor.yml
  </files>
  <action>
    1. Create `server/app/scripts/healthcheck.py`:
       - CLI options: `--url` (default: `http://127.0.0.1:8000`), `--timeout` (default: 5.0), `--max-latency-ms` (default: 1500), `--json`.
       - Queries `/api/health` and `/api/status`, measures round-trip latency, verifies status is `ok` and prices state is `FRESH` or valid.
       - Emits clear ASCII terminal output or JSON output.
       - Returns exit code 0 on healthy, 1 on degraded/unreachable.
    2. Create `.github/workflows/health-monitor.yml`:
       - Triggers:
         * `schedule`: cron `'*/30 * * * *'` (every 30 minutes).
         * `workflow_dispatch` with inputs: `target_url` (optional override) and `max_latency_ms`.
       - Runs health check script / curl against target server.
       - Writes Markdown status badge and latency summary to `$GITHUB_STEP_SUMMARY`.
       - Failure alerting step opening a GitHub issue if production health check fails on main.
  </action>
  <verify>
    Run `python -m app.scripts.healthcheck --help` and validate workflow YAML.
  </verify>
  <done>
    Automated uptime workflow and diagnostic health check script operational.
  </done>
</task>

<task type="auto">
  <name>Task 3: Author Pytest & Node.js Health Test Suites</name>
  <files>
    server/tests/test_health_status.py
    tests/trading/uptime_workflow.test.ts
  </files>
  <action>
    1. Create `server/tests/test_health_status.py`:
       - `test_status_endpoint_contract`: verifies 200 OK, `prices_as_of`, `state`, `market_open`, `uptime_seconds`, and `status`.
       - `test_health_liveness_probe`: verifies `GET /api/health` returns 200 OK with `status: "ok"`.
       - `test_healthcheck_script_execution`: verifies `app.scripts.healthcheck` runs against live TestClient/app and evaluates health properly.
    2. Create `tests/trading/uptime_workflow.test.ts`:
       - Verifies `.github/workflows/health-monitor.yml` exists, has cron schedule `'*/30 * * * *'`, supports `workflow_dispatch`, and contains failure alerting.
       - Verifies TypeScript client `StatusResponse` interface conformance.
  </action>
  <verify>
    `python -m pytest server/tests/test_health_status.py -v` and `npm test` exit 0.
  </verify>
  <done>
    100% test pass parity across Pytest and Node.js.
  </done>
</task>

</tasks>
