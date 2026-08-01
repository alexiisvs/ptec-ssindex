import { afterEach, describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client";

describe("authenticated API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the Supabase access token as Bearer authentication", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "fact-id",
          text: "Cats sleep a lot.",
          length: 17,
          source: "catfact.ninja",
          liked: false,
          like_count: 0,
          cached: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createApiClient("access-token").randomFact();

    const [, options] = fetchMock.mock.calls[0];
    expect(new Headers(options?.headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
  });

  it("preserves the backend error code and request id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "username_taken",
            message: "Username is already in use",
            request_id: "request-id",
            details: {},
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const request = createApiClient("access-token").saveProfile("cat_user");

    await expect(request).rejects.toMatchObject({
      status: 409,
      code: "username_taken",
      requestId: "request-id",
    });
  });
});
