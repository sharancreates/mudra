---
phase: 4
plan: 2
wave: 1
lead: "Person B (Backend & Data Lead)"
collaborator: "Person A (Frontend & UX Lead)"
depends_on: ["4.1"]
files_modified:
  - .github/workflows/weekly-backup.yml
  - server/app/scripts/backup.py
  - server/tests/test_backup.py
  - tests/trading/backup_workflow.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Automated weekly GitHub Actions backup workflow runs every Sunday at midnight UTC (0 0 * * 0)"
    - "Workflow supports manual execution via workflow_dispatch with configurable retention days"
    - "Backup utility script dumps database schema/data via pg_dump when connected and exports state store snapshot when offline"
    - "All backups produce gzip-compressed artifacts with SHA256 checksum validation"
    - "100% test pass parity across Pytest and Node test runners"
  artifacts:
    - .github/workflows/weekly-backup.yml
    - server/app/scripts/backup.py
    - server/tests/test_backup.py
    - tests/trading/backup_workflow.test.ts
---

# Plan 4.2: Automated Weekly Database Backup Workflow & Utility

<objective>
Implement Person B's Phase 4 database durability and operational resilience deliverables: create the automated weekly PostgreSQL backup workflow (`.github/workflows/weekly-backup.yml`) utilizing `pg_dump` and GitHub Actions artifact retention, build the companion database/state backup script (`server/app/scripts/backup.py`) with gzip compression and SHA256 checksum verification, and author comprehensive Pytest and Node.js test suites.
</objective>

<context>
Load for context:
- .github/workflows/daily-prices.yml
- supabase/config.toml
- server/app/core/state.py
- .gsd/ROADMAP.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author Automated Weekly Backup GitHub Actions Workflow</name>
  <files>
    .github/workflows/weekly-backup.yml
  </files>
  <action>
    Create `.github/workflows/weekly-backup.yml`:
    1. Define trigger:
       - `schedule`: cron `'0 0 * * 0'` (Sundays 00:00 UTC / 05:30 IST).
       - `workflow_dispatch` with inputs:
         * `retention_days` (default 30, description 'Number of days to retain backup artifact')
         * `backup_type` (default 'full', options: 'full', 'schema_only', 'data_only')
         * `upload_artifact` (default true)
    2. Jobs:
       - `database-backup`:
         * Install `postgresql-client` for `pg_dump`.
         * Set up Python 3.11 with cached pip dependencies.
         * Run `server/app/scripts/backup.py` with arguments connecting to PostgreSQL via `DATABASE_URL` (or `SUPABASE_DB_URL` / `PGHOST`) if provided, with seamless fallback for offline/CI mock execution.
         * Compress dump with gzip (`.sql.gz` / `.json.gz`).
         * Compute SHA256 checksum file (`.sha256`).
         * Upload backup bundle using `actions/upload-artifact@v4` with dynamic retention days.
         * Output Markdown Job Summary to `$GITHUB_STEP_SUMMARY` detailing file size, record count, and checksum.
         * Failure alert handler creating an issue if the weekly backup fails on main.
  </action>
  <verify>
    Verify YAML syntax and workflow structure with node yaml test.
  </verify>
  <done>
    Production-grade weekly backup workflow configured with scheduling, manual dispatch, artifact upload, and failure alerting.
  </done>
</task>

<task type="auto">
  <name>Task 2: Build Database Backup & State Export Script</name>
  <files>
    server/app/scripts/backup.py
  </files>
  <action>
    Create `server/app/scripts/backup.py`:
    1. Implement CLI options using `argparse`:
       - `--output-dir` (default: `backups`)
       - `--type` (`full`, `schema_only`, `data_only`, `state`)
       - `--db-url` (optional, falls back to `DATABASE_URL` or `SUPABASE_DB_URL` env var)
       - `--compress` (default True, produces `.gz`)
       - `--validate` (path to backup file to verify integrity)
    2. Primary execution modes:
       - **PostgreSQL Mode (`pg_dump`)**: If `DATABASE_URL` is set or reachable, executes `pg_dump` with `--clean --if-exists --no-owner --no-privileges`.
       - **StateStore Snapshot Mode**: Exports all virtual simulator tables (`wallets`, `holdings`, `orders`, `ledger`, `snapshots`, `profiles`, `watchlists`) from `StateStore` to JSON with integer paise integrity.
    3. Calculate SHA256 checksum for the generated backup and write `<filename>.sha256`.
    4. Implement validation routine that verifies gzip header, decompresses data, and verifies SHA256 hash match.
  </action>
  <verify>
    `python -m app.scripts.backup --help` and `python -m app.scripts.backup --output-dir temp_backup_test` execute successfully.
  </verify>
  <done>
    Robust backup script operational with PostgreSQL pg_dump support, offline StateStore fallback, gzip compression, and SHA256 validation.
  </done>
</task>

<task type="auto">
  <name>Task 3: Author Pytest & Node.js Backup Test Suites</name>
  <files>
    server/tests/test_backup.py
    tests/trading/backup_workflow.test.ts
  </files>
  <action>
    1. Create `server/tests/test_backup.py`:
       - `test_backup_state_store_export`: populates wallets and orders, generates backup, confirms gzip and JSON integrity.
       - `test_backup_checksum_verification`: verifies SHA256 match and validation failure on corrupted file.
       - `test_backup_cli_execution`: tests CLI invocation via `subprocess` or `argparse` runner.
    2. Create `tests/trading/backup_workflow.test.ts`:
       - Asserts `.github/workflows/weekly-backup.yml` exists and has valid YAML syntax.
       - Verifies cron schedule is `'0 0 * * 0'`.
       - Verifies `workflow_dispatch` inputs for `retention_days` and `backup_type`.
       - Verifies presence of `actions/upload-artifact@v4` and SHA256 checksum step.
  </action>
  <verify>
    `python -m pytest server/tests/test_backup.py -v` and `npm test` exit with 0 errors.
  </verify>
  <done>
    100% test pass parity verifying backup scripts and workflow definitions.
  </done>
</task>

</tasks>
