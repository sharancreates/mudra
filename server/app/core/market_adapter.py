"""
Market Data Adapter Implementation (Python 3.10+)
Conformance: PRD FR-50 (Data-source adapter), FR-43 (Freshness banner), FR-48 (Status endpoint)
"""

import csv
from datetime import datetime, time, date, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import pytz

from app.config import get_settings
from app.core.logger import get_logger

logger = get_logger(__name__)
IST = pytz.timezone("Asia/Kolkata")


class SampleMarketDataAdapter:
    def __init__(self, csv_path: Optional[str] = None):
        self.instruments_map: Dict[str, Dict[str, Any]] = {}
        self.price_history_map: Dict[str, List[Dict[str, Any]]] = {}
        self.metadata_map: Dict[str, Dict[str, str]] = {}
        self.latest_date: str = "2026-10-09"
        self._load_data(csv_path)

    def _load_data(self, explicit_path: Optional[str] = None) -> None:
        settings = get_settings()
        file_path = Path(explicit_path) if explicit_path else settings.resolve_data_csv_path()

        if not file_path.exists() or not file_path.is_file():
            logger.warning(f"Market data CSV not found at {file_path}. Using fallback fixtures.")
            self._load_fallback_fixtures()
            return

        logger.info(f"Loading market data from: {file_path}")
        with open(file_path, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            if not header:
                self._load_fallback_fixtures()
                return

            row_count = 0
            for parts in reader:
                if len(parts) < 10:
                    continue

                symbol = parts[0].strip().upper()
                exchange = parts[1].strip() if len(parts) > 1 else "NSE"
                name = parts[2].strip() if len(parts) > 2 else symbol
                isin = parts[3].strip() if len(parts) > 3 else ""
                sector = parts[4].strip() if len(parts) > 4 else "Equities"
                trade_date = parts[5].strip() if len(parts) > 5 else "2026-10-09"

                try:
                    open_paise = int(parts[6].strip())
                    high_paise = int(parts[7].strip())
                    low_paise = int(parts[8].strip())
                    close_paise = int(parts[9].strip())
                    volume = int(parts[10].strip()) if len(parts) > 10 else 100000
                except (ValueError, IndexError):
                    continue

                if symbol not in self.metadata_map:
                    self.metadata_map[symbol] = {
                        "name": name,
                        "sector": sector,
                        "exchange": exchange,
                        "isin": isin,
                    }

                if symbol not in self.price_history_map:
                    self.price_history_map[symbol] = []

                self.price_history_map[symbol].append({
                    "date": trade_date,
                    "open_paise": open_paise,
                    "high_paise": high_paise,
                    "low_paise": low_paise,
                    "close_paise": close_paise,
                    "volume": volume,
                })

                if trade_date > self.latest_date:
                    self.latest_date = trade_date

                row_count += 1

        logger.info(f"Loaded {row_count} price rows across {len(self.price_history_map)} instruments.")

        # Compute quotes and change in bps
        for symbol, history in self.price_history_map.items():
            history.sort(key=lambda p: p["date"])
            latest = history[-1]
            prev = history[-2] if len(history) > 1 else latest

            change_bps = 0
            if prev["close_paise"] > 0:
                change_bps = ((latest["close_paise"] - prev["close_paise"]) * 10000) // prev["close_paise"]

            meta = self.metadata_map.get(symbol, {})
            self.instruments_map[symbol] = {
                "id": symbol,
                "symbol": symbol,
                "exchange": meta.get("exchange", "NSE"),
                "name": meta.get("name", symbol),
                "sector": meta.get("sector", "Equities"),
                "last_close_paise": latest["close_paise"],
                "change_bps": change_bps,
                "as_of": latest["date"],
                "source": "SAMPLE_EOD",
                "tradable": True,
            }

    def _load_fallback_fixtures(self) -> None:
        fixtures = [
            ("RELIANCE", "Reliance Industries Ltd", "Energy", 140000),
            ("TCS", "Tata Consultancy Services Ltd", "IT", 385000),
            ("INFY", "Infosys Ltd", "IT", 155000),
            ("HDFCBANK", "HDFC Bank Ltd", "Financials", 165000),
            ("ICICIBANK", "ICICI Bank Ltd", "Financials", 112000),
        ]
        today = "2026-10-09"
        for sym, name, sector, price in fixtures:
            self.instruments_map[sym] = {
                "id": sym,
                "symbol": sym,
                "exchange": "NSE",
                "name": name,
                "sector": sector,
                "last_close_paise": price,
                "change_bps": 12,
                "as_of": today,
                "source": "SAMPLE_EOD",
                "tradable": True,
            }

    def search_instruments(
        self,
        query: Optional[str] = None,
        sector: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        results = list(self.instruments_map.values())

        if query and query.strip():
            q = query.strip().lower()
            results = [
                i for i in results
                if q in i["symbol"].lower() or q in i["name"].lower()
            ]

        if sector and sector.strip():
            s = sector.strip().lower()
            results = [i for i in results if i["sector"].lower() == s]

        return results[offset : offset + limit]

    def get_instrument(self, symbol: str) -> Optional[Dict[str, Any]]:
        return self.instruments_map.get(symbol.strip().upper())

    def get_latest_close(self, symbol: str) -> Dict[str, Any]:
        inst = self.get_instrument(symbol)
        if not inst:
            raise ValueError(f"Instrument not found: {symbol}")
        return {
            "close_paise": inst["last_close_paise"],
            "as_of": inst["as_of"],
            "source": inst["source"],
        }

    def get_historical_prices(self, symbol: str, range_str: str = "1Y") -> List[Dict[str, Any]]:
        sym = symbol.strip().upper()
        history = self.price_history_map.get(sym, [])
        count = 250
        if range_str == "1M":
            count = 22
        elif range_str == "6M":
            count = 125
        return history[-count:]

    def get_status(self) -> Dict[str, Any]:
        return evaluate_market_freshness(self.latest_date, datetime.now(pytz.utc))


class SimulatedMarketDataAdapter:
    def __init__(self):
        self.base_prices = {
            "RELIANCE": 140000,
            "TCS": 385000,
            "INFY": 155000,
            "HDFCBANK": 165000,
        }

    def search_instruments(
        self,
        query: Optional[str] = None,
        sector: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        today = date.today().isoformat()
        items = [
            {
                "id": sym,
                "symbol": sym,
                "exchange": "NSE",
                "name": f"{sym} (Practice Mode)",
                "sector": "General",
                "last_close_paise": price,
                "change_bps": 0,
                "as_of": today,
                "source": "SIMULATED",
                "tradable": True,
            }
            for sym, price in self.base_prices.items()
        ]
        return items[offset : offset + limit]

    def get_instrument(self, symbol: str) -> Optional[Dict[str, Any]]:
        sym = symbol.strip().upper()
        price = self.base_prices.get(sym)
        if not price:
            return None
        return {
            "id": sym,
            "symbol": sym,
            "exchange": "NSE",
            "name": f"{sym} (Practice Mode)",
            "sector": "General",
            "last_close_paise": price,
            "change_bps": 0,
            "as_of": date.today().isoformat(),
            "source": "SIMULATED",
            "tradable": True,
        }

    def get_latest_close(self, symbol: str) -> Dict[str, Any]:
        inst = self.get_instrument(symbol)
        if not inst:
            raise ValueError(f"Instrument not found: {symbol}")
        return {
            "close_paise": inst["last_close_paise"],
            "as_of": inst["as_of"],
            "source": "SIMULATED",
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "prices_as_of": date.today().isoformat(),
            "state": "FRESH",
            "market_open": False,
        }


def evaluate_market_freshness(
    latest_loaded_date_str: str,
    current_time: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Evaluates market open state and data freshness badge per PRD Section 8.3
    """
    if current_time is None:
        current_time = datetime.now(pytz.utc)

    if current_time.tzinfo is None:
        ist_time = IST.localize(current_time)
    else:
        ist_time = current_time.astimezone(IST)

    ist_date = ist_time.date()
    ist_date_str = ist_date.isoformat()
    weekday = ist_date.weekday()
    is_weekend = weekday in (5, 6)

    # Market open: Weekdays 09:15 to 15:30 IST
    market_open_time = time(9, 15)
    market_close_time = time(15, 30)
    current_time_val = ist_time.time()
    is_market_open = (not is_weekend) and (market_open_time <= current_time_val < market_close_time)

    # Freshness state
    try:
        latest_date_obj = datetime.strptime(latest_loaded_date_str, "%Y-%m-%d").date()
        diff_days = abs((ist_date - latest_date_obj).days)
    except Exception:
        diff_days = 0

    if diff_days >= 2 and not is_weekend:
        state = "OUTDATED"
    elif ist_date_str == latest_loaded_date_str:
        state = "FRESH"
    elif current_time_val >= time(21, 0) and not is_weekend:
        state = "DELAYED"
    else:
        state = "FRESH"

    return {
        "prices_as_of": latest_loaded_date_str,
        "state": state,
        "market_open": is_market_open,
    }


_adapter_instance: Optional[Any] = None


def get_market_data_adapter(mode: str = "sample") -> Any:
    global _adapter_instance
    if _adapter_instance is None:
        if mode == "simulated":
            _adapter_instance = SimulatedMarketDataAdapter()
        else:
            _adapter_instance = SampleMarketDataAdapter()
    return _adapter_instance
