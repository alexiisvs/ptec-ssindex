from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query

from sscatfacts.api.dependencies import CurrentUserId, FactServiceDependency
from sscatfacts.api.schemas import FactResponse, PageResponse, fact_response

router = APIRouter(tags=["facts"])

Page = Annotated[int, Query(ge=1)]
PageSize = Annotated[int, Query(ge=1, le=100)]


@router.get("/facts/random", response_model=FactResponse)
async def random_fact(
    user_id: CurrentUserId,
    service: FactServiceDependency,
) -> FactResponse:
    return fact_response(await service.random_fact(user_id))


@router.put("/facts/{fact_id}/like", response_model=FactResponse)
async def like_fact(
    fact_id: UUID,
    user_id: CurrentUserId,
    service: FactServiceDependency,
) -> FactResponse:
    return fact_response(await service.like(fact_id, user_id))


@router.delete("/facts/{fact_id}/like", response_model=FactResponse)
async def unlike_fact(
    fact_id: UUID,
    user_id: CurrentUserId,
    service: FactServiceDependency,
) -> FactResponse:
    return fact_response(await service.unlike(fact_id, user_id))


@router.get("/me/likes", response_model=PageResponse[FactResponse])
async def user_likes(
    user_id: CurrentUserId,
    service: FactServiceDependency,
    page: Page = 1,
    page_size: PageSize = 20,
) -> PageResponse[FactResponse]:
    result = await service.user_likes(user_id, page=page, page_size=page_size)
    return PageResponse(
        items=[fact_response(item) for item in result.items],
        total=result.total,
        page=page,
        page_size=page_size,
    )


@router.get("/facts/popular", response_model=PageResponse[FactResponse])
async def popular_facts(
    user_id: CurrentUserId,
    service: FactServiceDependency,
    page: Page = 1,
    page_size: PageSize = 20,
) -> PageResponse[FactResponse]:
    result = await service.popular(user_id, page=page, page_size=page_size)
    return PageResponse(
        items=[fact_response(item) for item in result.items],
        total=result.total,
        page=page,
        page_size=page_size,
    )
