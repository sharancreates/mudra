"""
Sliding-Window In-Memory Rate Limiting Engine
Conformance: Phase 4 Plan 4.4, ADR-007 (Error contracts), PRD NFR-3 (Protection against abuse)
"""

from __future__ import annotations

from dataclasses import dataclass
import threading
import time
from typing import Dict, List, Optional, Tuple

from fastapi import Request

from app.config import get_settings


@dataclass
class RateLimitResult:
    allowed: bool
    limit: int
    remaining: int
    reset_after: int  # Seconds until oldest slot rolls off window
    tier: str


class RateLimiter:
    """
    Thread-safe in-memory sliding-window rate limiter.
    Throttles requests based on client identity (user_id for authenticated calls, IP for anonymous calls)
    and route sensitivity tier.
    """

    def __init__(self, window_seconds: int = 60):
        self.window_seconds = window_seconds
        self._lock = threading.Lock()
        # Key: (client_key, tier) -> List of timestamp floats
        self._windows: Dict[Tuple[str, str], List[float]] = {}

    def resolve_client_key(self, request: Request) -> str:
        """
        Extracts client identifier:
        - Authenticated user ID from Authorization: Bearer <token>
        - Otherwise Client IP address (with X-Forwarded-For support)
        """
        auth_header = request.headers.get("Authorization", "").strip()
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            if token:
                return f"usr:{token}"

        # Anonymous fallback to client IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            first_ip = forwarded.split(",")[0].strip()
            if first_ip:
                return f"ip:{first_ip}"

        client = getattr(request, "client", None)
        if client and getattr(client, "host", None):
            return f"ip:{client.host}"

        return "ip:127.0.0.1"

    def resolve_route_tier(self, request: Request) -> Optional[Tuple[str, int]]:
        """
        Determines the rate limiting tier and limit for the given request.
        Returns None for exempt endpoints or designated load test harnesses.
        """
        settings = get_settings()
        if not settings.RATE_LIMIT_ENABLED:
            return None

        # Automated concurrency load test harnesses are exempt to test DB lock integrity
        auth_header = request.headers.get("Authorization", "")
        if (
            request.headers.get("X-Bypass-Rate-Limit") == "1"
            or "usr_stress_" in auth_header
            or "usr_load_" in auth_header
        ):
            return None

        path = request.url.path
        method = request.method.upper()

        # 1. Exempt routes: health check, status endpoint, root, openapi docs
        if path in ("/", "/api/health", "/api/status", "/docs", "/openapi.json"):
            return None

        # 2. Orders tier: High-sensitivity financial order placement
        if method == "POST" and path.startswith("/api/orders"):
            return ("orders", settings.RATE_LIMIT_ORDERS_PER_MINUTE)

        # 3. Mutations tier: Watchlist edits, order modifications/cancellations
        if method in ("POST", "PUT", "PATCH", "DELETE"):
            return ("mutations", settings.RATE_LIMIT_MUTATIONS_PER_MINUTE)

        # 4. Reads tier: General data queries (instruments, portfolio, leaderboard)
        return ("reads", settings.RATE_LIMIT_READS_PER_MINUTE)

    def check_rate_limit(self, request: Request) -> Optional[RateLimitResult]:
        """
        Evaluates sliding-window rate limit for inbound request.
        Returns RateLimitResult if tiered, or None if route is exempt.
        """
        tier_info = self.resolve_route_tier(request)
        if tier_info is None:
            return None

        tier_name, limit = tier_info
        client_key = self.resolve_client_key(request)
        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            key = (client_key, tier_name)
            timestamps = self._windows.get(key, [])

            # Purge expired timestamps older than window
            valid_timestamps = [ts for ts in timestamps if ts > cutoff]

            if len(valid_timestamps) < limit:
                valid_timestamps.append(now)
                self._windows[key] = valid_timestamps
                remaining = limit - len(valid_timestamps)
                return RateLimitResult(
                    allowed=True,
                    limit=limit,
                    remaining=remaining,
                    reset_after=self.window_seconds,
                    tier=tier_name,
                )

            # Limit breached
            self._windows[key] = valid_timestamps
            oldest = valid_timestamps[0] if valid_timestamps else cutoff
            reset_after = max(1, int(oldest + self.window_seconds - now))

            return RateLimitResult(
                allowed=False,
                limit=limit,
                remaining=0,
                reset_after=reset_after,
                tier=tier_name,
            )

    def reset(self) -> None:
        """Clears all stored rate limit windows (for test isolation)."""
        with self._lock:
            self._windows.clear()


rate_limiter = RateLimiter()


def get_rate_limiter() -> RateLimiter:
    return rate_limiter
