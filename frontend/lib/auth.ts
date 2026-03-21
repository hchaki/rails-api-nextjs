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

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
