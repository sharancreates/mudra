# SPEC.md — Project Specification: Mudra

> **Status**: `FINALIZED`
>
> **Project Name**: Mudra (Virtual Stock Market Simulator for NSE / BSE Equities)
> **Active Persona**: Person B (Backend & Data Lead)
> **Team**: 2-person team (Person A: Frontend & UX, Person B: Backend & Data)
> **Budget**: ₹0 (Permanent free tiers & open source)

---

## 1. Vision
**Mudra** is a clean, honest, and educational web simulator where students and first-time Indian investors practise buying and selling NSE/BSE-listed stocks with ₹1,00,000 of virtual money. Unlike predatory or misleading stock simulators, Mudra eliminates "paper trading delusions" by operating as an **honest Closing-Price Simulator**: orders are placed throughout the day and execute against official market closing prices at 15:30 IST. Every metric (average cost, realized/unrealized P&L, returns) is explained in transparent, plain language with ₹ Lakh/Crore Indian number formatting.

---

## 2. Core Goals (v1.0 MVP)
1. **Frictionless Activation**: A new user signs up (Google/Email), completes the mandatory 18+ & simulation acknowledgement, receives a virtual ₹1,00,000 wallet, and places their first market order in under 3 minutes.
2. **Transparent Mathematical Correctness**: Explainable portfolio calculations (cash, holdings, weighted-average cost, realized & unrealized P&L, 0.1% simulated brokerage fee) backed by an immutable ledger stored in integer paise.
3. **Closing-Price Engine & Data Integrity**: Explicit labeling of end-of-day prices ("Close, DD Mon YYYY" / "Simulated"), execution at 15:30 IST cutoff, safe degradation (FRESH / DELAYED / OUTDATED badges), and "Practice Market" synthetic fallback.
4. **Fair Educational Gamification**: A transparent leaderboard based on total return % (requiring >= 5 filled trades & 7 days of activity) without real prizes or predatory hooks.
5. **Zero-Budget Sustainability**: 100% operational on permanent free tiers (Next.js on Vercel Hobby + Supabase Postgres/Auth + GitHub Actions cron).

---

## 3. Non-Goals (Out of Scope for v1.0)
- **No Real Money / No Broker Integration**: No deposits, withdrawals, bank/UPI details, PAN, Aadhaar, Demat links, or affiliate broker connections.
- **No Intraday / Real-time Tick Data or Live Order Books**: No WebSockets, level-2 order book simulation, or intraday tick chart feeds (avoids NSE licensing fees of ₹1L+/medium).
- **No Complex Derivatives or Shorting**: No options, futures, margin trading, crypto, mutual funds, or intraday short selling.
- **No Investment Advice / Stock Tips**: No "top picks", algorithmic trading signals, social feeds, comment sections, or return promises.
- **No Native Mobile App**: Responsive web application only (mobile-first single column viewport down to 360px).

---

## 4. Users and Personas
- **Aarav (20, College Student)**: Mobile-first user learning about investing from social media; needs zero-risk sandbox with plain terminology and peer leaderboard comparison.
- **Meera (25, Early-career Professional)**: Exploring equity SIPs; needs concise dashboard, transparent P&L formulas, and fee explanations in short check-in sessions.
- **Person A & B (Builders / Operators)**: Requires zero-maintenance architecture, automated GitHub Actions settlement, clear health statuses, and strict anti-tampering RLS.

---

## 5. Technical Stack & Architecture
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts (equity curve & stock charts).
- **Backend**: Next.js Route Handlers (`/api/orders`, `/api/portfolio`, `/api/instruments`, `/api/status`) invoking PostgreSQL `SECURITY DEFINER` stored procedures.
- **Database & Auth**: Supabase PostgreSQL with strict Row Level Security (RLS) + Supabase Auth (Google OAuth + Email magic link/password). All currency stored as `bigint` paise (₹1,00,000 = `10000000` paise).
- **Scheduled Jobs**: GitHub Actions daily cron for EOD price fetching, order settlement (`settle_orders()`), snapshots, and ledger reconciliation.
- **Deployment**: Vercel Hobby (Frontend/API) + Supabase Free tier.

---

## 6. Success Criteria
- [ ] Person A completes Week 1 deliverables: Next.js scaffold + Design system + 6 core screen wireframes + Mock API client + Explorer & Order sheet.
- [ ] User onboarding to pending order execution loop under 3 minutes.
- [ ] Ledger reconciliation passes with 0 balance discrepancies (`wallet.cash + reserved = 10,000,000 + sum(ledger)`).
- [ ] 100% compliance with "No Real Money" safety gate (zero payment or financial identity fields).
- [ ] Responsive design verified on 360px, 390px, and desktop viewports.
