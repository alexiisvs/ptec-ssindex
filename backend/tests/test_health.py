import pytest
from fastapi.testclient import TestClient

from sscatfacts.api import dependencies
from sscatfacts.domain.auth import AccessTokenVerifier, AuthenticatedUser
from sscatfacts.domain.errors import InvalidAccessTokenError
from sscatfacts.main import app

client = TestClient(app)


def test_live_health() -> None:
    response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["X-Request-ID"]


def test_protected_endpoint_uses_error_envelope() -> None:
    response = client.get("/api/v1/me")

    assert response.status_code == 401
    assert response.json() == {
        "code": "authentication_required",
        "message": "Authentication is required",
        "request_id": response.headers["X-Request-ID"],
        "details": {},
    }


def test_legacy_user_id_header_does_not_authenticate() -> None:
    response = client.get(
        "/api/v1/me",
        headers={"X-User-ID": "11111111-1111-4111-8111-111111111111"},
    )

    assert response.status_code == 401
    assert response.json()["code"] == "authentication_required"


def test_invalid_bearer_token_uses_error_envelope(monkeypatch: pytest.MonkeyPatch) -> None:
    class RejectingVerifier:
        async def verify(self, token: str) -> AuthenticatedUser:
            raise InvalidAccessTokenError()

    verifier: AccessTokenVerifier = RejectingVerifier()
    monkeypatch.setattr(dependencies, "get_token_verifier", lambda: verifier)

    response = client.get(
        "/api/v1/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
    assert response.json() == {
        "code": "invalid_access_token",
        "message": "Access token is invalid or expired",
        "request_id": response.headers["X-Request-ID"],
        "details": {},
    }


def test_validation_error_uses_error_envelope() -> None:
    response = client.get("/api/v1/usernames/ab/availability")

    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"
    assert response.json()["request_id"] == response.headers["X-Request-ID"]
