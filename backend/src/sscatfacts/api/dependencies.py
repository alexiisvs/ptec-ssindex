from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from sscatfacts.application.services import FactService, UserService
from sscatfacts.domain.errors import AuthenticationRequiredError
from sscatfacts.infrastructure.cat_facts import CatFactsClient
from sscatfacts.infrastructure.config import get_settings
from sscatfacts.infrastructure.database import get_session
from sscatfacts.infrastructure.repositories import (
    SqlAlchemyFactRepository,
    SqlAlchemyUserRepository,
)

Session = Annotated[AsyncSession, Depends(get_session)]


async def get_current_user_id(
    x_user_id: Annotated[str | None, Header(alias="X-User-ID")] = None,
) -> UUID:
    if x_user_id is None:
        raise AuthenticationRequiredError()
    try:
        return UUID(x_user_id)
    except ValueError as error:
        raise AuthenticationRequiredError(details={"header": "X-User-ID"}) from error


CurrentUserId = Annotated[UUID, Depends(get_current_user_id)]


async def get_user_service(session: Session) -> UserService:
    return UserService(SqlAlchemyUserRepository(session))


async def get_fact_service(session: Session) -> FactService:
    settings = get_settings()
    users = SqlAlchemyUserRepository(session)
    facts = SqlAlchemyFactRepository(session)
    cat_facts = CatFactsClient(
        settings.cat_fact_url,
        timeout_seconds=settings.cat_fact_timeout_seconds,
        max_retries=settings.cat_fact_max_retries,
    )
    return FactService(users, facts, cat_facts)


UserServiceDependency = Annotated[UserService, Depends(get_user_service)]
FactServiceDependency = Annotated[FactService, Depends(get_fact_service)]
