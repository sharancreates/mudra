"""
Pytest Test Suite: Database & State Store Backup Utilities
Conformance: Phase 4 Plan 4.2 (Automated weekly database backup workflow)
PRD FR-46 (Audit Trails & Data Integrity)
"""

import gzip
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import pytest

from app.core.state import get_state_store, OrderRecord, UserHolding, UserWallet, LedgerEntry
from app.scripts.backup import (
    calculate_sha256,
    export_state_store,
    verify_backup_archive,
    run_backup,
    write_checksum_file,
)


def test_backup_statestore_export():
    """
    Verifies that export_state_store generates a valid gzip-compressed archive,
    preserves exact integer paise values, and writes matching SHA256 checksums.
    """
    store = get_state_store()
    store.reset()

    # Seed test entities
    w = store.get_or_create_wallet("usr_bkp_1")
    w.cash_paise = 9500000
    w.reserved_paise = 500000

    store.holdings[("usr_bkp_1", "RELIANCE")] = UserHolding(
        user_id="usr_bkp_1",
        symbol="RELIANCE",
        qty=5,
        reserved_qty=0,
        cost_basis_paise=285000,
    )

    store.orders["ord_bkp_1"] = OrderRecord(
        order_id="ord_bkp_1",
        user_id="usr_bkp_1",
        symbol="RELIANCE",
        side="BUY",
        qty=5,
        status="FILLED",
        reserved_paise=0,
        target_trade_date="2026-10-10",
        client_order_id="c_bkp_1",
    )

    store.ledger.append(
        LedgerEntry(
            entry_id="led_bkp_1",
            user_id="usr_bkp_1",
            entry_type="ORDER_FILL_BUY",
            cash_delta_paise=-1425000,
            balance_after_paise=8575000,
        )
    )

    store.get_or_create_profile("usr_bkp_1", "Backup Tester")
    store.add_to_watchlist("usr_bkp_1", "TCS")

    with tempfile.TemporaryDirectory() as tmpdir:
        out_file = Path(tmpdir) / "test_state_backup.json"
        res = export_state_store(store, out_file, compress=True)

        assert res["type"] == "state_store"
        assert res["size_bytes"] > 0
        assert len(res["sha256"]) == 64

        gz_path = Path(res["file"])
        assert gz_path.exists()
        assert gz_path.name.endswith(".json.gz")

        # Verify companion .sha256 file
        csum_path = gz_path.with_name(f"{gz_path.name}.sha256")
        assert csum_path.exists()
        assert res["sha256"] in csum_path.read_text(encoding="utf-8")

        # Decompress and verify JSON payload
        with gzip.open(gz_path, "rt", encoding="utf-8") as f:
            data = json.load(f)

        assert data["metadata"]["version"] == "1.0"
        assert data["metadata"]["system"] == "Mudra Virtual Stock Simulator"
        assert len(data["tables"]["wallets"]) == 1
        assert data["tables"]["wallets"][0]["cash_paise"] == 9500000
        assert data["tables"]["wallets"][0]["reserved_paise"] == 500000
        assert len(data["tables"]["holdings"]) == 1
        assert data["tables"]["holdings"][0]["symbol"] == "RELIANCE"
        assert len(data["tables"]["orders"]) == 1
        assert len(data["tables"]["ledger"]) >= 1
        assert "usr_bkp_1" in data["tables"]["watchlists"]


def test_backup_integrity_verification():
    """
    Empirically verifies that verify_backup_archive validates healthy archives
    and detects corrupted archives or mismatched checksums.
    """
    store = get_state_store()
    store.reset()
    store.get_or_create_wallet("usr_audit")

    with tempfile.TemporaryDirectory() as tmpdir:
        target = Path(tmpdir) / "mudra_audit.json"
        res = export_state_store(store, target, compress=True)
        archive_path = Path(res["file"])

        # 1. Healthy archive verification
        info = verify_backup_archive(archive_path)
        assert info["valid"] is True
        assert info["checksum_verified"] is True
        assert info["sha256"] == res["sha256"]
        assert info["is_gzip"] is True

        # 2. Corrupted checksum file
        csum_path = archive_path.with_name(f"{archive_path.name}.sha256")
        csum_path.write_text("0000000000000000000000000000000000000000000000000000000000000000  bad.gz\n", encoding="utf-8")
        with pytest.raises(ValueError, match="Checksum mismatch"):
            verify_backup_archive(archive_path)

        # 3. Corrupted gzip binary data
        archive_path.write_bytes(b"CORRUPTED_NOT_A_VALID_GZIP_STREAM")
        # Remove checksum file so it checks gzip stream decompression
        csum_path.unlink()
        with pytest.raises(ValueError, match="Failed to decompress"):
            verify_backup_archive(archive_path)


def test_backup_cli_execution():
    """
    Executes backup.py as a CLI module and verifies output artifacts and exit codes.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        # Run backup generation
        cmd = [
            sys.executable,
            "-m",
            "app.scripts.backup",
            "--output-dir",
            tmpdir,
            "--type",
            "state",
            "--compress",
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(Path(__file__).parents[1]))
        assert proc.returncode == 0, f"CLI backup failed: {proc.stderr}"
        assert "[BACKUP] Starting Mudra backup" in proc.stdout
        assert "[OK] Generated 1 backup artifact(s)" in proc.stdout

        # Find generated .gz
        gz_files = list(Path(tmpdir).glob("*.gz"))
        assert len(gz_files) == 1
        generated_file = gz_files[0]

        # Run CLI validate
        val_cmd = [
            sys.executable,
            "-m",
            "app.scripts.backup",
            "--validate",
            str(generated_file),
        ]
        val_proc = subprocess.run(val_cmd, capture_output=True, text=True, cwd=str(Path(__file__).parents[1]))
        assert val_proc.returncode == 0, f"Validation failed: {val_proc.stderr}"
        assert "[OK] Backup verified successfully" in val_proc.stdout


def test_backup_uncompressed_mode():
    """
    Tests raw uncompressed JSON backup creation and validation.
    """
    store = get_state_store()
    store.reset()

    with tempfile.TemporaryDirectory() as tmpdir:
        out_file = Path(tmpdir) / "raw_backup.json"
        res = export_state_store(store, out_file, compress=False)

        raw_path = Path(res["file"])
        assert raw_path.exists()
        assert raw_path.suffix == ".json"

        info = verify_backup_archive(raw_path)
        assert info["valid"] is True
        assert info["is_gzip"] is False
        assert info["is_json"] is True
