import httpx

from sscatfacts.domain.errors import CatFactsGatewayError


class CatFactsClient:
    def __init__(
        self,
        base_url: str,
        *,
        timeout_seconds: float = 3.0,
        max_retries: int = 1,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.url = f"{base_url.rstrip('/')}/fact"
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        self.client = client

    async def fetch_fact(self) -> str:
        for attempt in range(self.max_retries + 1):
            try:
                if self.client is not None:
                    response = await self.client.get(self.url, timeout=self.timeout_seconds)
                else:
                    async with httpx.AsyncClient() as client:
                        response = await client.get(self.url, timeout=self.timeout_seconds)
                response.raise_for_status()
                payload: object = response.json()
                if not isinstance(payload, dict):
                    raise CatFactsGatewayError
                fact = payload.get("fact")
                if not isinstance(fact, str):
                    raise CatFactsGatewayError
                return fact
            except (httpx.HTTPError, ValueError, CatFactsGatewayError) as error:
                if attempt == self.max_retries:
                    raise CatFactsGatewayError from error

        raise CatFactsGatewayError
