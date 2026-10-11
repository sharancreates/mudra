"""
Mudra Virtual Trading API — FastAPI Application
Equipped with Systematic Debugging by Default
"""

import secrets
import time
import traceback
from typing import Any, Dict

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.core.logger import get_logger, request_id_ctx
from app.api.routes_status import router as status_router
from app.api.routes_instruments import router as instruments_router
from app.api.routes_orders import router as orders_router

logger = get_logger("app.main")
settings = get_settings()

app = FastAPI(
    title="Mudra Virtual Trading API",
    version="0.2.0",
    description="FastAPI backend for Mudra NSE/BSE stock market simulator",
    debug=settings.DEBUG,
)

# 1. CORS Middleware (allows Next.js frontend on port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. Debug Request Logging & Context Middleware
@app.middleware("http")
async def debug_logging_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or f"req_{secrets.token_hex(4)}"
    token = request_id_ctx.set(req_id)
    start_time = time.perf_counter()

    query_params = str(request.query_params)
    query_str = f"?{query_params}" if query_params else ""
    logger.debug(f"--> Inbound: {request.method} {request.url.path}{query_str}")

    try:
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.debug(f"<-- Outbound: {response.status_code} in {duration_ms:.2f}ms")
        response.headers["X-Request-ID"] = req_id
        return response
    except Exception as exc:
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.error(f"<-- Exception: {exc} in {duration_ms:.2f}ms\n{traceback.format_exc()}")
        raise
    finally:
        request_id_ctx.reset(token)


# 3. Standardized Error Exception Handlers matching docs/api.md
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    req_id = request_id_ctx.get() or f"req_{secrets.token_hex(4)}"

    if isinstance(exc.detail, dict) and "code" in exc.detail:
        payload = {"error": exc.detail}
        if "request_id" not in payload["error"]:
            payload["error"]["request_id"] = req_id
    else:
        code = "not_found" if exc.status_code == 404 else "bad_request"
        payload = {
            "error": {
                "code": code,
                "message": str(exc.detail),
                "request_id": req_id,
            }
        }

    return JSONResponse(
        status_code=exc.status_code,
        content=payload,
        headers={"X-Request-ID": req_id},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = request_id_ctx.get() or f"req_{secrets.token_hex(4)}"
    first_error = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(loc) for loc in first_error.get("loc", []))
    msg = first_error.get("msg", "Invalid parameter")

    code = "bad_request"
    if "qty" in field.lower():
        code = "bad_quantity"
    elif "side" in field.lower():
        code = "bad_side"

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": code,
                "message": f"Validation error on {field}: {msg}",
                "request_id": req_id,
            }
        },
        headers={"X-Request-ID": req_id},
    )


@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    req_id = request_id_ctx.get() or f"req_{secrets.token_hex(4)}"
    logger.error(f"Unhandled server error: {exc}\n{traceback.format_exc()}")

    detail_info = traceback.format_exc() if settings.DEBUG else None
    error_dict: Dict[str, Any] = {
        "code": "server_error",
        "message": str(exc) or "Internal server error",
        "request_id": req_id,
    }
    if detail_info:
        error_dict["detail"] = detail_info

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": error_dict},
        headers={"X-Request-ID": req_id},
    )


from app.api.routes_settlement import router as settlement_router

# 4. Include Routers
app.include_router(status_router)
app.include_router(instruments_router)
app.include_router(orders_router)
app.include_router(settlement_router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "Mudra Virtual Trading API",
        "status": "running",
        "version": "0.2.0",
        "debug": settings.DEBUG,
    }
