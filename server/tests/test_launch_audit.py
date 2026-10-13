"""
Pytest Test Suite: PRD Section 15.1 Launch Checklist & "No Real Money" Statutory Audit
Conformance: PRD Section 15.1, Section 15.2, Milestone M2 Launch Readiness
"""

import json
from pathlib import Path
import subprocess
import sys
import tempfile

from app.scripts.launch_audit import (
    run_launch_audit,
    scan_files_for_patterns,
    FORBIDDEN_GATEWAY_PATTERNS,
    FORBIDDEN_RESET_PATTERNS,
)


def test_launch_audit_active_repo_clean_pass():
    """
    Verifies that running the automated pre-launch audit against the active repository
    achieves a 100% clean PASS across all 5 Section 15.1 pillars.
    """
    repo_root = Path(__file__).resolve().parents[2]
    results = run_launch_audit(repo_root)

    assert results["verdict"] == "PASSED", f"Pre-launch audit failed: {results}"
    assert results["summary"]["total_pillars"] == 5
    assert results["summary"]["passed_pillars"] == 5
    assert results["summary"]["failed_pillars"] == 0

    for pillar in results["pillars"]:
        assert pillar["passed"] is True, f"Pillar failed: {pillar['pillar']}"


def test_launch_audit_detects_forbidden_payment_gateway():
    """
    Empirically verifies that injecting a forbidden payment gateway token
    into source code is detected by the auditor and triggers a violation.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        mock_file = Path(tmpdir) / "checkout.ts"
        mock_file.write_text("import { Razorpay } from 'razorpay';\nconst rzp = new Razorpay();\n", encoding="utf-8")

        violations = scan_files_for_patterns(
            root_dir=Path(tmpdir),
            include_exts=[".ts", ".tsx", ".py"],
            patterns=FORBIDDEN_GATEWAY_PATTERNS,
            exclude_dirs=[],
        )

        assert len(violations) >= 1
        assert any("razorpay" in v["matched_pattern"].lower() for v in violations)


def test_launch_audit_detects_wallet_reset_loophole():
    """
    Empirically verifies that introducing a balance reset endpoint
    violates the 'No Reset Rule' and is flagged as a critical loophole.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        mock_file = Path(tmpdir) / "routes_cheat.py"
        mock_file.write_text("def reset_wallet(user_id: str): return {'cash': 10000000}\n", encoding="utf-8")

        violations = scan_files_for_patterns(
            root_dir=Path(tmpdir),
            include_exts=[".py"],
            patterns=FORBIDDEN_RESET_PATTERNS,
            exclude_dirs=[],
        )

        assert len(violations) >= 1
        assert any("reset_wallet" in v["matched_pattern"].lower() for v in violations)


def test_launch_audit_cli_execution():
    """
    Executes launch_audit.py via CLI and verifies machine-readable JSON output and exit code 0.
    """
    server_dir = Path(__file__).resolve().parents[1]
    cmd = [
        sys.executable,
        "-m",
        "app.scripts.launch_audit",
        "--json",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(server_dir))
    assert proc.returncode == 0, f"launch_audit CLI failed: {proc.stderr}"

    data = json.loads(proc.stdout)
    assert data["verdict"] == "PASSED"
    assert data["summary"]["passed_pillars"] == 5
