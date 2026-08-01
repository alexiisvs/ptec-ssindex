from uuid import UUID

from sqlalchemy import delete, exists, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.engine import Row
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased
from sqlalchemy.sql import Select

from sscatfacts.domain.entities import Fact, FactView, PageResult, User
from sscatfacts.domain.errors import UsernameTakenError
from sscatfacts.infrastructure.models import FactModel, LikeModel, UserModel


def _user_entity(model: UserModel) -> User:
    return User(
        id=model.id,
        username=model.username,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def _fact_entity(model: FactModel) -> Fact:
    return Fact(
        id=model.id,
        text=model.text,
        content_hash=model.content_hash,
        length=model.length,
        source=model.source,
        created_at=model.created_at,
    )


class SqlAlchemyUserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def username_exists(self, username: str, *, exclude_user_id: UUID | None = None) -> bool:
        statement = select(UserModel.id).where(UserModel.username == username)
        if exclude_user_id is not None:
            statement = statement.where(UserModel.id != exclude_user_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none() is not None

    async def get_by_id(self, user_id: UUID) -> User | None:
        model = await self.session.get(UserModel, user_id)
        return _user_entity(model) if model is not None else None

    async def save_profile(self, user_id: UUID, username: str) -> User:
        model = await self.session.get(UserModel, user_id)
        if model is None:
            model = UserModel(id=user_id, username=username)
            self.session.add(model)
        else:
            model.username = username

        try:
            await self.session.commit()
        except IntegrityError as error:
            await self.session.rollback()
            raise UsernameTakenError(details={"username": username}) from error

        await self.session.refresh(model)
        return _user_entity(model)


class SqlAlchemyFactRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_or_create(self, fact: Fact) -> Fact:
        statement = (
            insert(FactModel)
            .values(
                id=fact.id,
                text=fact.text,
                content_hash=fact.content_hash,
                length=fact.length,
                source=fact.source,
                created_at=fact.created_at,
            )
            .on_conflict_do_nothing(index_elements=[FactModel.content_hash])
            .returning(FactModel.id)
        )
        result = await self.session.execute(statement)
        inserted_id = result.scalar_one_or_none()
        await self.session.commit()

        lookup = select(FactModel).where(
            FactModel.id == inserted_id
            if inserted_id is not None
            else FactModel.content_hash == fact.content_hash
        )
        model = (await self.session.execute(lookup)).scalar_one()
        return _fact_entity(model)

    async def get_random(self) -> Fact | None:
        statement = select(FactModel).order_by(func.random()).limit(1)
        model = (await self.session.execute(statement)).scalar_one_or_none()
        return _fact_entity(model) if model is not None else None

    def _view_statement(self, user_id: UUID) -> Select[tuple[FactModel, int, bool]]:
        count_like = aliased(LikeModel)
        user_like = aliased(LikeModel)
        like_count = (
            select(func.count(count_like.user_id))
            .where(count_like.fact_id == FactModel.id)
            .correlate(FactModel)
            .scalar_subquery()
        )
        liked = exists(
            select(user_like.user_id).where(
                user_like.fact_id == FactModel.id,
                user_like.user_id == user_id,
            )
        )
        return select(
            FactModel,
            like_count.label("like_count"),
            liked.label("liked"),
        )

    @staticmethod
    def _fact_view(row: Row[tuple[FactModel, int, bool]]) -> FactView:
        model, like_count, liked = row
        return FactView(
            fact=_fact_entity(model),
            liked=liked,
            like_count=like_count,
        )

    async def get_view(self, fact_id: UUID, user_id: UUID) -> FactView | None:
        statement = self._view_statement(user_id).where(FactModel.id == fact_id)
        row = (await self.session.execute(statement)).one_or_none()
        return self._fact_view(row) if row is not None else None

    async def add_like(self, fact_id: UUID, user_id: UUID) -> None:
        statement = (
            insert(LikeModel)
            .values(fact_id=fact_id, user_id=user_id)
            .on_conflict_do_nothing(index_elements=[LikeModel.user_id, LikeModel.fact_id])
        )
        await self.session.execute(statement)
        await self.session.commit()

    async def remove_like(self, fact_id: UUID, user_id: UUID) -> None:
        statement = delete(LikeModel).where(
            LikeModel.fact_id == fact_id,
            LikeModel.user_id == user_id,
        )
        await self.session.execute(statement)
        await self.session.commit()

    async def list_user_likes(
        self, user_id: UUID, *, offset: int, limit: int
    ) -> PageResult[FactView]:
        total_statement = (
            select(func.count()).select_from(LikeModel).where(LikeModel.user_id == user_id)
        )
        total = int((await self.session.execute(total_statement)).scalar_one())

        statement = (
            self._view_statement(user_id)
            .join(LikeModel, LikeModel.fact_id == FactModel.id)
            .where(LikeModel.user_id == user_id)
            .order_by(LikeModel.created_at.desc(), FactModel.id)
            .offset(offset)
            .limit(limit)
        )
        rows = (await self.session.execute(statement)).all()
        return PageResult(items=[self._fact_view(row) for row in rows], total=total)

    async def list_popular(self, user_id: UUID, *, offset: int, limit: int) -> PageResult[FactView]:
        total = int(
            (await self.session.execute(select(func.count()).select_from(FactModel))).scalar_one()
        )
        statement = self._view_statement(user_id)
        statement = (
            statement.order_by(
                statement.selected_columns.like_count.desc(), FactModel.text, FactModel.id
            )
            .offset(offset)
            .limit(limit)
        )
        rows = (await self.session.execute(statement)).all()
        return PageResult(items=[self._fact_view(row) for row in rows], total=total)
