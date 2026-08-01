from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from sscatfacts.domain.entities import FactView, User

USERNAME_PATTERN = r"^[A-Za-z0-9_]+$"


class ProfileUpdate(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=USERNAME_PATTERN)

    @field_validator("username", mode="before")
    @classmethod
    def strip_username(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class UsernameAvailabilityResponse(BaseModel):
    username: str
    available: bool


class UserResponse(BaseModel):
    id: UUID
    username: str
    created_at: datetime
    updated_at: datetime


class FactResponse(BaseModel):
    id: UUID
    text: str
    length: int
    source: str
    liked: bool
    like_count: int
    cached: bool = False


class PageResponse[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int


class ErrorResponse(BaseModel):
    code: str
    message: str
    request_id: str
    details: object


def user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def fact_response(view: FactView) -> FactResponse:
    return FactResponse(
        id=view.fact.id,
        text=view.fact.text,
        length=view.fact.length,
        source=view.fact.source,
        liked=view.liked,
        like_count=view.like_count,
        cached=view.cached,
    )
