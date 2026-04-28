const API_BASE = "/api/v1";

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  tokenGetter = fn;
}

function getUserEmail(): string {
  return localStorage.getItem("ogade_user_email") ?? "julien.bock57@gmail.com";
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  // Try to get a Microsoft token
  const token = tokenGetter ? await tokenGetter() : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    // Dev fallback: use email header
    headers["x-user-email"] = getUserEmail();
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    try {
      const body = await response.json();
      if (body.message) {
        message = typeof body.message === "string" ? body.message : message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return apiFetch<T>(`${path}${buildQueryString(params)}`, {
      method: "GET",
    });
  },

  post<T>(path: string, body: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  patch<T>(path: string, body: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete(path: string): Promise<void> {
    return apiFetch<void>(path, {
      method: "DELETE",
    });
  },

  async fetchBlob(path: string): Promise<Blob> {
    const url = `${API_BASE}${path}`;
    const headers: Record<string, string> = {};
    const token = tokenGetter ? await tokenGetter() : null;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      headers["x-user-email"] = getUserEmail();
    }
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    return response.blob();
  },
};
