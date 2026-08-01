import type {
  ErrorEnvelope,
  Fact,
  PageResponse,
  UserProfile,
  UsernameAvailability,
} from "./types";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      0,
      "network_error",
      "No se pudo conectar con el servidor.",
    );
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const envelope = payload as Partial<ErrorEnvelope> | null;
    throw new ApiError(
      response.status,
      envelope?.code || "request_failed",
      envelope?.message || "No se pudo completar la solicitud.",
      envelope?.request_id,
    );
  }

  return payload as T;
}

export const publicApi = {
  usernameAvailability(username: string) {
    return request<UsernameAvailability>(
      `/usernames/${encodeURIComponent(username)}/availability`,
    );
  },
};

export function createApiClient(accessToken: string) {
  return {
    getProfile(signal?: AbortSignal) {
      return request<UserProfile>("/me", { signal }, accessToken);
    },
    saveProfile(username: string) {
      return request<UserProfile>(
        "/me/profile",
        { method: "PUT", body: JSON.stringify({ username }) },
        accessToken,
      );
    },
    randomFact(signal?: AbortSignal) {
      return request<Fact>("/facts/random", { signal }, accessToken);
    },
    setLike(factId: string, liked: boolean) {
      return request<Fact>(
        `/facts/${factId}/like`,
        { method: liked ? "PUT" : "DELETE" },
        accessToken,
      );
    },
    favorites(page: number, pageSize: number, signal?: AbortSignal) {
      return request<PageResponse<Fact>>(
        `/me/likes?page=${page}&page_size=${pageSize}`,
        { signal },
        accessToken,
      );
    },
    popular(page: number, pageSize: number, signal?: AbortSignal) {
      return request<PageResponse<Fact>>(
        `/facts/popular?page=${page}&page_size=${pageSize}`,
        { signal },
        accessToken,
      );
    },
  };
}

export type AuthenticatedApi = ReturnType<typeof createApiClient>;

export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error
      ? error.message
      : "No se pudo completar la solicitud.";
  }
  if (error.code === "username_taken") return "Ese username ya está ocupado.";
  if (error.code === "user_not_found") return "El perfil todavía no existe.";
  if (error.code === "upstream_unavailable")
    return "Cat Facts no está disponible en este momento.";
  if (error.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  return error.message;
}
