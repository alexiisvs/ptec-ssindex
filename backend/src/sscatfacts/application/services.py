from dataclasses import replace
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sscatfacts.domain.entities import Fact, FactView, PageResult, User
from sscatfacts.domain.errors import (
    CatFactsGatewayError,
    FactNotFoundError,
    UpstreamUnavailableError,
    UserNotFoundError,
)
from sscatfacts.domain.facts import fact_content_hash, normalize_fact_text
from sscatfacts.domain.repositories import CatFactGateway, FactRepository, UserRepository


class UserService:
    def __init__(self, users: UserRepository) -> None:
        self.users = users

    async def username_availability(self, username: str) -> bool:
        return not await self.users.username_exists(username)

    async def get_profile(self, user_id: UUID) -> User:
        user = await self.users.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError()
        return user

    async def save_profile(self, user_id: UUID, username: str) -> User:
        return await self.users.save_profile(user_id, username)


class FactService:
    def __init__(
        self,
        users: UserRepository,
        facts: FactRepository,
        cat_facts: CatFactGateway,
    ) -> None:
        self.users = users
        self.facts = facts
        self.cat_facts = cat_facts

    async def _ensure_user(self, user_id: UUID) -> None:
        if await self.users.get_by_id(user_id) is None:
            raise UserNotFoundError()

    async def random_fact(self, user_id: UUID) -> FactView:
        await self._ensure_user(user_id)

        try:
            text = normalize_fact_text(await self.cat_facts.fetch_fact())
            if not text:
                raise CatFactsGatewayError
        except CatFactsGatewayError:
            cached_fact = await self.facts.get_random()
            if cached_fact is None:
                raise UpstreamUnavailableError() from None
            view = await self.facts.get_view(cached_fact.id, user_id)
            if view is None:
                raise FactNotFoundError() from None
            return replace(view, cached=True)

        fact = Fact(
            id=uuid4(),
            text=text,
            content_hash=fact_content_hash(text),
            length=len(text),
            source="catfact.ninja",
            created_at=datetime.now(UTC),
        )
        persisted = await self.facts.get_or_create(fact)
        view = await self.facts.get_view(persisted.id, user_id)
        if view is None:
            raise FactNotFoundError()
        return view

    async def like(self, fact_id: UUID, user_id: UUID) -> FactView:
        await self._ensure_user(user_id)
        if await self.facts.get_view(fact_id, user_id) is None:
            raise FactNotFoundError()
        await self.facts.add_like(fact_id, user_id)
        view = await self.facts.get_view(fact_id, user_id)
        if view is None:
            raise FactNotFoundError()
        return view

    async def unlike(self, fact_id: UUID, user_id: UUID) -> FactView:
        await self._ensure_user(user_id)
        if await self.facts.get_view(fact_id, user_id) is None:
            raise FactNotFoundError()
        await self.facts.remove_like(fact_id, user_id)
        view = await self.facts.get_view(fact_id, user_id)
        if view is None:
            raise FactNotFoundError()
        return view

    async def user_likes(self, user_id: UUID, *, page: int, page_size: int) -> PageResult[FactView]:
        await self._ensure_user(user_id)
        return await self.facts.list_user_likes(
            user_id, offset=(page - 1) * page_size, limit=page_size
        )

    async def popular(self, user_id: UUID, *, page: int, page_size: int) -> PageResult[FactView]:
        await self._ensure_user(user_id)
        return await self.facts.list_popular(
            user_id, offset=(page - 1) * page_size, limit=page_size
        )
