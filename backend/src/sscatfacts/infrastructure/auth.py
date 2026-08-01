import asyncio
from time import monotonic
from typing import Any, cast
from uuid import UUID

import httpx
import jwt
from jwt import PyJWK
from jwt.exceptions import InvalidTokenError as PyJwtInvalidTokenError
from jwt.exceptions import PyJWTError

from sscatfacts.domain.auth import AuthenticatedUser
from sscatfacts.domain.errors import (
    AuthenticationUnavailableError,
    InvalidAccessTokenError,
)

ASYMMETRIC_ALGORITHMS = frozenset({"ES256", "RS256"})


class SupabaseAccessTokenVerifier:
    def __init__(
        self,
        supabase_url: str,
        *,
        anon_key: str = "",
        audience: str = "authenticated",
        jwks_cache_seconds: int = 600,
        timeout_seconds: float = 3.0,
        clock_skew_seconds: float = 10.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        base_url = supabase_url.rstrip("/")
        self.issuer = f"{base_url}/auth/v1"
        self.jwks_url = f"{self.issuer}/.well-known/jwks.json"
        self.user_url = f"{self.issuer}/user"
        self.anon_key = anon_key
        self.audience = audience
        self.jwks_cache_seconds = jwks_cache_seconds
        self.timeout_seconds = timeout_seconds
        self.clock_skew_seconds = clock_skew_seconds
        self.transport = transport
        self._keys: dict[str, PyJWK] = {}
        self._keys_expire_at = 0.0
        self._keys_lock = asyncio.Lock()

    async def verify(self, token: str) -> AuthenticatedUser:
        try:
            header = jwt.get_unverified_header(token)
        except PyJwtInvalidTokenError as error:
            raise InvalidAccessTokenError() from error

        algorithm = header.get("alg")
        if algorithm == "HS256":
            return await self._verify_legacy_token(token)
        if not isinstance(algorithm, str) or algorithm not in ASYMMETRIC_ALGORITHMS:
            raise InvalidAccessTokenError()

        key_id = header.get("kid")
        if not isinstance(key_id, str) or not key_id:
            raise InvalidAccessTokenError()

        signing_key = await self._signing_key(key_id)
        if signing_key.algorithm_name != algorithm:
            raise InvalidAccessTokenError()

        try:
            claims = jwt.decode(
                token,
                key=signing_key.key,
                algorithms=[algorithm],
                audience=self.audience,
                issuer=self.issuer,
                leeway=self.clock_skew_seconds,
                options={"require": ["aud", "exp", "iss", "sub"]},
            )
        except PyJwtInvalidTokenError as error:
            raise InvalidAccessTokenError() from error

        return self._authenticated_user(claims)

    async def _signing_key(self, key_id: str) -> PyJWK:
        await self._refresh_keys_if_needed()
        signing_key = self._keys.get(key_id)
        if signing_key is None:
            raise InvalidAccessTokenError()
        return signing_key

    async def _refresh_keys_if_needed(self) -> None:
        if self._keys and monotonic() < self._keys_expire_at:
            return

        async with self._keys_lock:
            if self._keys and monotonic() < self._keys_expire_at:
                return

            response = await self._request("GET", self.jwks_url)
            if response.status_code != 200:
                raise AuthenticationUnavailableError()

            try:
                payload = response.json()
            except ValueError as error:
                raise AuthenticationUnavailableError() from error

            if not isinstance(payload, dict) or not isinstance(payload.get("keys"), list):
                raise AuthenticationUnavailableError()

            keys: dict[str, PyJWK] = {}
            for value in payload["keys"]:
                if not isinstance(value, dict):
                    continue
                key_id = value.get("kid")
                algorithm = value.get("alg")
                if (
                    not isinstance(key_id, str)
                    or not isinstance(algorithm, str)
                    or algorithm not in ASYMMETRIC_ALGORITHMS
                ):
                    continue
                try:
                    keys[key_id] = PyJWK.from_dict(
                        cast(dict[str, Any], value),
                        algorithm=algorithm,
                    )
                except PyJWTError:
                    continue

            if not keys:
                raise AuthenticationUnavailableError()

            self._keys = keys
            self._keys_expire_at = monotonic() + self.jwks_cache_seconds

    async def _verify_legacy_token(self, token: str) -> AuthenticatedUser:
        if not self.anon_key:
            raise AuthenticationUnavailableError()

        response = await self._request(
            "GET",
            self.user_url,
            headers={
                "apikey": self.anon_key,
                "Authorization": f"Bearer {token}",
            },
        )
        if response.status_code in {400, 401, 403}:
            raise InvalidAccessTokenError()
        if response.status_code != 200:
            raise AuthenticationUnavailableError()

        try:
            user_payload = response.json()
            claims = jwt.decode(
                token,
                options={
                    "verify_signature": False,
                    "verify_exp": True,
                    "verify_aud": True,
                    "verify_iss": True,
                    "require": ["aud", "exp", "iss", "sub"],
                },
                audience=self.audience,
                issuer=self.issuer,
                leeway=self.clock_skew_seconds,
            )
        except (ValueError, PyJwtInvalidTokenError) as error:
            raise InvalidAccessTokenError() from error

        authenticated_user = self._authenticated_user(claims)
        if not isinstance(user_payload, dict) or user_payload.get("id") != str(
            authenticated_user.id
        ):
            raise InvalidAccessTokenError()
        return authenticated_user

    async def _request(
        self,
        method: str,
        url: str,
        *,
        headers: dict[str, str] | None = None,
    ) -> httpx.Response:
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout_seconds,
                transport=self.transport,
            ) as client:
                return await client.request(method, url, headers=headers)
        except httpx.HTTPError as error:
            raise AuthenticationUnavailableError() from error

    def _authenticated_user(self, claims: dict[str, Any]) -> AuthenticatedUser:
        if claims.get("role") != "authenticated":
            raise InvalidAccessTokenError()

        subject = claims.get("sub")
        if not isinstance(subject, str):
            raise InvalidAccessTokenError()
        try:
            user_id = UUID(subject)
        except ValueError as error:
            raise InvalidAccessTokenError() from error

        email = claims.get("email")
        return AuthenticatedUser(
            id=user_id,
            email=email if isinstance(email, str) else None,
        )
