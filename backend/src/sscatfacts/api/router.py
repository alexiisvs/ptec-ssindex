from fastapi import APIRouter

from sscatfacts.api.routers import facts, health, users

api_router = APIRouter()
api_router.include_router(users.router, prefix="/api/v1")
api_router.include_router(facts.router, prefix="/api/v1")
api_router.include_router(health.router)
