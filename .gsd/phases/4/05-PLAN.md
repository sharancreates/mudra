---
phase: 4
plan: 5
wave: 1
lead: "Person B (Backend & Data Lead)"
collaborator: "Person A (Frontend & UX Lead)"
depends_on: ["4.4"]
files_modified:
  - server/app/scripts/launch_audit.py
  - server/tests/test_launch_audit.py
  - tests/trading/launch_audit.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Automated Launch Audit script scans the repository and verifies 100% compliance with PRD Section 15.1"
    - "Zero real-money or payment gateway integrations (Razorpay, Stripe, UPI, bank accounts, Demat IDs)"
    - "Zero wallet reset or cash injection loopholes (The No-Reset Rule)"
    - "Strict integer paise financial integrity with zero float contamination"
    - "Mandatory statutory SEBI disclaimers, 18+ declaration, and DPDP Act compliance verified across UI and legal pages"
    - "100% test pass parity across Pytest and Node test runners"
  artifacts:
    - server/app/scripts/launch_audit.py
    - server/tests/test_launch_audit.py
    - tests/trading/launch_audit.test.ts
---

# Plan 4.5: Section 15.1 Launch Checklist Audit & "No Real Money" Verification

<objective>
Execute Person B's final Phase 4 milestone deliverable: build the automated Section 15.1 Pre-Launch Audit CLI runner (`server/app/scripts/launch_audit.py`), verify complete absence of real-money mechanisms (gateways, UPI, PAN/Aadhaar PII, cash reset loopholes), validate integer paise ledger integrity, confirm statutory SEBI disclosures across all presentation surfaces, and author comprehensive Pytest and Node.js test suites certifying v1.0 Launch-Readiness.
</objective>

<context>
Load for context:
- README.md (The "No Real Money" Statutory Creed)
- client/src/app/terms/page.tsx (PRD §15.1 Disclosures)
- client/src/components/auth/AuthModal.tsx
- server/app/core/math.py
- docs/decisions.md (ADR-001 through ADR-007)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build Automated Section 15.1 Launch Audit Script</name>
  <files>
    server/app/scripts/launch_audit.py
  </files>
  <action>
    Create `server/app/scripts/launch_audit.py`:
    1. Implement multi-pillar audit checks:
       - **Pillar 1: "No Real Money" Gateway & Banking Scan**:
         * Recursively scans `client/src`, `server/app`, and `supabase/` for forbidden payment gateway libraries and keywords (`razorpay`, `stripe`, `cashfree`, `paytm`, `phonepe`, `billdesk`, `paypal`).
         * Scans for banking / financial PII fields (`pan_number`, `aadhaar`, `bank_account`, `ifsc_code`, `demat_id`, `credit_card`).
       - **Pillar 2: "No Reset" Capital Integrity Scan**:
         * Scans for balance reset or cheating endpoints (`reset_wallet`, `top_up`, `add_cash`, `deposit_funds`).
       - **Pillar 3: Float Financial Math Contamination Scan**:
         * Scans `server/app/core/` and `server/app/models/` verifying monetary values are strictly `int` paise, never `float`.
       - **Pillar 4: Statutory Legal Disclosures**:
         * Verifies existence and content of SEBI disclaimers, 18+ declaration, and educational simulation notices in `/terms`, `AuthModal.tsx`, and `README.md`.
       - **Pillar 5: Security & Anti-Tampering Defenses**:
         * Confirms stored procedures use `SECURITY DEFINER` and revoke client direct write permissions on financial tables.
    2. CLI support: `--repo-root`, `--json`, `--markdown`.
    3. Exits with code 0 on 100% passing audit, 1 on any violation.
  </action>
  <verify>
    `python -m app.scripts.launch_audit` runs and outputs passing report.
  </verify>
  <done>
    Automated launch audit script guarantees verifiable, reproducible compliance with PRD Section 15.1.
  </done>
</task>

<task type="auto">
  <name>Task 2: Author Pytest Launch Audit Test Suite</name>
  <files>
    server/tests/test_launch_audit.py
  </files>
  <action>
    Create `server/tests/test_launch_audit.py`:
    1. `test_launch_audit_clean_pass`: runs the audit against the active repository and asserts 0 violations.
    2. `test_launch_audit_detects_forbidden_payment_gateway`: verifies that injecting a mock payment gateway keyword triggers violation detection.
    3. `test_launch_audit_detects_wallet_reset_loophole`: verifies that simulating a reset endpoint triggers a failure.
    4. `test_launch_audit_statutory_disclaimers`: verifies that statutory SEBI disclaimers are detected in terms and auth pages.
  </action>
  <verify>
    `python -m pytest server/tests/test_launch_audit.py -v` exits 0.
  </verify>
  <done>
    Pytest suite provides continuous regression defense for PRD Section 15.1.
  </done>
</task>

<task type="auto">
  <name>Task 3: Author TypeScript Pre-Launch Checklist Invariants Suite</name>
  <files>
    tests/trading/launch_audit.test.ts
  </files>
  <action>
    Create `tests/trading/launch_audit.test.ts`:
    1. Scans `client/package.json` and `server/requirements.txt` confirming 0 payment gateway dependencies.
    2. Scans `client/src` for absence of payment integration hooks.
    3. Asserts statutory disclaimers in `client/src/app/terms/page.tsx` and 18+ checkbox in `AuthModal.tsx`.
    4. Verifies starting capital is strictly virtual ₹1,00,000 (10,000,000 paise) across all models.
  </action>
  <verify>
    `npm test` exits 0.
  </verify>
  <done>
    100% test pass parity across Pytest and Node test runners.
  </done>
</task>

</tasks>
