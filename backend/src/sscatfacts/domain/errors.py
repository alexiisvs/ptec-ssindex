class DomainError(Exception):
    code = "domain_error"
    message = "The requested operation could not be completed"

    def __init__(self, *, details: dict[str, object] | None = None) -> None:
        super().__init__(self.message)
        self.details = details or {}


class AuthenticationRequiredError(DomainError):
    code = "authentication_required"
    message = "Authentication is required"


class InvalidAccessTokenError(DomainError):
    code = "invalid_access_token"
    message = "Access token is invalid or expired"


class AuthenticationUnavailableError(DomainError):
    code = "authentication_unavailable"
    message = "Authentication service is unavailable"


class UserNotFoundError(DomainError):
    code = "user_not_found"
    message = "User profile was not found"


class UsernameTakenError(DomainError):
    code = "username_taken"
    message = "Username is already in use"


class FactNotFoundError(DomainError):
    code = "fact_not_found"
    message = "Fact was not found"


class UpstreamUnavailableError(DomainError):
    code = "upstream_unavailable"
    message = "Cat Facts is temporarily unavailable"


class DatabaseUnavailableError(DomainError):
    code = "database_unavailable"
    message = "Database is unavailable"


class CatFactsGatewayError(Exception):
    """Raised when the external Cat Facts service cannot provide a valid fact."""
