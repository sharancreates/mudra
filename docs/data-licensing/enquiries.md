# Data Licensing Enquiries & Compliance Register

> **Project:** Mudra (Virtual Stock Market Simulator for NSE / BSE Equities)  
> **Status:** Active Tracking  
> **PRD Traceability:** LR-4 (Data Licensing), DR-3 (Source Traceability), FR-50 (Data-Source Adapter)  
> **Owner:** Person B (Backend & Data Lead)  
> **Date Initiated:** 10 October 2026

---

## 1. Enquiry Tracking Register

| Target Entity | Category | Contact Channel | Date Prepared / Sent | Status | Quoted Tariff / Terms | Notes & Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NSE Data and Analytics Ltd.** | Primary Exchange | `marketdata@nse.co.in` | 2026-10-10 | Prepared | Pending Response | Published tariffs list ~₹1,00,000–₹1,10,000 for EOD/delayed capital market display per medium. Inquiring on non-commercial student/educational terms. |
| **BSE Limited (Market Data)** | Primary Exchange | `bse.data@bseindia.com` | 2026-10-10 | Prepared | Pending Response | Enquiring about bhavcopy redistribution / delayed quote display policies on non-monetized educational simulator. |
| **Alpha Vantage Inc.** | Commercial Data API | `support@alphavantage.co` | 2026-10-10 | Prepared | Pending Response | Free tier provides 25 API requests/day; checking redistribution and public web display permissions for NSE tickers. |
| **Twelve Data** | Commercial Data API | `info@twelvedata.com` | 2026-10-10 | Prepared | Pending Response | Reviewing academic / free plan redistribution clauses for Indian equity closes. |

---

## 2. Standard Enquiry Email Template

The following formal communication draft is dispatched to all exchange authorities and commercial market-data vendors:

```text
Subject: Enquiry - Displaying End-of-Day Indian Equity Prices in Free Educational Simulator

Dear Market Data Team,

We are two students and developers building "Mudra", a free, non-commercial educational web simulator where beginners and students in India can learn portfolio dynamics and order mechanics using virtual currency (₹1,00,000 starting play money).

Key operational facts about the project:
1. No real money, deposits, withdrawals, trading accounts, broker links, or investment advice are involved.
2. Orders execute strictly at official end-of-day closing prices (closing-price simulation model; no live order books or tick feeds).
3. The platform is completely free and non-monetized (no subscription, no advertising, no referral fees).
4. Full source attribution and date timestamps are prominently displayed alongside every quote (e.g. "Close, DD Mon YYYY - Source: NSE/BSE").

We would be grateful if you could clarify:
1. Whether a commercial data display licence is required for displaying historical and end-of-day closing prices in this non-commercial, educational context.
2. The applicable fee schedules, or whether an educational / academic / developer exemption is available.
3. The precise conditions for historical storage, caching, and public web attribution.

Project URL: https://mudra-simulator.vercel.app (in development)
Team Contact: Manav Shah & Sharanya Nagar (team@mudra-sim.internal / manav1311shah@gmail.com)

Thank you for your guidance and support.

Sincerely,
Mudra Development Team
```

---

## 3. Launch Gate Policy (PRD Section 8.2)

1. **Development & Testing:** Runs 100% on `sample_prices.csv` (50 stocks, 1 year history) and synthetic random-walk data via `IMarketDataAdapter`. No external exchange dependencies during build.
2. **Production Public Display:** Real exchange-derived quotes will **only** be activated in production if explicit written consent or an official educational licence is granted.
3. **Fallback Mode:** If no written agreement is finalized by release, Mudra will launch under **"Practice Market"** mode: synthetic randomized price movements clearly labelled on every view with no implication of live market quotations.
