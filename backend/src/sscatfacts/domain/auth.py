from dataclasses import dataclass
from typing import Protocol
from uuid import UUID


@dataclass(frozen=True, slots=True)
class AuthenticatedUser:
    id: UUID
    email: str | None


class AccessTokenVerifier(Protocol):
    async def verify(self, token: str) -> AuthenticatedUser: ...
