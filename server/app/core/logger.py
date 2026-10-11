import logging
import sys
from datetime import datetime, timezone
from contextvars import ContextVar
from typing import Optional

# Context variable to track active request_id in log messages
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id_ctx", default=None)


class DebugLogFormatter(logging.Formatter):
    """
    Structured formatter including ISO-8601 UTC timestamp, level, request_id, logger name, and message.
    """

    def format(self, record: logging.LogRecord) -> str:
        req_id = request_id_ctx.get()
        req_tag = f"[{req_id}]" if req_id else "[-]"
        timestamp = datetime.now(timezone.utc).isoformat()
        levelname = f"{record.levelname:<5}"
        return f"{timestamp} {levelname} {req_tag} {record.name}: {record.getMessage()}"


def setup_logging(log_level: str = "DEBUG") -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level.upper())

    # Avoid duplicate handlers if already initialized
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(DebugLogFormatter())
        root_logger.addHandler(handler)
    else:
        for handler in root_logger.handlers:
            handler.setFormatter(DebugLogFormatter())


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


# Initialize default debug logging
setup_logging("DEBUG")
