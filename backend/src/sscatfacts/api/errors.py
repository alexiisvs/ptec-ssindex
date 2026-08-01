import logging
from collections.abc import Awaitable, Callable
from typing import cast
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.responses import Response

from sscatfacts.domain.errors import DomainError

logger = logging.getLogger(__name__)

ERROR_STATUS = {
    "authentication_required": 401,
    "invalid_access_token": 401,
    "authentication_unavailable": 503,
    "user_not_found": 404,
    "fact_not_found": 404,
    "username_taken": 409,
    "upstream_unavailable": 503,
    "database_unavailable": 503,
}


def request_id(request: Request) -> str:
    return cast(str, getattr(request.state, "request_id", str(uuid4())))


def error_response(
    request: Request,
    *,
    status_code: int,
    code: str,
    message: str,
    details: object,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(
            {
                "code": code,
                "message": message,
                "request_id": request_id(request),
                "details": details,
            }
        ),
    )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(request: Request, exception: DomainError) -> JSONResponse:
        return error_response(
            request,
            status_code=ERROR_STATUS.get(exception.code, 400),
            code=exception.code,
            message=exception.message,
            details=exception.details,
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exception: RequestValidationError
    ) -> JSONResponse:
        return error_response(
            request,
            status_code=422,
            code="validation_error",
            message="Request validation failed",
            details=exception.errors(),
        )

    @app.exception_handler(HTTPException)
    async def handle_http_error(request: Request, exception: HTTPException) -> JSONResponse:
        return error_response(
            request,
            status_code=exception.status_code,
            code="http_error",
            message=str(exception.detail),
            details={},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exception: Exception) -> JSONResponse:
        logger.exception("Unhandled request error", exc_info=exception)
        return error_response(
            request,
            status_code=500,
            code="internal_error",
            message="An unexpected error occurred",
            details={},
        )


async def request_id_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    request.state.request_id = request.headers.get("X-Request-ID", str(uuid4()))
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response
