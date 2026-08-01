from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True)
class User:
    id: UUID
    username: str
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class Fact:
    id: UUID
    text: str
    content_hash: str
    length: int
    source: str
    created_at: datetime


@dataclass(frozen=True, slots=True)
class FactView:
    fact: Fact
    liked: bool
    like_count: int
    cached: bool = False


@dataclass(frozen=True, slots=True)
class PageResult[T]:
    items: list[T]
    total: int
