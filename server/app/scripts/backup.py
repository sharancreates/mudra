"""
Mudra Database Backup & Disaster Recovery Utility (Python 3.10+)
Conformance: Phase 4 Plan 4.2 (Automated weekly database backup workflow)
PRD FR-46 (Audit Trails & Data Integrity)

Capabilities:
1. PostgreSQL Live Backup: Invokes `pg_dump` with clean portability flags (--no-owner, --no-privileges).
2. StateStore Export: Serializes virtual simulator state (wallets, holdings, orders, ledger, snapshots, profiles, watchlists).
3. Compression & Verification: Gzip stream compression and SHA256 checksum generation/validation.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict, is_dataclass
from datetime import datetime, timezone
import gzip
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from typing import Any, Dict, List, Optional

from app.core.logger import get_logger
from app.core.state import get_state_store, StateStore

logger = get_logger("app.scripts.backup")


def calculate_sha256(filepath: str | Path) -> str:
    """Computes SHA256 hex digest for a file."""
    p = Path(filepath)
    hasher = hashlib.sha256()
    with open(p, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def write_checksum_file(archive_path: Path, sha256_hash: str) -> Path:
    """Writes a companion .sha256 file containing '<hash>  <filename>'."""
    csum_path = archive_path.with_name(f"{archive_path.name}.sha256")
    with open(csum_path, "w", encoding="utf-8") as f:
        f.write(f"{sha256_hash}  {archive_path.name}\n")
    return csum_path


def verify_backup_archive(filepath: str | Path) -> Dict[str, Any]:
    """
    Validates backup file integrity:
    1. Checks file existence and non-zero size.
    2. Validates gzip decompression if compressed.
    3. Validates SHA256 hash against companion .sha256 file if present.
    4. If JSON format, verifies valid JSON structure and metadata.
    """
    p = Path(filepath)
    if not p.exists():
        raise FileNotFoundError(f"Backup archive not found: {p}")

    size_bytes = p.stat().st_size
    if size_bytes == 0:
        raise ValueError(f"Backup archive is empty: {p}")

    actual_hash = calculate_sha256(p)

    # Check companion .sha256
    csum_file = p.with_name(f"{p.name}.sha256")
    expected_hash = None
    if csum_file.exists():
        expected_line = csum_file.read_text(encoding="utf-8").strip()
        expected_hash = expected_line.split()[0]
        if actual_hash.lower() != expected_hash.lower():
            raise ValueError(
                f"Checksum mismatch for {p.name}! Expected {expected_hash}, got {actual_hash}"
            )

    # Verify stream decompression and format
    is_gz = p.suffix == ".gz"
    payload_content: Optional[bytes] = None

    if is_gz:
        try:
            with gzip.open(p, "rb") as gz:
                payload_content = gz.read()
        except Exception as e:
            raise ValueError(f"Failed to decompress gzip archive {p.name}: {e}") from e
    else:
        with open(p, "rb") as f:
            payload_content = f.read()

    # If payload is JSON, verify JSON decoding
    is_json = False
    json_meta: Dict[str, Any] = {}
    try:
        data = json.loads(payload_content.decode("utf-8"))
        if isinstance(data, dict):
            is_json = True
            json_meta = {
                "timestamp": data.get("metadata", {}).get("timestamp"),
                "table_counts": {k: len(v) for k, v in data.get("tables", {}).items() if isinstance(v, list)},
            }
    except Exception:
        # Might be plain SQL text from pg_dump, which is valid
        pass

    return {
        "valid": True,
        "filename": p.name,
        "size_bytes": size_bytes,
        "sha256": actual_hash,
        "checksum_verified": expected_hash is not None,
        "is_gzip": is_gz,
        "is_json": is_json,
        "metadata": json_meta,
    }


def serialize_entity(obj: Any) -> Any:
    """Helper to serialize dataclasses or dict-like objects to primitive types."""
    if is_dataclass(obj):
        return asdict(obj)
    if isinstance(obj, dict):
        return {k: serialize_entity(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize_entity(v) for v in obj]
    return obj


def export_state_store(
    store: StateStore,
    output_path: Path,
    compress: bool = True,
) -> Dict[str, Any]:
    """
    Exports StateStore virtual simulator memory to JSON backup with full integer paise fidelity.
    """
    timestamp = datetime.now(timezone.utc).isoformat()

    # Collect tables
    wallets_list = [serialize_entity(w) for w in store.wallets.values()]
    holdings_list = [serialize_entity(h) for h in store.holdings.values()]
    orders_list = [serialize_entity(o) for o in store.orders.values()]
    ledger_list = [serialize_entity(l) for l in store.ledger]
    snapshots_list = [serialize_entity(s) for s in store.snapshots]
    profiles_list = [serialize_entity(p) for p in store.profiles.values()]
    watchlists_dict = {uid: dict(wl) for uid, wl in store.watchlists.items()}

    backup_payload = {
        "metadata": {
            "version": "1.0",
            "system": "Mudra Virtual Stock Simulator",
            "timestamp": timestamp,
            "format": "statestore_json",
        },
        "tables": {
            "wallets": wallets_list,
            "holdings": holdings_list,
            "orders": orders_list,
            "ledger": ledger_list,
            "snapshots": snapshots_list,
            "profiles": profiles_list,
            "watchlists": watchlists_dict,
        },
        "stats": {
            "wallets_count": len(wallets_list),
            "holdings_count": len(holdings_list),
            "orders_count": len(orders_list),
            "ledger_count": len(ledger_list),
            "snapshots_count": len(snapshots_list),
            "profiles_count": len(profiles_list),
            "watchlist_users_count": len(watchlists_dict),
        },
    }

    raw_json = json.dumps(backup_payload, indent=2).encode("utf-8")

    if compress:
        if not output_path.name.endswith(".gz"):
            output_path = output_path.with_name(f"{output_path.name}.gz")
        with gzip.open(output_path, "wb") as gz_out:
            gz_out.write(raw_json)
    else:
        with open(output_path, "wb") as f_out:
            f_out.write(raw_json)

    sha256_hash = calculate_sha256(output_path)
    write_checksum_file(output_path, sha256_hash)

    size_bytes = output_path.stat().st_size
    logger.info(
        f"[BACKUP] StateStore backup created: {output_path.name} "
        f"({size_bytes} bytes, SHA256: {sha256_hash[:16]}...)"
    )

    return {
        "type": "state_store",
        "file": str(output_path),
        "filename": output_path.name,
        "size_bytes": size_bytes,
        "sha256": sha256_hash,
        "counts": backup_payload["stats"],
        "timestamp": timestamp,
    }


def dump_postgresql(
    db_url: str,
    output_path: Path,
    backup_type: str = "full",
    compress: bool = True,
) -> Dict[str, Any]:
    """
    Executes PostgreSQL `pg_dump` with clean portability flags.
    """
    pg_dump_cmd = shutil.which("pg_dump")
    if not pg_dump_cmd:
        raise RuntimeError("PostgreSQL client executable 'pg_dump' not found in PATH.")

    cmd = [
        pg_dump_cmd,
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "--dbname",
        db_url,
    ]

    if backup_type == "schema_only":
        cmd.append("--schema-only")
    elif backup_type == "data_only":
        cmd.append("--data-only")

    logger.info(f"[BACKUP] Running pg_dump (type={backup_type})...")

    # Run pg_dump subprocess
    process = subprocess.run(
        cmd,
        capture_output=True,
        check=False,
    )

    if process.returncode != 0:
        err_msg = process.stderr.decode("utf-8", errors="replace")
        raise RuntimeError(f"pg_dump failed with code {process.returncode}: {err_msg}")

    sql_output = process.stdout

    if compress:
        if not output_path.name.endswith(".gz"):
            output_path = output_path.with_name(f"{output_path.name}.gz")
        with gzip.open(output_path, "wb") as gz_out:
            gz_out.write(sql_output)
    else:
        with open(output_path, "wb") as f_out:
            f_out.write(sql_output)

    sha256_hash = calculate_sha256(output_path)
    write_checksum_file(output_path, sha256_hash)

    size_bytes = output_path.stat().st_size
    timestamp = datetime.now(timezone.utc).isoformat()

    logger.info(
        f"[BACKUP] PostgreSQL dump created: {output_path.name} "
        f"({size_bytes} bytes, SHA256: {sha256_hash[:16]}...)"
    )

    return {
        "type": "postgresql_pg_dump",
        "file": str(output_path),
        "filename": output_path.name,
        "size_bytes": size_bytes,
        "sha256": sha256_hash,
        "timestamp": timestamp,
    }


def run_backup(
    output_dir: str = "backups",
    backup_type: str = "full",
    db_url: Optional[str] = None,
    compress: bool = True,
    state_store: Optional[StateStore] = None,
) -> List[Dict[str, Any]]:
    """
    Orchestrates backup execution:
    - If live PostgreSQL database is accessible, executes pg_dump.
    - Exports StateStore virtual simulator memory snapshot.
    """
    out_dir_path = Path(output_dir)
    out_dir_path.mkdir(parents=True, exist_ok=True)

    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    results: List[Dict[str, Any]] = []

    # Check for DB URL in argument or environment
    resolved_db_url = db_url or os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")

    # 1. PostgreSQL dump (if DB URL provided and type is full/schema_only/data_only)
    if resolved_db_url and backup_type in ("full", "schema_only", "data_only"):
        pg_target = out_dir_path / f"mudra_pg_{backup_type}_{timestamp_str}.sql"
        try:
            pg_res = dump_postgresql(
                db_url=resolved_db_url,
                output_path=pg_target,
                backup_type=backup_type,
                compress=compress,
            )
            results.append(pg_res)
        except Exception as e:
            logger.warning(f"[BACKUP] PostgreSQL dump skipped or failed: {e}")

    # 2. StateStore snapshot (if backup_type is full or state, or if no PG dump succeeded)
    if backup_type in ("full", "state") or not results:
        store = state_store or get_state_store()
        state_target = out_dir_path / f"mudra_state_{timestamp_str}.json"
        state_res = export_state_store(
            store=store,
            output_path=state_target,
            compress=compress,
        )
        results.append(state_res)

    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Mudra Automated Database & State Backup Utility")
    parser.add_argument("--output-dir", default="backups", help="Destination directory for backups (default: backups)")
    parser.add_argument(
        "--type",
        choices=["full", "schema_only", "data_only", "state"],
        default="full",
        help="Backup type: full, schema_only, data_only, or state (default: full)",
    )
    parser.add_argument("--db-url", default=None, help="PostgreSQL connection string (defaults to DATABASE_URL)")
    parser.add_argument("--compress", action="store_true", default=True, help="Enable gzip compression (default: true)")
    parser.add_argument("--no-compress", dest="compress", action="store_false", help="Disable gzip compression")
    parser.add_argument("--validate", default=None, help="Path to backup archive to validate")

    args = parser.parse_args()

    if args.validate:
        try:
            info = verify_backup_archive(args.validate)
            print(f"[OK] Backup verified successfully: {info['filename']}")
            print(f"     Size: {info['size_bytes']} bytes")
            print(f"     SHA256: {info['sha256']}")
            if info["is_json"]:
                print(f"     Table Counts: {info['metadata'].get('table_counts')}")
            sys.exit(0)
        except Exception as e:
            print(f"[ERROR] Backup verification failed: {e}", file=sys.stderr)
            sys.exit(1)

    print(f"[BACKUP] Starting Mudra backup (type={args.type}, compress={args.compress})...")
    summaries = run_backup(
        output_dir=args.output_dir,
        backup_type=args.type,
        db_url=args.db_url,
        compress=args.compress,
    )

    print(f"[OK] Generated {len(summaries)} backup artifact(s):")
    for s in summaries:
        print(f"     - {s['filename']} ({s['size_bytes']} bytes) [SHA256: {s['sha256'][:16]}...]")


if __name__ == "__main__":
    main()
