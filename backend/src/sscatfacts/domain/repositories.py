from typing import Protocol
from uuid import UUID

from sscatfacts.domain.entities import Fact, FactView, PageResult, User


class UserRepository(Protocol):
    async def username_exists(
        self, username: str, *, exclude_user_id: UUID | None = None
    ) -> bool: ...

    async def get_by_id(self, user_id: UUID) -> User | None: ...

    async def save_profile(self, user_id: UUID, username: str) -> User: ...


class FactRepository(Protocol):
    async def get_or_create(self, fact: Fact) -> Fact: ...

    async def get_random(self) -> Fact | None: ...

    async def get_view(self, fact_id: UUID, user_id: UUID) -> FactView | None: ...

    async def add_like(self, fact_id: UUID, user_id: UUID) -> None: ...

    async def remove_like(self, fact_id: UUID, user_id: UUID) -> None: ...

    async def list_user_likes(
        self, user_id: UUID, *, offset: int, limit: int
    ) -> PageResult[FactView]: ...

    async def list_popular(
        self, user_id: UUID, *, offset: int, limit: int
    ) -> PageResult[FactView]: ...


class CatFactGateway(Protocol):
    async def fetch_fact(self) -> str: ...
