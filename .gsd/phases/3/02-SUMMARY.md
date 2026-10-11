# Plan 3.2 Summary: Daily GitHub Actions Price Ingestion & Settlement Cron

> **Status:** Completed ✅  
> **Wave:** 1  
> **Target:** Daily closing-price pipeline (`daily-prices.yml`, `daily_settlement.py`), price quarantine guard (FR-47), portfolio snapshots, and zero-drift nightly audit (FR-46)

---

## 1. What Was Built

1. **Portfolio Snapshots Generator (`server/app/core/snapshots.py`)**:
   - `generate_portfolio_snapshots(trade_date, state, market_adapter)`: Calculates end-of-day equity and performance in basis points (`return_bps`) for all users.
   - Enforces zero float contamination: `cash_paise`, `reserved_paise`, `holdings_value_paise`, and `equity_paise` are pure integers.
   - Symmetric integer division matching PostgreSQL SQL integer division behavior for `return_bps`.
   - Populates `state.snapshots` keyed by `(user_id, trade_date)`.

2. **Daily EOD Settlement Pipeline CLI Runner (`server/app/scripts/daily_settlement.py`)**:
   - Orchestrates the full 4-step daily operational sequence:
     1. **Price Ingestion & Quarantine (FR-47)**: Compares closing price against previous close. Flags any stock moving >25% for quarantine review. Skips settlement on quarantined symbols unless `--force` is specified.
     2. **Order Settlement (FR-45)**: Calls `settle_orders(trade_date, quarantined_symbols=quarantined)`.
     3. **Portfolio Snapshots**: Generates historical snapshots for all users.
     4. **Nightly Ledger Reconciliation (FR-46)**: Audits all wallets against ledger entries. Halts with non-zero exit code and critical alert on any discrepancy.
   - CLI flags: `--date`, `--threshold`, `--force`, `--dry-run`.

3. **Scheduled GitHub Actions Workflow (`.github/workflows/daily-prices.yml`)**:
   - Triggers at `10:10 UTC` (`15:40 IST`) Monday through Friday (`cron: '10 10 * * 1-5'`) after NSE market close.
   - Supports manual `workflow_dispatch` with inputs for `trade_date`, `force`, and `dry_run`.
   - Automatically posts markdown summaries to `$GITHUB_STEP_SUMMARY`.
   - Generates automated issue alert on `main` branch failure via `actions/github-script@v7`.

4. **Quarantine Integration in Settlement Engine (`server/app/core/settlement.py`)**:
   - Added `quarantined_symbols` parameter and dated closing price lookup (`get_close_on_date`).

---

## 2. Verification & Proof

- **Python Pytest Suite**: **21/21 passed in 0.14s** ([server/tests/test_daily_pipeline.py](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/server/tests/test_daily_pipeline.py))
  - `test_price_quarantine_detects_25_pct_jump`: Verified that a 35% price jump flags `RELIANCE` for quarantine, leaves order pending, and settles when `--force` is applied.
  - `test_portfolio_snapshots_integer_math_and_returns`: Verified that portfolio equity (`₹99,986.00`) and return (`-1 bps`) match hand calculations in integer paise.
  - `test_pipeline_aborts_on_reconciliation_mismatch`: Verified that simulated wallet ledger drift raises `RuntimeError` and fails the pipeline.
- **Node.js Test Suite**: **21/21 passed in 224ms** ([tests/trading/daily_pipeline.test.ts](file:///c:/Users/MANAV/Desktop/Adani%20Uni/Projects/mudra/tests/trading/daily_pipeline.test.ts)).
- **Workflow Syntax**: Verified `.github/workflows/daily-prices.yml` with YAML parser.
- **Nightly Reconciliation Audit**: `python -m app.scripts.reconcile` reports **0 mismatches** across all users.

---

## 3. Deviations & Decisions

- **Rule 47 Quarantine Behavior**: In addition to logging warnings, `settle_orders` explicitly skips orders for quarantined instruments, leaving them in `PENDING` status for administrative approval, preventing erroneous executions caused by abnormal data spikes or unadjusted stock splits.
- **Return Basis Points Truncation**: Standardized return bps division to integer truncation towards zero (`-(abs(diff) * 10000 // 10000000)` for negative returns) to guarantee exact numerical parity between Python in-memory simulation and PostgreSQL `bigint / int` stored procedures.
