import asyncio
import json
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt.algorithms import RSAAlgorithm

from sscatfacts.domain.errors import InvalidAccessTokenError
from sscatfacts.infrastructure.auth import SupabaseAccessTokenVerifier

ISSUER = "https://project-ref.supabase.co/auth/v1"
AUDIENCE = "authenticated"


def signing_material() -> tuple[rsa.RSAPrivateKey, dict[str, object]]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    encoded_jwk = RSAAlgorithm.to_jwk(private_key.public_key())
    jwk = json.loads(encoded_jwk)
    assert isinstance(jwk, dict)
    jwk.update({"alg": "RS256", "kid": "test-key", "use": "sig"})
    return private_key, jwk


def access_token(
    private_key: rsa.RSAPrivateKey,
    user_id: UUID,
    *,
    audience: str = AUDIENCE,
    expires_at: datetime | None = None,
) -> str:
    now = datetime.now(UTC)
    return jwt.encode(
        {
            "aud": audience,
            "email": "cat@example.com",
            "exp": expires_at or now + timedelta(minutes=5),
            "iat": now,
            "iss": ISSUER,
            "role": "authenticated",
            "sub": str(user_id),
        },
        private_key,
        algorithm="RS256",
        headers={"kid": "test-key"},
    )


def test_verifies_supabase_jwt_and_caches_jwks() -> None:
    private_key, jwk = signing_material()
    user_id = uuid4()
    token = access_token(private_key, user_id)
    requests = 0

    def handle_request(_: httpx.Request) -> httpx.Response:
        nonlocal requests
        requests += 1
        return httpx.Response(200, json={"keys": [jwk]})

    verifier = SupabaseAccessTokenVerifier(
        "https://project-ref.supabase.co",
        transport=httpx.MockTransport(handle_request),
    )

    async def verify_twice() -> None:
        first = await verifier.verify(token)
        second = await verifier.verify(token)
        assert first.id == user_id
        assert first.email == "cat@example.com"
        assert second == first

    asyncio.run(verify_twice())
    assert requests == 1


@pytest.mark.parametrize(
    ("audience", "expires_at"),
    [
        ("wrong-audience", None),
        (AUDIENCE, datetime.now(UTC) - timedelta(minutes=1)),
    ],
)
def test_rejects_invalid_claims(audience: str, expires_at: datetime | None) -> None:
    private_key, jwk = signing_material()
    token = access_token(
        private_key,
        uuid4(),
        audience=audience,
        expires_at=expires_at,
    )
    verifier = SupabaseAccessTokenVerifier(
        "https://project-ref.supabase.co",
        transport=httpx.MockTransport(lambda _: httpx.Response(200, json={"keys": [jwk]})),
    )

    with pytest.raises(InvalidAccessTokenError):
        asyncio.run(verifier.verify(token))


def test_rejects_malformed_token_without_calling_supabase() -> None:
    def unexpected_request(_: httpx.Request) -> httpx.Response:
        pytest.fail("Malformed tokens must be rejected before requesting JWKS")

    verifier = SupabaseAccessTokenVerifier(
        "https://project-ref.supabase.co",
        transport=httpx.MockTransport(unexpected_request),
    )

    with pytest.raises(InvalidAccessTokenError):
        asyncio.run(verifier.verify("not-a-jwt"))


def test_legacy_hs256_token_is_validated_by_supabase_auth() -> None:
    user_id = uuid4()
    now = datetime.now(UTC)
    token = jwt.encode(
        {
            "aud": AUDIENCE,
            "exp": now + timedelta(minutes=5),
            "iss": ISSUER,
            "role": "authenticated",
            "sub": str(user_id),
        },
        "legacy-test-secret",
        algorithm="HS256",
    )

    def handle_request(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/auth/v1/user"
        assert request.headers["apikey"] == "public-anon-key"
        assert request.headers["authorization"] == f"Bearer {token}"
        return httpx.Response(200, json={"id": str(user_id)})

    verifier = SupabaseAccessTokenVerifier(
        "https://project-ref.supabase.co",
        anon_key="public-anon-key",
        transport=httpx.MockTransport(handle_request),
    )

    authenticated_user = asyncio.run(verifier.verify(token))
    assert authenticated_user.id == user_id
