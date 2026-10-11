"""
Pytest Test Suite: Ledger Reconciliation Audit Verification
"""

from app.core.state import get_state_store, LedgerEntry
from app.scripts.reconcile import audit_ledger_integrity, run_reconciliation


def test_reconciliation_clean_scenario():
    store = get_state_store()
    # Create two users with legitimate initial ledger entries
    w1 = store.get_or_create_wallet("usr_audit_1")
    w2 = store.get_or_create_wallet("usr_audit_2")

    # Reserve some cash in w2 for a pending order
    w2.cash_paise -= 1541540
    w2.reserved_paise += 1541540

    clean, count, mismatches = audit_ledger_integrity()
    assert clean is True
    assert count == 2
    assert len(mismatches) == 0
    assert run_reconciliation() == 0


def test_reconciliation_detects_discrepancy():
    store = get_state_store()
    w = store.get_or_create_wallet("usr_hacker")
    # Illegitimate cash injection bypassing ledger
    w.cash_paise += 500000

    clean, count, mismatches = audit_ledger_integrity()
    assert clean is False
    assert len(mismatches) == 1
    assert mismatches[0]["discrepancy_paise"] == 500000
    assert run_reconciliation() == 1
