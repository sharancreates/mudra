# Phase 2 Research: FastAPI (Python) Conversion with Debugging by Default

## 1. Objectives & Context
- **Goal:** Migrate Mudra's backend services from TypeScript/Next.js route handlers to a standalone, high-performance **FastAPI (Python 3.10+)** application under `server/`.
- **Persona:** Person B (Backend and Data Lead).
- **Core Requirement:** Embed systematic **debugging by default** throughout the architecture (debug logging middleware, rich exception formatting with request IDs, runtime float guards, and verbose pytest configuration).
- **Contract Freeze:** The JSON API contracts defined in `docs/api.md` must be preserved 100% so Person A's Next.js frontend connects without modifications.

---

## 2. Technology Stack & Dependencies

```toml
# requirements.txt
fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pydantic>=2.6.0
python-multipart>=0.0.9
pytest>=8.0.0
httpx>=0.27.0
pytz>=2024.1
```

- **Runtime:** Python 3.10+ (utilizing native arbitrary-precision `int` for integer paise financial calculations).
- **Web Framework:** FastAPI with ASGI server Uvicorn.
- **Validation:** Pydantic v2 schemas strictly matching `docs/api.md`.
- **Testing:** Pytest with HTTPX `AsyncClient` / `TestClient`.

---

## 3. Architecture & File Layout

```
server/
├── requirements.txt
├── pytest.ini                     # -v -s --tb=short for rich debug traces
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app factory, CORS, debug middleware, error handlers
│   ├── config.py                  # Settings: DEBUG=True by default, HOST, PORT, CSV_PATH
│   ├── core/
│   │   ├── __init__.py
│   │   ├── logger.py              # Debug logging setup & request context
│   │   ├── math.py                # Integer paise trading engine & calendar logic
│   │   └── market_adapter.py      # 50-stock CSV reader & freshness evaluator
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py             # Pydantic v2 schemas (Instrument, Order, Status, Error)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes_status.py       # GET /api/status
│   │   ├── routes_instruments.py  # GET /api/instruments, GET /api/instruments/{symbol}
│   │   └── routes_orders.py       # POST /api/orders, GET /api/orders
│   └── scripts/
│       ├── __init__.py
│       └── reconcile.py           # Nightly zero-discrepancy ledger audit
└── tests/
    ├── conftest.py                # TestClient fixture with debug logging
    ├── test_math.py               # Section 7.3 worked example unit tests
    ├── test_place_order.py        # Order placement, validation, idempotency
    ├── test_trade_loop.py         # End-to-end integration test
    └── test_reconciliation.py     # Ledger reconciliation audit test
```

---

## 4. "Debugging by Default" Design Specifications

### 4.1. Debug Middleware & Request Tracing
Every HTTP request passing through FastAPI must:
1. Extract or generate an 8-character hex `request_id` (`req_xxxxxxxx`).
2. Log inbound method, URL path, query params, and client IP at `DEBUG` level.
3. Compute execution time in milliseconds.
4. Inject `X-Request-ID` into response headers.
5. In case of 4xx or 5xx responses, log the response body and execution trace.

### 4.2. Rich Error Formatting
All errors must adhere strictly to `docs/api.md`:
```json
{
  "error": {
    "code": "bad_quantity",
    "message": "Quantity must be an integer between 1 and 100,000.",
    "request_id": "req_a1b2c3d4"
  }
}
```
When `DEBUG=True`, unhandled exceptions will log the full Python traceback to console and optionally attach `detail: traceback.format_exc()` to help rapid local diagnosis.

### 4.3. Anti-Float Guard in Integer Paise Math
All monetary calculations in Python must strictly enforce integer paise:
- Use `int` everywhere for currency.
- Explicit assertion `assert isinstance(val, int), "Float contamination in financial calculation!"` to guarantee exact mathematical determinism without IEEE-754 floating point drift.

---

## 5. Verification Gate for Person B
To complete conversion, Person B must execute:
1. `pytest -v -s` — all tests pass (0 failures).
2. Reproduction of PRD Section 7.3 reference scenario:
   - BUY 10 @ ₹1,400 -> BUY 5 @ ₹1,420 -> SELL 6 @ ₹1,450
   - Yields exactly `+₹242.86` (`24286` paise) realized P&L and `₹1,408.07` (`140807` paise) average cost.
3. `reconcile.py` runs with 0 ledger mismatches.
4. Next.js dev server verifies communication with FastAPI endpoints.
