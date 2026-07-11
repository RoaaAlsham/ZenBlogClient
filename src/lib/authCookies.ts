export type PersistedAuthUser = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
};

const REFRESH_TOKEN_COOKIE = "zb_refresh_token";
const USER_COOKIE = "zb_user";

function cookieAttributes(maxAgeSeconds: number): string {
  const parts = [
    "Path=/",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
    "SameSite=Lax",
  ];

  // Secure cookies work on localhost and are required for HTTPS deployments.
  if (
    typeof window === "undefined" ||
    window.location.protocol === "https:" ||
    isLocalhost()
  ) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function isLocalhost(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function maxAgeFromExpiresAt(expiresAtUtc: string): number {
  const expiresMs = Date.parse(expiresAtUtc);
  if (Number.isNaN(expiresMs)) {
    // Fallback: 7 days (matches backend refresh-token lifetime).
    return 60 * 60 * 24 * 7;
  }
  return Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));

  if (!match) return null;

  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${cookieAttributes(maxAgeSeconds)}`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function persistAuthSession(
  refreshToken: string,
  refreshTokenExpiresAtUtc: string,
  user: PersistedAuthUser,
): void {
  const maxAge = maxAgeFromExpiresAt(refreshTokenExpiresAtUtc);
  writeCookie(REFRESH_TOKEN_COOKIE, refreshToken, maxAge);
  writeCookie(USER_COOKIE, JSON.stringify(user), maxAge);
}

/** Updates the user cookie without rotating the refresh token. */
export function persistAuthUser(user: PersistedAuthUser): void {
  const maxAge = 60 * 60 * 24 * 7;
  writeCookie(USER_COOKIE, JSON.stringify(user), maxAge);
}

export function readPersistedRefreshToken(): string | null {
  return readCookie(REFRESH_TOKEN_COOKIE);
}

export function readPersistedUser(): PersistedAuthUser | null {
  const raw = readCookie(USER_COOKIE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedAuthUser>;
    const valid =
      typeof parsed.id === "string" &&
      parsed.id.length > 0 &&
      typeof parsed.email === "string" &&
      parsed.email.length > 0 &&
      typeof parsed.firstName === "string" &&
      typeof parsed.lastName === "string";

    if (valid) {
      return {
        id: parsed.id as string,
        email: parsed.email as string,
        username:
          typeof parsed.username === "string" ? parsed.username : "",
        firstName: parsed.firstName as string,
        lastName: parsed.lastName as string,
        imageUrl:
          typeof parsed.imageUrl === "string" || parsed.imageUrl === null
            ? parsed.imageUrl
            : undefined,
      };
    }
  } catch {
    // ignore malformed cookie
  }

  return null;
}

export function clearAuthSessionCookies(): void {
  deleteCookie(REFRESH_TOKEN_COOKIE);
  deleteCookie(USER_COOKIE);
}
