"""
In-Memory Transactional State & Ledger Store
Allows deterministic test runs and standalone local execution.
"""

from typing import Dict, List, Optional
import uuid
from datetime import datetime, timezone


class UserWallet:
    def __init__(self, user_id: str, cash_paise: int = 10000000, reserved_paise: int = 0):
        self.user_id = user_id
        self.cash_paise = cash_paise  # ₹1,00,000.00
        self.reserved_paise = reserved_paise


class UserHolding:
    def __init__(self, user_id: str, symbol: str, qty: int = 0, reserved_qty: int = 0, cost_basis_paise: int = 0):
        self.user_id = user_id
        self.symbol = symbol
        self.qty = qty
        self.reserved_qty = reserved_qty
        self.cost_basis_paise = cost_basis_paise


class OrderRecord:
    def __init__(
        self,
        order_id: str,
        user_id: str,
        symbol: str,
        side: str,
        qty: int,
        status: str,
        reserved_paise: int,
        target_trade_date: str,
        client_order_id: str,
        reason: Optional[str] = None,
        fill_price_paise: Optional[int] = None,
        created_at: Optional[str] = None,
    ):
        self.id = order_id
        self.user_id = user_id
        self.symbol = symbol
        self.side = side
        self.qty = qty
        self.status = status
        self.reserved_paise = reserved_paise
        self.target_trade_date = target_trade_date
        self.client_order_id = client_order_id
        self.reason = reason
        self.fill_price_paise = fill_price_paise
        self.created_at = created_at or datetime.now(timezone.utc).isoformat()


class LedgerEntry:
    def __init__(
        self,
        entry_id: str,
        user_id: str,
        entry_type: str,
        cash_delta_paise: int,
        balance_after_paise: int,
        created_at: Optional[str] = None,
    ):
        self.id = entry_id
        self.user_id = user_id
        self.entry_type = entry_type
        self.cash_delta_paise = cash_delta_paise
        self.balance_after_paise = balance_after_paise
        self.created_at = created_at or datetime.now(timezone.utc).isoformat()


class PortfolioSnapshot:
    def __init__(
        self,
        user_id: str,
        snapshot_date: str,
        cash_paise: int,
        holdings_value_paise: int,
        equity_paise: int,
        return_bps: int,
        created_at: Optional[str] = None,
    ):
        self.user_id = user_id
        self.snapshot_date = snapshot_date
        self.cash_paise = cash_paise
        self.holdings_value_paise = holdings_value_paise
        self.equity_paise = equity_paise
        self.return_bps = return_bps
        self.created_at = created_at or datetime.now(timezone.utc).isoformat()


class StateStore:
    def __init__(self):
        self.wallets: Dict[str, UserWallet] = {}
        self.holdings: Dict[str, UserHolding] = {}  # key: f"{user_id}:{symbol}"
        self.orders: Dict[str, OrderRecord] = {}  # key: order_id
        self.client_orders: Dict[str, str] = {}  # key: f"{user_id}:{client_order_id}" -> order_id
        self.ledger: List[LedgerEntry] = []
        self.snapshots: Dict[str, PortfolioSnapshot] = {}  # key: f"{user_id}:{snapshot_date}"

    def get_or_create_wallet(self, user_id: str) -> UserWallet:
        if user_id not in self.wallets:
            # Initialize with ₹1,00,000 (10,000,000 paise)
            self.wallets[user_id] = UserWallet(user_id=user_id, cash_paise=10000000, reserved_paise=0)
            # Create INIT ledger row
            self.ledger.append(
                LedgerEntry(
                    entry_id=f"led_{uuid.uuid4().hex[:8]}",
                    user_id=user_id,
                    entry_type="INIT",
                    cash_delta_paise=10000000,
                    balance_after_paise=10000000,
                )
            )
        return self.wallets[user_id]

    def reset(self) -> None:
        self.wallets.clear()
        self.holdings.clear()
        self.orders.clear()
        self.client_orders.clear()
        self.ledger.clear()
        self.snapshots.clear()


state_store = StateStore()


def get_state_store() -> StateStore:
    return state_store
