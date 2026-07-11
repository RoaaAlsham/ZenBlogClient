/**
 * Decode a JWT payload without verifying the signature.
 * Role checks here are for UI gating only — the API enforces authorization.
 */
export function parseJwtPayload(
  token: string | null | undefined,
): Record<string, unknown> | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json) as unknown;
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return null;
    }
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

const ROLE_CLAIM_KEYS = [
  "role",
  "roles",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
] as const;

function normalizeRoles(value: unknown): string[] {
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  return [];
}

export function parseJwtRoles(token: string | null | undefined): string[] {
  const payload = parseJwtPayload(token);
  if (!payload) return [];

  const roles = new Set<string>();
  for (const key of ROLE_CLAIM_KEYS) {
    for (const role of normalizeRoles(payload[key])) {
      roles.add(role);
    }
  }
  return [...roles];
}

export function jwtHasRole(
  token: string | null | undefined,
  role: string,
): boolean {
  return parseJwtRoles(token).some(
    (value) => value.localeCompare(role, undefined, { sensitivity: "accent" }) === 0,
  );
}
