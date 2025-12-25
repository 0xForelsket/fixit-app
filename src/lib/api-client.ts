// Client-side API utilities with CSRF protection

const CSRF_COOKIE_NAME = "fixit_csrf";

// Get CSRF token from cookie
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === CSRF_COOKIE_NAME) {
      return value;
    }
  }
  return null;
}

// API fetch wrapper that includes CSRF token
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const csrfToken = getCsrfToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Add CSRF token for mutating requests
  if (
    csrfToken &&
    options.method &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(options.method.toUpperCase())
  ) {
    (headers as Record<string, string>)["x-csrf-token"] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.error || `Request failed with status ${response.status}`,
      response.status,
      error
    );
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Typed API methods
export const api = {
  get: <T>(url: string) => apiFetch<T>(url, { method: "GET" }),

  post: <T>(url: string, data?: unknown) =>
    apiFetch<T>(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(url: string, data?: unknown) =>
    apiFetch<T>(url, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
};
