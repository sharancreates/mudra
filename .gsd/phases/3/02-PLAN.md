---
phase: 3
plan: 2
wave: 1
depends_on:
  - 3.1
files_modified:
  - server/app/scripts/daily_settlement.py
  - server/app/core/snapshots.py
  - server/tests/test_daily_pipeline.py
  - .github/workflows/daily-prices.yml
  - tests/trading/daily_pipeline.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Daily settlement script loads closing prices, validates against 25% quarantine threshold (FR-47), executes settle_orders, writes portfolio snapshots, and verifies 0 reconciliation discrepancies"
    - "GitHub Actions workflow triggers on weekday market close (10:10 UTC / 15:40 IST) and manual workflow_dispatch"
    - "Reconciliation mismatch halts execution with non-zero exit code and failure alert"
    - "All portfolio snapshot calculations store cash_paise, holdings_value_paise, equity_paise, and return_bps in integer units"
  artifacts:
    - server/app/scripts/daily_settlement.py
    - server/app/core/snapshots.py
    - server/tests/test_daily_pipeline.py
    - .github/workflows/daily-prices.yml
---

# Plan 3.2: Daily GitHub Actions Price Ingestion & Settlement Cron (`daily-prices.yml`)

<objective>
Implement the automated daily EOD price ingestion, validation & quarantine (FR-47), order settlement (`settle_orders`), portfolio snapshot generation, and nightly ledger reconciliation audit (FR-45, FR-46). Package this pipeline as a robust Python script (`daily_settlement.py`) and configure the scheduled GitHub Actions workflow (`.github/workflows/daily-prices.yml`) running at 15:40 IST (10:10 UTC) on Indian trading days.
</objective>

<context>
Load for context:
- docs/api.md
- .gsd/SPEC.md (FR-45, FR-46, FR-47, FR-48, DR-2, DR-3)
- server/app/core/settlement.py
- server/app/core/market_adapter.py
- server/app/core/state.py
- server/app/scripts/reconcile.py
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement Portfolio Snapshots Generator</name>
  <files>
    server/app/core/snapshots.py
    server/app/core/state.py
  </files>
  <action>
    Create `server/app/core/snapshots.py`:
    1. Define `generate_portfolio_snapshots(trade_date: str, state: StateStore, market_adapter: MarketAdapter) -> List[Dict[str, Any]]`:
       - For each user profile in state:
         * Query user wallet (`cash_paise`, `reserved_paise`).
         * For each holding with `qty > 0`, query latest closing price on `trade_date`.
         * Compute `holdings_value_paise = sum(h.qty * close_paise)`.
         * Compute `equity_paise = cash_paise + reserved_paise + holdings_value_paise`.
         * Compute `return_bps = ((equity_paise - 10_000_000) * 10000) // 10_000_000`.
         * Ensure anti-float integer assertions on all paise and bps fields.
         * Store snapshot in state (`portfolio_snapshots` map: `(user_id, trade_date)` -> snapshot data).
    2. Update `StateStore` in `server/app/core/state.py` if needed to store and retrieve portfolio snapshots.
  </action>
  <verify>
    `python -c "from app.core.snapshots import generate_portfolio_snapshots; print('Snapshots module OK')"` exits 0.
  </verify>
  <done>
    `server/app/core/snapshots.py` computes integer equity and return_bps snapshots for all accounts without floats.
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement Daily Settlement Pipeline Script with Price Quarantine Guard (FR-47)</name>
  <files>
    server/app/scripts/daily_settlement.py
  </files>
  <action>
    Create `server/app/scripts/daily_settlement.py`:
    1. CLI options: `--date`, `--quarantine-threshold` (default `0.25`), `--force`, `--dry-run`.
    2. Step 1 (Price Ingestion & Quarantine - FR-47):
       - Determine target trade date (default: latest trade date from adapter or today).
       - Validate prices: compare new close against previous close.
       - If price movement `abs(new_close - prev_close) / prev_close > quarantine_threshold`:
         * Flag symbol as quarantined.
         * Log warning/quarantine event.
         * Do not settle orders for quarantined symbols unless `--force` is set.
    3. Step 2 (Order Settlement - FR-45):
       - Invoke `settle_orders(target_date, state, market_adapter)`.
       - Log counts of settled sells, settled buys, rejected, volume, and fees.
    4. Step 3 (Portfolio Snapshots):
       - Invoke `generate_portfolio_snapshots(target_date, state, market_adapter)`.
       - Log snapshot count and top portfolio equity.
    5. Step 4 (Nightly Reconciliation Audit - FR-46):
       - Invoke `audit_ledger_integrity(state)`.
       - If mismatches > 0: raise error, log SEVERE ALERT, exit code 1.
    6. Return exit code 0 on complete success.
  </action>
  <verify>
    `python -m app.scripts.daily_settlement --date 2026-10-12` runs clean and exits 0.
  </verify>
  <done>
    `daily_settlement.py` orchestrates the complete 4-step EOD pipeline with quarantine security and reconciliation assertions.
  </done>
</task>

<task type="auto">
  <name>Task 3: Author GitHub Actions Workflow (.github/workflows/daily-prices.yml)</name>
  <files>
    .github/workflows/daily-prices.yml
  </files>
  <action>
    Create `.github/workflows/daily-prices.yml`:
    1. Workflow name: `Daily Market Close Ingestion & Settlement`.
    2. Triggers:
       - `schedule`: `cron: '10 10 * * 1-5'` (10:10 UTC = 15:40 IST, Monday-Friday post-market close).
       - `workflow_dispatch`:
         * `trade_date`: string (optional, defaults to current date).
         * `force`: boolean (optional, override quarantine).
    3. Job: `daily-settlement`:
       - Runs on `ubuntu-latest`.
       - Checkout repository.
       - Set up Python 3.11 with pip caching.
       - Install dependencies from `server/requirements.txt`.
       - Run daily pipeline: `python -m app.scripts.daily_settlement`.
       - Run reconciliation audit: `python -m app.scripts.reconcile`.
       - On failure step: generate diagnostic error summary; open issue or notify admins per FR-45.
  </action>
  <verify>
    Check YAML syntax and schema using Python `pyyaml` or node `yaml` parser.
  </verify>
  <done>
    `.github/workflows/daily-prices.yml` configured for automated weekday execution at 15:40 IST with error alerting.
  </done>
</task>

<task type="auto">
  <name>Task 4: Author Verification Test Suites for Daily Pipeline & Quarantine Rules</name>
  <files>
    server/tests/test_daily_pipeline.py
    tests/trading/daily_pipeline.test.ts
  </files>
  <action>
    1. Create `server/tests/test_daily_pipeline.py`:
       - Test Price Quarantine (FR-47): simulate >25% price spike and assert symbol is quarantined and skipped during settlement.
       - Test Pipeline Execution (FR-45): run daily pipeline and assert settlement + snapshots + reconciliation all execute successfully.
       - Test Reconciliation Fail Safety (FR-46): simulate artificial ledger drift and assert pipeline aborts with exit code 1 / exception.
    2. Create `tests/trading/daily_pipeline.test.ts` for Node test suite parity.
  </action>
  <verify>
    `python -m pytest server/tests/test_daily_pipeline.py -v -s` passes 100%. `npm test` passes all tests.
  </verify>
  <done>
    Automated test suites verify price quarantine, snapshot generation, and audit fail-safes.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `server/app/scripts/daily_settlement.py` executes successfully standalone.
- [ ] `.github/workflows/daily-prices.yml` exists with valid cron schedule (`10 10 * * 1-5`) and workflow_dispatch.
- [ ] Pytest suite passes all tests including `test_daily_pipeline.py`.
- [ ] Node integration suite passes with `npm test`.
</verification>

<success_criteria>
- [ ] FR-45 (Daily job loads prices, validates, settles, writes snapshots) satisfied
- [ ] FR-46 (Nightly reconciliation with 0 mismatches) enforced as hard gate
- [ ] FR-47 (Price validation and 25% jump quarantine) enforced
- [ ] GitHub Actions workflow ready for production deployment
</success_criteria>
