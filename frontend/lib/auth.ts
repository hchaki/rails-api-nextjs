const TOKEN_KEY = "auth_token";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function setToken(token: string): void {
  if (!hasWindow()) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (!hasWindow()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  if (!hasWindow()) return;
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // 401ならリフレッシュを試みる
  if (response.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // 新しいトークンで元のリクエストをリトライ
      const newToken = getToken();
      return fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
        },
      });
    }
  }
  return response;
}

async function tryRefresh(): Promise<boolean> {
  const API_URL = "/api";
  try {
    const res = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      credentials: "include", // refresh_token Cookie を送る
    });
    if (!res.ok) return false;
    const data = await res.json();
    setToken(data.token);
    return true;
  } catch {
    return false;
  }
}
