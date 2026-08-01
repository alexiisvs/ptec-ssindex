from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sscatfacts.api.errors import register_error_handlers, request_id_middleware
from sscatfacts.api.router import api_router
from sscatfacts.infrastructure.config import get_settings
from sscatfacts.infrastructure.database import engine


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title="SSCatFacts API",
        version="0.1.0",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.middleware("http")(request_id_middleware)
    register_error_handlers(application)
    application.include_router(api_router)
    return application


app = create_app()
