import { useMemo } from "react";

import { createApiClient } from "../api/client";
import { useAuth } from "../auth/useAuth";

export function useAuthenticatedApi() {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const api = useMemo(
    () => (accessToken ? createApiClient(accessToken) : null),
    [accessToken],
  );
  if (!api) throw new Error("An authenticated session is required");
  return api;
}
