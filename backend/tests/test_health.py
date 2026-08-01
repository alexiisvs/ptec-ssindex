from fastapi.testclient import TestClient

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


def test_validation_error_uses_error_envelope() -> None:
    response = client.get("/api/v1/usernames/ab/availability")

    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"
    assert response.json()["request_id"] == response.headers["X-Request-ID"]
