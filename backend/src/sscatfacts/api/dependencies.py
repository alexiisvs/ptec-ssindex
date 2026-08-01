from functools import lru_cache
from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from sscatfacts.application.services import FactService, UserService
from sscatfacts.domain.auth import AccessTokenVerifier
from sscatfacts.domain.errors import (
    AuthenticationRequiredError,
    AuthenticationUnavailableError,
)
from sscatfacts.infrastructure.auth import SupabaseAccessTokenVerifier
from sscatfacts.infrastructure.cat_facts import CatFactsClient
from sscatfacts.infrastructure.config import get_settings
from sscatfacts.infrastructure.database import get_session
from sscatfacts.infrastructure.repositories import (
    SqlAlchemyFactRepository,
    SqlAlchemyUserRepository,
)

Session = Annotated[AsyncSession, Depends(get_session)]
bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def _token_verifier(
    supabase_url: str,
    anon_key: str,
    audience: str,
    jwks_cache_seconds: int,
) -> AccessTokenVerifier:
    return SupabaseAccessTokenVerifier(
        supabase_url,
        anon_key=anon_key,
        audience=audience,
        jwks_cache_seconds=jwks_cache_seconds,
    )


def get_token_verifier() -> AccessTokenVerifier:
    settings = get_settings()
    if not settings.supabase_url:
        raise AuthenticationUnavailableError()
    return _token_verifier(
        settings.supabase_url,
        settings.supabase_anon_key,
        settings.supabase_jwt_audience,
        settings.supabase_jwks_cache_seconds,
    )


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)] = None,
) -> UUID:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthenticationRequiredError()
    authenticated_user = await get_token_verifier().verify(credentials.credentials)
    return authenticated_user.id


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
