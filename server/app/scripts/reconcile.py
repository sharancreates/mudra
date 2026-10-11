"""
Nightly Ledger Reconciliation Audit Script (Python 3.10+)
Conformance: PRD FR-46, NFR-4 (Financial Integrity), Milestone M1

Verifies that across all user accounts:
  total_wallet_paise (cash_paise + reserved_paise) == total_ledger_delta_paise (sum(cash_delta_paise))

Zero-Tolerance: Exits with 0 if clean, non-zero if any discrepancy is found.
"""

import sys
from typing import Dict, List, Tuple
from app.core.logger import get_logger
from app.core.state import get_state_store

logger = get_logger("app.scripts.reconcile")


def audit_ledger_integrity() -> Tuple[bool, int, List[Dict]]:
    store = get_state_store()

    # Sum ledger cash deltas per user
    ledger_totals: Dict[str, int] = {}
    for entry in store.ledger:
        ledger_totals[entry.user_id] = ledger_totals.get(entry.user_id, 0) + entry.cash_delta_paise

    mismatches = []
    audited_count = len(store.wallets)

    for user_id, wallet in store.wallets.items():
        wallet_total = wallet.cash_paise + wallet.reserved_paise
        ledger_sum = ledger_totals.get(user_id, 0)

        if wallet_total != ledger_sum:
            mismatches.append({
                "user_id": user_id,
                "wallet_total_paise": wallet_total,
                "ledger_sum_paise": ledger_sum,
                "discrepancy_paise": wallet_total - ledger_sum,
            })

    clean = len(mismatches) == 0
    return clean, audited_count, mismatches


def run_reconciliation() -> int:
    logger.info("[RECONCILIATION] Starting nightly wallet vs ledger reconciliation audit...")
    clean, audited_count, mismatches = audit_ledger_integrity()

    if not clean:
        logger.error(f"[RECONCILIATION] SEVERE ALERT: Found {len(mismatches)} accounting mismatch(es)!")
        for m in mismatches:
            logger.error(
                f"[RECONCILIATION] User {m['user_id']} mismatch: "
                f"wallet_total={m['wallet_total_paise']} paise, "
                f"ledger_sum={m['ledger_sum_paise']} paise, "
                f"diff={m['discrepancy_paise']} paise"
            )
        return 1

    logger.info(f"[RECONCILIATION] Reconciliation clean: {audited_count} users audited, 0 mismatches.")
    return 0


if __name__ == "__main__":
    exit_code = run_reconciliation()
    sys.exit(exit_code)
