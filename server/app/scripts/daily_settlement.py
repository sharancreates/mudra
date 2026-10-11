"""
Mudra Daily EOD Settlement Pipeline CLI Runner (Python 3.10+)
Conformance: PRD FR-45 (Daily job), FR-46 (Nightly reconciliation), FR-47 (Price quarantine)

Execution Sequence:
1. Ingest closing prices & evaluate price validity against quarantine threshold (>25% jump).
2. Execute settle_orders() with sells-before-buys ordering; skip quarantined symbols unless forced.
3. Generate daily portfolio_snapshots for equity curves and leaderboard.
4. Run nightly reconciliation audit (FR-46) asserting 0 accounting drift.
"""

import argparse
from datetime import datetime, timezone
import json
import sys
from typing import Any, Dict, List, Optional, Set

from app.core.logger import get_logger
from app.core.market_adapter import get_market_data_adapter
from app.core.settlement import settle_orders
from app.core.snapshots import generate_portfolio_snapshots
from app.core.state import get_state_store, StateStore
from app.scripts.reconcile import audit_ledger_integrity

logger = get_logger("app.scripts.daily_settlement")


def evaluate_price_quarantine(
    adapter: Any,
    trade_date: str,
    threshold: float = 0.25,
) -> Dict[str, Any]:
    """
    Evaluates closing prices on trade_date against previous day's close.
    Quarantines any symbol whose price moved by more than `threshold` (default 25%) per FR-47.
    """
    quarantined: Set[str] = set()
    validated_count = 0
    price_movements: Dict[str, float] = {}

    for sym, history in getattr(adapter, "price_history_map", {}).items():
        if not history:
            continue

        # Find target day's record and previous record
        target_idx = None
        for idx, row in enumerate(history):
            if row.get("date") == trade_date:
                target_idx = idx
                break

        if target_idx is None:
            continue

        curr_close = history[target_idx].get("close_paise", 0)
        prev_close = history[target_idx - 1].get("close_paise", 0) if target_idx > 0 else curr_close

        if prev_close > 0:
            diff_ratio = abs(curr_close - prev_close) / prev_close
            price_movements[sym] = diff_ratio
            validated_count += 1

            if diff_ratio > threshold:
                quarantined.add(sym)
                logger.warning(
                    f"[QUARANTINE] Symbol {sym} moved by {diff_ratio*100:.1f}% "
                    f"(Rs.{prev_close/100:.2f} -> Rs.{curr_close/100:.2f}), exceeding threshold {threshold*100:.0f}%. "
                    f"Quarantined per FR-47 for manual review."
                )

    return {
        "validated_count": validated_count,
        "quarantined_symbols": list(quarantined),
        "quarantine_count": len(quarantined),
        "price_movements": price_movements,
    }


def run_daily_pipeline(
    trade_date: Optional[str] = None,
    quarantine_threshold: float = 0.25,
    force: bool = False,
    dry_run: bool = False,
    state: Optional[StateStore] = None,
    adapter: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Executes the end-to-end daily post-market pipeline:
    1. Quarantine evaluation (FR-47)
    2. Settle orders (FR-45)
    3. Portfolio snapshots (FR-45)
    4. Nightly reconciliation audit (FR-46)
    """
    store = state or get_state_store()
    market_adapter = adapter or get_market_data_adapter()

    if trade_date is None:
        trade_date = getattr(market_adapter, "latest_date", "2026-10-12")

    logger.info(
        f"[DAILY_PIPELINE] Starting Daily EOD Pipeline for trade_date={trade_date} "
        f"(force={force}, dry_run={dry_run})"
    )
    start_time = datetime.now(timezone.utc)

    # Step 1: Price Quarantine Evaluation (FR-47)
    quarantine_report = evaluate_price_quarantine(
        market_adapter,
        trade_date=trade_date,
        threshold=quarantine_threshold,
    )
    quarantined_set = set(quarantine_report["quarantined_symbols"]) if not force else set()

    if force and quarantine_report["quarantine_count"] > 0:
        logger.warning(f"[DAILY_PIPELINE] Override forced: proceeding with {quarantine_report['quarantine_count']} quarantined symbols.")

    # Step 2: Order Settlement (FR-45)
    settlement_report: Dict[str, Any] = {}
    if not dry_run:
        settlement_report = settle_orders(
            trade_date=trade_date,
            quarantined_symbols=quarantined_set,
        )
    else:
        logger.info("[DAILY_PIPELINE] Dry-run enabled: skipping order settlement mutations.")
        settlement_report = {"status": "dry_run_skipped"}

    # Step 3: Portfolio Snapshots (FR-45)
    snapshots_created: List[Dict[str, Any]] = []
    if not dry_run:
        snapshots_created = generate_portfolio_snapshots(
            trade_date=trade_date,
            state=store,
            market_adapter=market_adapter,
        )
    else:
        logger.info("[DAILY_PIPELINE] Dry-run enabled: skipping portfolio snapshots.")

    # Step 4: Nightly Reconciliation Audit (FR-46)
    clean, audited_count, mismatches = audit_ledger_integrity(store)
    if not clean:
        error_msg = f"Nightly reconciliation failed with {len(mismatches)} accounting discrepancy(ies)!"
        logger.error(f"[DAILY_PIPELINE] CRITICAL FAILURE: {error_msg}")
        for m in mismatches:
            logger.error(
                f"  User {m['user_id']}: wallet={m['wallet_total_paise']} paise, "
                f"ledger={m['ledger_sum_paise']} paise, diff={m['discrepancy_paise']} paise"
            )
        raise RuntimeError(error_msg)

    duration_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000

    summary = {
        "status": "SUCCESS",
        "trade_date": trade_date,
        "duration_ms": round(duration_ms, 2),
        "prices_validated": quarantine_report["validated_count"],
        "quarantined_symbols": quarantine_report["quarantined_symbols"],
        "settlement": settlement_report,
        "snapshots_count": len(snapshots_created),
        "reconciliation_clean": True,
    }

    logger.info(f"[DAILY_PIPELINE] Pipeline finished successfully in {duration_ms:.1f}ms: {summary}")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Mudra Daily Closing Price Ingestion and Settlement Pipeline")
    parser.add_argument("--date", type=str, default=None, help="Target trade date (YYYY-MM-DD)")
    parser.add_argument("--threshold", type=float, default=0.25, help="Quarantine threshold ratio (default: 0.25 for 25%)")
    parser.add_argument("--force", action="store_true", help="Force settlement even if prices are quarantined")
    parser.add_argument("--dry-run", action="store_true", help="Simulate pipeline without persisting mutations")
    args = parser.parse_args()

    try:
        result = run_daily_pipeline(
            trade_date=args.date,
            quarantine_threshold=args.threshold,
            force=args.force,
            dry_run=args.dry_run,
        )
        print(json.dumps(result, indent=2))
        sys.exit(0)
    except Exception as e:
        logger.error(f"[DAILY_PIPELINE] Execution failed: {e}", exc_info=True)
        print(json.dumps({"status": "FAILED", "error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
