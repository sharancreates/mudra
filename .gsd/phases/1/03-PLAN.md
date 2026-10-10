---
phase: 1
plan: 3
wave: 2
depends_on:
  - 1.2
files_modified:
  - supabase/migrations/20261010000002_auth_triggers.sql
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Every new authenticated user automatically receives exactly one wallet with ₹1,00,000 (10,000,000 paise)"
    - "An immutable INIT ledger entry is created atomically upon account creation"
    - "Direct updates or deletions on ledger_entries are permanently rejected by a database trigger"
  artifacts:
    - supabase/migrations/20261010000002_auth_triggers.sql
---

# Plan 1.3: User Onboarding, Wallet Trigger & Immutable Ledger

<objective>
Implement the automatic onboarding workflow in PostgreSQL. When a new user registers via Supabase Auth, a database trigger automatically and idempotently provisions their user profile, establishes their wallet with ₹1,00,000 virtual cash (`10,000,000` paise), creates the immutable `INIT` ledger record, and enforces ledger append-only integrity per PRD FR-7 and Proposal Section 8.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- docs/api.md
- .gsd/phases/1/RESEARCH.md
- supabase/migrations/20261010000001_initial_schema.sql
</context>

<tasks>

<task type="auto">
  <name>Author auth triggers for automatic profile, wallet, and INIT ledger creation</name>
  <files>supabase/migrations/20261010000002_auth_triggers.sql</files>
  <action>
    Create `supabase/migrations/20261010000002_auth_triggers.sql` with function `public.handle_new_user()` executed `AFTER INSERT ON auth.users`:
    
    Steps:
    1. Define function `handle_new_user()` with `SECURITY DEFINER set search_path = public`.
    2. Extract user ID, metadata (default display name from raw_user_meta_data or `user_` + first 8 characters of UUID).
    3. Insert into `public.profiles` (`user_id`, `display_name`, `is_adult`, `accepted_terms_at`, `created_at`).
    4. Insert into `public.wallets` (`user_id`, `cash_paise = 10000000`, `reserved_paise = 0`, `starting_paise = 10000000`, `version = 1`).
    5. Insert into `public.ledger_entries` (`user_id`, `type = 'INIT'`, `cash_delta_paise = 10000000`, `created_at = now()`).
    6. Include `ON CONFLICT DO NOTHING` clauses to ensure idempotent safety: repeat user creations or session refreshes must never duplicate wallet or inject extra cash.
    7. Attach trigger: `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`.
    
    AVOID: Allowing client-side code to insert wallet balances or call initialization endpoints.
    USE: Atomic database-level trigger on `auth.users`.
  </action>
  <verify>
    Select-String -Path "supabase/migrations/20261010000002_auth_triggers.sql" -Pattern "handle_new_user", "INIT", "10000000"
  </verify>
  <done>
    Trigger function exists, initializes `profiles`, `wallets`, and records an `INIT` ledger row with exactly `10,000,000` paise.
  </done>
</task>

<task type="auto">
  <name>Implement ledger append-only immutability trigger</name>
  <files>supabase/migrations/20261010000002_auth_triggers.sql</files>
  <action>
    Append trigger `prevent_ledger_modification()` to `supabase/migrations/20261010000002_auth_triggers.sql`:
    
    Steps:
    1. Define function `prevent_ledger_modification()` returning trigger:
       - Raises exception: `'ledger_entries is append-only and cannot be updated or deleted'`.
    2. Attach `BEFORE UPDATE OR DELETE ON public.ledger_entries FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();`.
    3. Verify trigger protects against administrative or accidental audit record alterations.
    
    AVOID: Soft deletes or updateable audit records for financial ledger entries.
    USE: Strict PostgreSQL trigger that rejects all `UPDATE` and `DELETE` queries on `ledger_entries`.
  </action>
  <verify>
    Select-String -Path "supabase/migrations/20261010000002_auth_triggers.sql" -Pattern "prevent_ledger_modification", "BEFORE UPDATE OR DELETE ON"
  </verify>
  <done>
    `prevent_ledger_modification` function and trigger defined, guaranteeing append-only financial accounting.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `supabase/migrations/20261010000002_auth_triggers.sql` has both `handle_new_user()` and `prevent_ledger_modification()`
- [ ] Wallet initializes with `10,000,000` paise (₹1,00,000.00) and `INIT` ledger entry
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] User onboarding logic is atomic and tamper-proof
</success_criteria>
