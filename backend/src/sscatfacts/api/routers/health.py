from fastapi import APIRouter

from sscatfacts.domain.errors import DatabaseUnavailableError
from sscatfacts.infrastructure.database import database_is_ready

router = APIRouter(tags=["health"])


@router.get("/health/live")
async def live_health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/ready")
async def ready_health() -> dict[str, str]:
    if not await database_is_ready():
        raise DatabaseUnavailableError()
    return {"status": "ok"}
