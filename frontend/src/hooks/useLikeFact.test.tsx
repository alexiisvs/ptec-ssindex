import "@testing-library/jest-dom/vitest";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import type { Fact } from "../api/types";
import { useLikeFact } from "./useLikeFact";

const { setLike } = vi.hoisted(() => ({ setLike: vi.fn() }));

vi.mock("./useAuthenticatedApi", () => ({
  useAuthenticatedApi: () => ({ setLike }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const fact: Fact = {
  id: "fact-id",
  text: "Cats sleep a lot.",
  length: 17,
  source: "catfact.ninja",
  liked: false,
  like_count: 2,
  cached: false,
};

describe("useLikeFact", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    setLike.mockReset();
  });

  afterEach(cleanup);

  it("updates optimistically and rolls back when the request fails", async () => {
    let rejectRequest: (reason?: unknown) => void = () => undefined;
    setLike.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }),
    );
    queryClient.setQueryData(["facts", "random"], fact);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useLikeFact(), { wrapper });

    act(() => result.current.mutate(fact));
    await waitFor(() =>
      expect(queryClient.getQueryData<Fact>(["facts", "random"])?.liked).toBe(
        true,
      ),
    );

    act(() => rejectRequest(new Error("request failed")));
    await waitFor(() =>
      expect(queryClient.getQueryData<Fact>(["facts", "random"])).toEqual(fact),
    );
  });
});
