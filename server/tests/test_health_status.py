"""
Pytest Test Suite: System Status, Health Liveness Probe & Uptime Monitor
Conformance: Phase 4 Plan 4.3 (Health monitor and uptime check)
PRD FR-48 (Status endpoint) & Operational Reliability
"""

from pathlib import Path
import subprocess
import sys
from fastapi.testclient import TestClient

from app.scripts.healthcheck import check_endpoint, run_healthcheck


def test_status_endpoint_contract(client: TestClient):
    """
    Verifies that GET /api/status satisfies both the frozen backwards-compatible
    contract (prices_as_of, state, market_open) and extended observability metrics.
    """
    response = client.get("/api/status")
    assert response.status_code == 200

    data = response.json()

    # 1. Backwards-compatible contract invariants
    assert "prices_as_of" in data
    assert isinstance(data["prices_as_of"], str)
    assert "state" in data
    assert data["state"] in ("FRESH", "DELAYED", "OUTDATED")
    assert "market_open" in data
    assert isinstance(data["market_open"], bool)

    # 2. Extended diagnostic & observability metrics
    assert data["status"] == "ok"
    assert data["version"] == "0.2.0"
    assert isinstance(data["uptime_seconds"], (int, float))
    assert data["uptime_seconds"] >= 0.0
    assert "timestamp" in data
    assert "database" in data
    assert data["database"]["status"] == "connected"
    assert "components" in data
    assert "market_adapter" in data["components"]
    assert "state_store" in data["components"]


def test_health_liveness_probe(client: TestClient):
    """
    Verifies lightweight liveness probe GET /api/health returns 200 OK fast.
    """
    response = client.get("/api/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.2.0"
    assert "timestamp" in data


def test_healthcheck_unreachable_endpoint():
    """
    Verifies that healthcheck script handles unreachable endpoints gracefully
    and reports DEGRADED status without crashing.
    """
    # Point to an unused local port
    result = run_healthcheck(base_url="http://127.0.0.1:59123", timeout=0.5, max_latency_ms=1000.0)

    assert result["overall_status"] == "DEGRADED"
    assert result["is_alive"] is False
    assert result["is_status_ok"] is False
    assert result["endpoints"]["health"]["healthy"] is False
    assert result["endpoints"]["health"]["error"] is not None


def test_healthcheck_cli_unreachable_exit_code():
    """
    Executes healthcheck.py CLI against an unreachable port and verifies exit code 1.
    """
    cmd = [
        sys.executable,
        "-m",
        "app.scripts.healthcheck",
        "--url",
        "http://127.0.0.1:59123",
        "--timeout",
        "0.5",
    ]
    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=str(Path(__file__).parents[1]),
    )
    assert proc.returncode == 1
    assert "[FAIL] Liveness probe" in proc.stdout
    assert "[ERROR] Overall Health: DEGRADED" in proc.stdout
