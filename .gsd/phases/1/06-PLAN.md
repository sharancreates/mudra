---
phase: 1
plan: 6
wave: 3
depends_on:
  - 1.2
files_modified:
  - src/lib/trading/math.ts
  - tests/trading/math.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Simulated fee is calculated as 0.1% of trade value, rounded to nearest paisa"
    - "Next execution date adheres to 15:30 IST market cutoff and trading calendar holidays"
    - "Unit tests reproduce the PRD Section 7.3 acceptance reference scenario exactly to the paisa (+₹242.86 realized, +₹467.34 unrealized)"
  artifacts:
    - src/lib/trading/math.ts
    - tests/trading/math.test.ts
---

# Plan 1.6: Trading Math Engine & Acceptance Scenario Unit Tests

<objective>
Implement the core mathematical formulas for Indian stock simulation: 0.1% simulated fee calculation, market cutoff target date resolution, weighted-average cost basis tracking, and realized/unrealized P&L. Validate with automated unit tests that reproduce the PRD Section 7.3 reference scenario to the paisa.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- docs/api.md
- .gsd/phases/1/RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Implement trading calculation and date resolution utilities</name>
  <files>src/lib/trading/math.ts</files>
  <action>
    Create `src/lib/trading/math.ts` implementing:
    
    1. `calculateFee(tradeValuePaise: bigint): bigint`:
       - Formula: `round(0.001 * tradeValuePaise)`.
       - Using integer bigint math: `(tradeValuePaise * 1n + 500n) / 1000n` (proper mathematical rounding to nearest paisa).
    2. `calculateBuyReservation(lastClosePaise: bigint, qty: number): { estPricePaise: bigint, estFeePaise: bigint, totalReservedPaise: bigint }`:
       - 10% safety buffer: `estPricePaise = (lastClosePaise * 110n) / 100n`.
       - `tradeValue = estPricePaise * BigInt(qty)`.
       - `estFeePaise = calculateFee(tradeValue)`.
       - `totalReservedPaise = tradeValue + estFeePaise`.
    3. `getNextExecutionDate(currentTime: Date, closedDates: Set<string>): string`:
       - Convert `currentTime` to Asia/Kolkata timezone (IST).
       - If after 15:30:00 IST, date advances to next calendar day.
       - Skip weekends (Saturday, Sunday) and dates present in `closedDates` (holidays).
       - Return formatted ISO date string (`YYYY-MM-DD`).
    4. `updateHoldingOnBuy(oldQty: number, oldCostBasisPaise: bigint, buyQty: number, fillPricePaise: bigint, feePaise: bigint)`:
       - `cashOut = fillPricePaise * BigInt(buyQty) + feePaise`.
       - `newCostBasis = oldCostBasisPaise + cashOut`.
       - `newQty = oldQty + buyQty`.
       - `avgPricePaise = newCostBasis / BigInt(newQty)`.
    5. `updateHoldingOnSell(oldQty: number, oldCostBasisPaise: bigint, sellQty: number, fillPricePaise: bigint, feePaise: bigint)`:
       - `tradeValue = fillPricePaise * BigInt(sellQty)`.
       - `cashIn = tradeValue - feePaise`.
       - `costOfSold = (oldCostBasisPaise * BigInt(sellQty)) / BigInt(oldQty)`.
       - `realizedPlPaise = cashIn - costOfSold`.
       - `newCostBasis = oldCostBasisPaise - costOfSold`.
       - `newQty = oldQty - sellQty`.
    
    AVOID: Using JS floating-point arithmetic for financial sums.
    USE: Explicit `bigint` operations with rounding to the nearest paisa.
  </action>
  <verify>
    Select-String -Path "src/lib/trading/math.ts" -Pattern "calculateFee", "getNextExecutionDate", "updateHoldingOnBuy", "updateHoldingOnSell"
  </verify>
  <done>
    `src/lib/trading/math.ts` contains all pure calculation logic in bigint paise with proper rounding and date checks.
  </done>
</task>

<task type="auto">
  <name>Create unit test suite validating PRD Section 7.3 reference scenario</name>
  <files>tests/trading/math.test.ts</files>
  <action>
    Create `tests/trading/math.test.ts` testing:
    
    1. **Reference Scenario Walkthrough (Section 7.3):**
       - Step 0: Initial cash = ₹1,00,000.00 (`10,000,000` paise).
       - Step 1: Buy 10 @ ₹1,400.00 (`140,000` paise):
         * Trade value: `1,400,000` paise. Fee: `1,400` paise (₹14.00). Total: `1,401,400` paise.
         * Cash: `8,598,600` paise (₹85,986.00). Holding: 10 shares, cost basis: `1,401,400` paise, avg: `140,140` paise (₹1,401.40).
       - Step 2: Buy 5 @ ₹1,420.00 (`142,000` paise):
         * Trade value: `710,000` paise. Fee: `710` paise (₹7.10). Total: `710,710` paise.
         * Cash: `7,887,890` paise (₹78,878.90). Holding: 15 shares, cost basis: `2,112,110` paise, avg: `140,807` paise (₹1,408.07).
       - Step 3: Sell 6 @ ₹1,450.00 (`145,000` paise):
         * Trade value: `870,000` paise. Fee: `870` paise (₹8.70). Proceeds: `869,130` paise (₹8,691.30).
         * Cost of sold: `844,844` paise (₹8,448.44).
         * Realized P&L: `+24,286` paise (**+₹242.86**).
         * Cash: `8,757,020` paise (₹87,570.20). Holding: 9 shares, remaining cost: `1,267,266` paise.
       - Step 4: Market close moves to ₹1,460.00 (`146,000` paise):
         * Holding value: 9 × 146,000 = `1,314,000` paise (₹13,140.00).
         * Unrealized P&L: `1,314,000 - 1,267,266 = +46,734` paise (**+₹467.34**).
         * Total equity: `8,757,020 + 1,314,000 = 10,071,020` paise (**₹1,00,710.20**).
         * Total return: `+0.71%`. Sum check: `24,286 + 46,734 = 71,020` paise.
    2. **Cutoff tests for `getNextExecutionDate`:**
       - Order at 15:29:59 IST on Friday -> targets Friday close.
       - Order at 15:30:00 IST on Friday -> targets Monday close.
       - Order on national holiday -> rolls to next trading day.
    
    AVOID: Approximate float comparisons (`toBeCloseTo`).
    USE: Exact `bigint` equality (`expect(result).toBe(expectedBigInt)`).
  </action>
  <verify>
    Select-String -Path "tests/trading/math.test.ts" -Pattern "24286", "46734", "10071020"
  </verify>
  <done>
    Unit tests verify the entire reference lifecycle and date cutoff rules with 0 discrepancy to the paisa.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `src/lib/trading/math.ts` contains fee, reservation, and holding math
- [ ] `tests/trading/math.test.ts` reproduces exact numbers: realized 242.86, unrealized 467.34, total equity 100710.20
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Mathematical precision guaranteed down to integer paise
</success_criteria>
