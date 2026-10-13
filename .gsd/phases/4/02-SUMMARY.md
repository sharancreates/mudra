# Phase 4 Plan 4.2 Summary: Automated Weekly Database Backup Workflow & Utility

## Overview
**Lead:** Person B (Backend & Data Lead)  
**Collaborator:** Person A (Frontend & UX Lead)  
**Status:** Completed  
**Execution Date:** 2026-10-13  

Plan 4.2 implemented the automated weekly database backup and operational resilience deliverables. It includes a scheduled GitHub Actions workflow for weekly full backups with retention rotation, a companion Python backup and state export utility with gzip compression and SHA256 checksum validation, and comprehensive automated test suites achieving 100% test pass parity across Pytest and Node.js test runners.

---

## Deliverables Completed

### 1. Weekly Database Backup GitHub Actions Workflow (`.github/workflows/weekly-backup.yml`)
- Created `.github/workflows/weekly-backup.yml`:
  - **Triggers:**
    * Scheduled execution every Sunday at midnight UTC (`0 0 * * 0` / 05:30 IST).
    * `workflow_dispatch` manual trigger with configurable inputs:
      - `retention_days`: Configurable retention period in days (default: 30 days).
      - `backup_type`: Choice of `full`, `schema_only`, `data_only`, or `state`.
      - `upload_artifact`: Boolean flag (default: true).
  - **Pipeline Steps:**
    * Installs `postgresql-client` for `pg_dump`.
    * Sets up Python 3.11 with pip dependency cache.
    * Invokes `python -m app.scripts.backup` to execute backup, compress to gzip, and generate SHA256 digests.
    * Verifies archive integrity using `backup.py --validate`.
    * Uploads backup artifacts (`*.gz`, `*.sha256`, `*.json`) via `actions/upload-artifact@v4` with dynamic retention.
    * Publishes a Markdown Job Summary to `$GITHUB_STEP_SUMMARY` detailing file names, sizes, and SHA256 checksums.
    * Failure alerting step using `actions/github-script@v7` to open a GitHub issue if a scheduled backup fails on `main`.

### 2. Database Backup & State Export Script (`server/app/scripts/backup.py`)
- Created `server/app/scripts/backup.py` with CLI interface:
  - `--output-dir` (default: `backups`)
  - `--type` (`full`, `schema_only`, `data_only`, `state`)
  - `--db-url` (PostgreSQL connection string; defaults to `DATABASE_URL` or `SUPABASE_DB_URL`)
  - `--compress` / `--no-compress` (gzip compression; default: true)
  - `--validate` (path to an archive for integrity and checksum verification)
- **Features:**
  - `dump_postgresql()`: Invokes `pg_dump` with `--clean --if-exists --no-owner --no-privileges` for clean portability across Supabase and local PostgreSQL environments.
  - `export_state_store()`: Exports simulator memory (`wallets`, `holdings`, `orders`, `ledger`, `snapshots`, `profiles`, `watchlists`) to structured JSON with exact integer paise fidelity.
  - `calculate_sha256()` & `write_checksum_file()`: Generates companion `.sha256` files.
  - `verify_backup_archive()`: Verifies gzip headers, decompresses streams, validates SHA256 hashes, and inspects JSON metadata.
  - 100% UTF-8 / Windows terminal portable logging without charmap encoding issues.

### 3. Automated Test Verification
- Authored `server/tests/test_backup.py` (4 tests, passing):
  - `test_backup_statestore_export`: Validates gzip compression, integer paise precision, record counts, and `.sha256` file generation.
  - `test_backup_integrity_verification`: Verifies healthy archives pass validation, and corrupted gzip streams or mismatched checksums raise errors.
  - `test_backup_cli_execution`: Tests CLI execution (`-m app.scripts.backup`) and validation flag.
  - `test_backup_uncompressed_mode`: Tests raw JSON backup generation and validation.
- Authored `tests/trading/backup_workflow.test.ts` (6 tests, passing):
  - Verifies workflow file existence, YAML structure, Sunday 00:00 UTC schedule (`0 0 * * 0`), `workflow_dispatch` inputs, `postgresql-client` setup, `actions/upload-artifact@v4`, and failure alerting.
- Test suite results:
  - Pytest: 38/38 passing.
  - Node test suite: 40/40 passing.

---

## Verification
- `python -m pytest server/tests/ -v`: 38 passed in 2.85s.
- `npm test`: 40 passed in 318ms.
