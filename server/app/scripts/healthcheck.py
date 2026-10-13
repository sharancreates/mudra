"""
Mudra Uptime & Health Monitor CLI Utility (Python 3.10+)
Conformance: Phase 4 Plan 4.3 (Health monitor and uptime check)
PRD FR-48 (Status endpoint) & Operational Reliability

Performs end-to-end health, availability, and latency SLA checks against the Mudra API.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional


def check_endpoint(
    base_url: str,
    endpoint: str,
    timeout: float = 5.0,
) -> Dict[str, Any]:
    """
    Queries a specific HTTP endpoint and measures round-trip latency.
    """
    clean_base = base_url.rstrip("/")
    url = f"{clean_base}{endpoint}"

    start_time = time.perf_counter()
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mudra-Uptime-Monitor/1.0", "Accept": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            status_code = response.getcode()
            body_bytes = response.read()
            body_text = body_bytes.decode("utf-8")
            data = json.loads(body_text) if body_text else {}

            return {
                "endpoint": endpoint,
                "url": url,
                "status_code": status_code,
                "latency_ms": round(latency_ms, 2),
                "healthy": status_code == 200,
                "data": data,
                "error": None,
            }
    except urllib.error.HTTPError as he:
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "endpoint": endpoint,
            "url": url,
            "status_code": he.code,
            "latency_ms": round(latency_ms, 2),
            "healthy": False,
            "data": {},
            "error": f"HTTP {he.code}: {he.reason}",
        }
    except Exception as exc:
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "endpoint": endpoint,
            "url": url,
            "status_code": 0,
            "latency_ms": round(latency_ms, 2),
            "healthy": False,
            "data": {},
            "error": str(exc),
        }


def run_healthcheck(
    base_url: str = "http://127.0.0.1:8000",
    timeout: float = 5.0,
    max_latency_ms: float = 1500.0,
    strict: bool = False,
) -> Dict[str, Any]:
    """
    Runs multi-endpoint health evaluation:
    1. Liveness check: GET /api/health
    2. Deep diagnostic status check: GET /api/status
    """
    health_res = check_endpoint(base_url, "/api/health", timeout=timeout)
    status_res = check_endpoint(base_url, "/api/status", timeout=timeout)

    is_alive = health_res["healthy"]
    is_status_ok = status_res["healthy"]

    health_latency = health_res["latency_ms"]
    status_latency = status_res["latency_ms"]
    total_latency = round(health_latency + status_latency, 2)

    latency_breach = health_latency > max_latency_ms or status_latency > max_latency_ms

    overall_healthy = is_alive and is_status_ok and not latency_breach

    status_data = status_res.get("data", {})
    market_state = status_data.get("state", "UNKNOWN")

    if strict and market_state not in ("FRESH", "DELAYED"):
        overall_healthy = False

    return {
        "overall_status": "HEALTHY" if overall_healthy else "DEGRADED",
        "target_url": base_url,
        "is_alive": is_alive,
        "is_status_ok": is_status_ok,
        "latency_sla_met": not latency_breach,
        "max_latency_ms": max_latency_ms,
        "metrics": {
            "health_latency_ms": health_latency,
            "status_latency_ms": status_latency,
            "total_latency_ms": total_latency,
        },
        "system": {
            "version": status_data.get("version", "0.2.0"),
            "uptime_seconds": status_data.get("uptime_seconds", 0.0),
            "prices_as_of": status_data.get("prices_as_of"),
            "market_open": status_data.get("market_open", False),
            "market_state": market_state,
            "database": status_data.get("database", {}),
            "components": status_data.get("components", {}),
        },
        "endpoints": {
            "health": health_res,
            "status": status_res,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Mudra API Uptime & Health Monitor")
    parser.add_argument(
        "--url",
        default=os.getenv("API_BASE_URL", "http://127.0.0.1:8000"),
        help="Base URL of Mudra API (default: http://127.0.0.1:8000 or $API_BASE_URL)",
    )
    parser.add_argument("--timeout", type=float, default=5.0, help="HTTP timeout in seconds (default: 5.0)")
    parser.add_argument("--max-latency-ms", type=float, default=1500.0, help="Max latency threshold in ms (default: 1500.0)")
    parser.add_argument("--strict", action="store_true", default=False, help="Strict mode: require FRESH market data")
    parser.add_argument("--json", dest="output_json", action="store_true", help="Output raw JSON summary")

    args = parser.parse_args()

    results = run_healthcheck(
        base_url=args.url,
        timeout=args.timeout,
        max_latency_ms=args.max_latency_ms,
        strict=args.strict,
    )

    if args.output_json:
        print(json.dumps(results, indent=2))
        sys.exit(0 if results["overall_status"] == "HEALTHY" else 1)

    print(f"[HEALTHCHECK] Checking Mudra API at: {args.url}")
    print("-" * 60)

    # Liveness output
    h = results["endpoints"]["health"]
    if h["healthy"]:
        print(f"[OK] Liveness probe (/api/health): 200 OK ({h['latency_ms']}ms)")
    else:
        print(f"[FAIL] Liveness probe (/api/health): {h['error']} ({h['latency_ms']}ms)")

    # Status output
    s = results["endpoints"]["status"]
    if s["healthy"]:
        uptime = results["system"]["uptime_seconds"]
        version = results["system"]["version"]
        prices_date = results["system"]["prices_as_of"]
        state = results["system"]["market_state"]
        print(f"[OK] System status (/api/status): 200 OK ({s['latency_ms']}ms)")
        print(f"     Version: {version} | Uptime: {uptime}s | Prices Date: {prices_date} ({state})")
    else:
        print(f"[FAIL] System status (/api/status): {s['error']} ({s['latency_ms']}ms)")

    # Latency check
    if results["latency_sla_met"]:
        print(f"[OK] Latency SLA: PASS (within {args.max_latency_ms}ms threshold)")
    else:
        print(f"[WARN] Latency SLA: BREACH (> {args.max_latency_ms}ms)")

    print("-" * 60)
    if results["overall_status"] == "HEALTHY":
        print("[OK] Overall Health: HEALTHY")
        sys.exit(0)
    else:
        print(f"[ERROR] Overall Health: {results['overall_status']}")
        sys.exit(1)


if __name__ == "__main__":
    main()
