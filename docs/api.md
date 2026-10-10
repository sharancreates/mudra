# Mudra API Contract (Frozen for Week 1)

All money fields are **integer paise** (`100 paise = ₹1.00`).  
Headers: `Authorization: Bearer <jwt>` (issued by Supabase Auth).

---

## 1. Orders

### `POST /api/orders`
Place a market order (executing at next close).

**Request:**
```json
{
  "symbol": "RELIANCE",
  "side": "BUY",
  "qty": 10,
  "client_order_id": "b182cb08-0bf1-4246-86d1-432a514d428e"
}
```

**Response (201 Created):**
```json
{
  "order_id": "e9b2185a-cf2b-42ea-9e79-ec0a1ef17ad9",
  "status": "PENDING",
  "target_trade_date": "2026-10-12",
  "reserved_paise": 1540000
}
```

**Error Format (4xx):**
```json
{
  "error": {
    "code": "insufficient_cash",
    "message": "Not enough virtual cash in wallet.",
    "request_id": "req_881920"
  }
}
```
*Possible error codes:* `not_authenticated`, `bad_quantity`, `unknown_instrument`, `insufficient_cash`, `insufficient_holdings`, `market_data_unavailable`, `rate_limited`, `duplicate_ignored`.

---

### `GET /api/orders?status=&page=`
Retrieve order history.

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "e9b2185a-cf2b-42ea-9e79-ec0a1ef17ad9",
      "symbol": "RELIANCE",
      "side": "BUY",
      "qty": 10,
      "status": "PENDING",
      "reason": null,
      "fill_price_paise": null,
      "created_at": "2026-10-10T14:15:00Z"
    }
  ],
  "next": null
}
```

---

## 2. Market Instruments

### `GET /api/instruments?q=&sector=&page=`
Search or browse instruments.

**Response (200 OK):**
```json
{
  "items": [
    {
      "symbol": "RELIANCE",
      "name": "Reliance Industries Limited",
      "exchange": "NSE",
      "sector": "Energy",
      "last_close_paise": 140000,
      "change_bps": 125,
      "as_of": "2026-10-09"
    }
  ]
}
```

---

### `GET /api/instruments/:symbol`
Stock detail page data.

**Response (200 OK):**
```json
{
  "symbol": "RELIANCE",
  "name": "Reliance Industries Limited",
  "sector": "Energy",
  "exchange": "NSE",
  "last_close_paise": 140000,
  "as_of": "2026-10-09",
  "source": "EOD Archive",
  "tradable": true
}
```

---

## 3. Portfolio & Dashboard

### `GET /api/portfolio`
Overview of user holdings and cash.

**Response (200 OK):**
```json
{
  "cash_paise": 8598600,
  "reserved_paise": 0,
  "holdings": [
    {
      "symbol": "RELIANCE",
      "qty": 10,
      "avg_paise": 140140,
      "invested_paise": 1401400,
      "value_paise": 1460000,
      "unrealized_paise": 58600
    }
  ],
  "equity_paise": 10058600,
  "realized_paise": 0,
  "prices_as_of": "2026-10-09"
}
```

---

## 4. Status

### `GET /api/status`
Data freshness and operational state.

**Response (200 OK):**
```json
{
  "prices_as_of": "2026-10-09",
  "state": "FRESH",
  "market_open": false
}
```
