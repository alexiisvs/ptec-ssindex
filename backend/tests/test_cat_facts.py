import asyncio

import httpx

from sscatfacts.infrastructure.cat_facts import CatFactsClient


def test_cat_facts_client_retries_once() -> None:
    attempts = 0

    def handler(_: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            return httpx.Response(503)
        return httpx.Response(200, json={"fact": "Cats sleep a lot."})

    async def fetch() -> str:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            gateway = CatFactsClient(
                "https://catfact.ninja",
                timeout_seconds=3,
                max_retries=1,
                client=client,
            )
            return await gateway.fetch_fact()

    assert asyncio.run(fetch()) == "Cats sleep a lot."
    assert attempts == 2
