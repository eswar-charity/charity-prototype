import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("app")


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details=None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


def _envelope(code: str, message: str, details=None):
    return {"error": {"code": code, "message": message, "details": details}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(exc.code, exc.message, exc.details),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException):
        code = {404: "not_found", 401: "unauthorized", 403: "forbidden"}.get(
            exc.status_code, "http_error"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(code, str(exc.detail)),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError):
        # Convert errors to serializable format
        errors = []
        for error in exc.errors():
            err_dict = {
                "loc": error.get("loc"),
                "msg": error.get("msg"),
                "type": error.get("type"),
            }
            # Only include ctx if it's present and serializable
            if "ctx" in error and error["ctx"]:
                ctx = error["ctx"]
                # Filter out non-serializable values from ctx
                serializable_ctx = {}
                for k, v in ctx.items():
                    try:
                        import json
                        json.dumps(v)
                        serializable_ctx[k] = v
                    except (TypeError, ValueError):
                        # Skip non-serializable values
                        pass
                if serializable_ctx:
                    err_dict["ctx"] = serializable_ctx
            errors.append(err_dict)
        return JSONResponse(
            status_code=422,
            content=_envelope("validation_error", "Invalid request", errors),
        )

    @app.exception_handler(Exception)
    async def _unhandled_error(_: Request, exc: Exception):
        logger.exception("Unhandled exception", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content=_envelope("internal_error", "Internal server error"),
        )
