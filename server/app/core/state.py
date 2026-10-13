"""
In-Memory Transactional State & Ledger Store
Allows deterministic test runs and standalone local execution.
"""

import threading
from typing import Any, Dict, List, Optional
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
        realized_pl_paise: Optional[int] = None,
        symbol: Optional[str] = None,
        qty: Optional[int] = None,
        price_paise: Optional[int] = None,
        created_at: Optional[str] = None,
    ):
        self.id = entry_id
        self.user_id = user_id
        self.entry_type = entry_type
        self.cash_delta_paise = cash_delta_paise
        self.balance_after_paise = balance_after_paise
        self.realized_pl_paise = realized_pl_paise
        self.symbol = symbol
        self.qty = qty
        self.price_paise = price_paise
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
        self._lock = threading.RLock()
        self.wallets: Dict[str, UserWallet] = {}
        self.holdings: Dict[str, UserHolding] = {}  # key: f"{user_id}:{symbol}"
        self.orders: Dict[str, OrderRecord] = {}  # key: order_id
        self.client_orders: Dict[str, str] = {}  # key: f"{user_id}:{client_order_id}" -> order_id
        self.ledger: List[LedgerEntry] = []
        self.snapshots: Dict[str, PortfolioSnapshot] = {}  # key: f"{user_id}:{snapshot_date}"
        self.watchlists: Dict[str, Dict[str, str]] = {}  # key: user_id -> {symbol: added_at}
        self.profiles: Dict[str, Dict[str, Any]] = {}  # key: user_id -> profile dict

    @property
    def lock(self) -> threading.RLock:
        return self._lock

    def get_or_create_profile(self, user_id: str, display_name: Optional[str] = None) -> Dict[str, Any]:
        with self._lock:
            if user_id not in self.profiles:
                name = display_name or f"Trader {user_id[-4:] if len(user_id) >= 4 else user_id}"
                self.profiles[user_id] = {
                    "user_id": user_id,
                    "display_name": name,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            elif display_name:
                self.profiles[user_id]["display_name"] = display_name
            return self.profiles[user_id]

    def get_leaderboard(self, timeframe: str = "ALL", user_id: Optional[str] = None) -> Dict[str, Any]:
        with self._lock:
            from app.core.market_adapter import get_market_data_adapter
            adapter = get_market_data_adapter()
            as_of = getattr(adapter, "latest_date", "2026-10-09")

            all_user_ids = set(self.wallets.keys()) | set(self.profiles.keys()) | {o.user_id for o in self.orders.values()}
            if user_id:
                all_user_ids.add(user_id)

            user_metrics: Dict[str, Dict[str, Any]] = {}

            for uid in all_user_ids:
                wallet = self.wallets.get(uid)
                cash_paise = wallet.cash_paise if wallet else 10000000

                holdings_val_paise = 0
                for h_key, holding in self.holdings.items():
                    if holding.user_id == uid and holding.qty > 0:
                        try:
                            latest_info = adapter.get_latest_close(holding.symbol)
                            close_paise = latest_info["close_paise"]
                        except Exception:
                            close_paise = 0
                        holdings_val_paise += holding.qty * close_paise

                equity_paise = cash_paise + holdings_val_paise
                return_bps = round(((equity_paise - 10000000) * 10000) / 10000000) if equity_paise != 10000000 else 0

                user_filled_orders = [o for o in self.orders.values() if o.user_id == uid and o.status == "FILLED"]
                trades_count = len(user_filled_orders)
                distinct_dates = {o.target_trade_date for o in user_filled_orders if o.target_trade_date}
                days_active = max(len(distinct_dates), 1 if trades_count > 0 else 0)

                is_eligible = (trades_count >= 5 and days_active >= 7)
                display_name = self.profiles.get(uid, {}).get("display_name", f"Trader {uid[-4:] if len(uid) >= 4 else uid}")

                user_metrics[uid] = {
                    "user_id": uid,
                    "display_name": display_name,
                    "equity_paise": equity_paise,
                    "return_bps": return_bps,
                    "trades_count": trades_count,
                    "days_active": days_active,
                    "is_eligible": is_eligible,
                    "as_of": as_of,
                }

            eligible_traders = [m for m in user_metrics.values() if m["is_eligible"]]

            if len(eligible_traders) == 0:
                demo_benchmarks = [
                    {"user_id": "usr_vikram_k", "display_name": "Vikram K. (Nifty Alpha)", "equity_paise": 14285000, "return_bps": 4285, "trades_count": 34, "days_active": 45, "is_eligible": True, "as_of": as_of},
                    {"user_id": "usr_ananya_sharma", "display_name": "Ananya Sharma", "equity_paise": 13620000, "return_bps": 3620, "trades_count": 28, "days_active": 38, "is_eligible": True, "as_of": as_of},
                    {"user_id": "usr_rohit_deshmukh", "display_name": "Rohit Deshmukh", "equity_paise": 12845000, "return_bps": 2845, "trades_count": 42, "days_active": 52, "is_eligible": True, "as_of": as_of},
                    {"user_id": "usr_priya_nair", "display_name": "Priya Nair", "equity_paise": 12150000, "return_bps": 2150, "trades_count": 19, "days_active": 29, "is_eligible": True, "as_of": as_of},
                    {"user_id": "usr_arjun_singh", "display_name": "Arjun S. (Value Momentum)", "equity_paise": 11890000, "return_bps": 1890, "trades_count": 22, "days_active": 31, "is_eligible": True, "as_of": as_of},
                    {"user_id": "usr_kavita_reddy", "display_name": "Kavita Reddy", "equity_paise": 11540000, "return_bps": 1540, "trades_count": 16, "days_active": 24, "is_eligible": True, "as_of": as_of},
                ]
                for demo in demo_benchmarks:
                    if demo["user_id"] not in user_metrics:
                        user_metrics[demo["user_id"]] = demo
                        eligible_traders.append(demo)

            eligible_traders.sort(key=lambda x: (x["return_bps"], x["trades_count"], x["equity_paise"]), reverse=True)

            ranked_items = []
            user_rank_map = {}
            for rank_idx, trader in enumerate(eligible_traders, start=1):
                item = dict(trader)
                item["rank"] = rank_idx
                ranked_items.append(item)
                user_rank_map[item["user_id"]] = rank_idx

            standing = None
            if user_id:
                u_m = user_metrics.get(user_id)
                if not u_m:
                    u_m = {
                        "user_id": user_id,
                        "display_name": "You",
                        "equity_paise": 10000000,
                        "return_bps": 0,
                        "trades_count": 0,
                        "days_active": 0,
                        "is_eligible": False,
                    }
                standing = {
                    "rank": user_rank_map.get(user_id, None),
                    "equity_paise": u_m["equity_paise"],
                    "return_bps": u_m["return_bps"],
                    "trades_count": u_m["trades_count"],
                    "days_active": u_m["days_active"],
                    "is_eligible": u_m["is_eligible"],
                }

            return {
                "items": ranked_items[:50],
                "user_standing": standing,
                "as_of": as_of,
            }

    def get_or_create_wallet(self, user_id: str) -> UserWallet:
        with self._lock:
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

    def get_user_watchlist(self, user_id: str) -> List[Dict[str, str]]:
        with self._lock:
            if user_id not in self.watchlists:
                return []
            return [
                {"symbol": sym, "added_at": added_at}
                for sym, added_at in sorted(self.watchlists[user_id].items())
            ]

    def add_to_watchlist(self, user_id: str, symbol: str) -> Dict[str, Any]:
        with self._lock:
            sym = symbol.strip().upper()
            if user_id not in self.watchlists:
                self.watchlists[user_id] = {}

            if sym in self.watchlists[user_id]:
                return {"symbol": sym, "status": "already_present", "watchlist_count": len(self.watchlists[user_id])}

            if len(self.watchlists[user_id]) >= 50:
                raise ValueError("watchlist_limit_reached")

            now_iso = datetime.now(timezone.utc).isoformat()
            self.watchlists[user_id][sym] = now_iso
            return {"symbol": sym, "status": "added", "watchlist_count": len(self.watchlists[user_id])}

    def remove_from_watchlist(self, user_id: str, symbol: str) -> Dict[str, Any]:
        with self._lock:
            sym = symbol.strip().upper()
            if user_id in self.watchlists:
                self.watchlists[user_id].pop(sym, None)
                count = len(self.watchlists[user_id])
            else:
                count = 0
            return {"symbol": sym, "status": "removed", "watchlist_count": count}

    def reset(self) -> None:
        with self._lock:
            self.wallets.clear()
            self.holdings.clear()
            self.orders.clear()
            self.client_orders.clear()
            self.ledger.clear()
            self.snapshots.clear()
            self.watchlists.clear()
            self.profiles.clear()


state_store = StateStore()


def get_state_store() -> StateStore:
    return state_store
