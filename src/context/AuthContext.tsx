"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getApiErrorMessages,
  httpClient,
  setAccessToken,
  setUnauthorizedHandler,
} from "@/api/httpClient";
import type { LoginResult, RefreshTokenResult } from "@/api/types";
import { fetchUsers } from "@/api/users";
import {
  clearAuthSessionCookies,
  persistAuthSession,
  readPersistedRefreshToken,
  readPersistedUser,
} from "@/lib/authCookies";
import { jwtHasRole, parseJwtRoles } from "@/lib/jwt";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  roles: string[];
  isAdmin: boolean;
  isAuthenticated: boolean;
  /** False until the initial cookie/session restore attempt finishes. */
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

function normalizeAuthUser(nextUser: AuthUser): AuthUser {
  return {
    id: nextUser.id,
    email: nextUser.email,
    firstName: typeof nextUser.firstName === "string" ? nextUser.firstName : "",
    lastName: typeof nextUser.lastName === "string" ? nextUser.lastName : "",
    imageUrl: nextUser.imageUrl,
  };
}

/**
 * Login payloads from older API builds omit first/last name. Fall back to
 * GET /users (fullName) so the profile session is still complete.
 */
async function enrichAuthUser(baseUser: AuthUser): Promise<AuthUser> {
  const normalized = normalizeAuthUser(baseUser);
  if (normalized.firstName.trim() && normalized.lastName.trim()) {
    return normalized;
  }

  try {
    const users = await fetchUsers();
    const match = users.find((entry) => entry.id === normalized.id);
    if (!match) return normalized;

    const parts = (match.fullName ?? "").trim().split(/\s+/).filter(Boolean);
    return {
      ...normalized,
      firstName: normalized.firstName.trim() || parts[0] || "",
      lastName: normalized.lastName.trim() || parts.slice(1).join(" ") || "",
      imageUrl: normalized.imageUrl ?? match.imageUrl,
    };
  } catch {
    return normalized;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const clearSession = useCallback(() => {
    clearAuthSessionCookies();
    setAccessToken(null);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const applySession = useCallback(
    (
      accessToken: string,
      refreshToken: string,
      refreshTokenExpiresAtUtc: string,
      nextUser: AuthUser,
    ) => {
      const normalizedUser = normalizeAuthUser(nextUser);
      setAccessToken(accessToken);
      setToken(accessToken);
      setUser(normalizedUser);
      persistAuthSession(refreshToken, refreshTokenExpiresAtUtc, normalizedUser);
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      if (typeof window === "undefined") return;
      const path = window.location.pathname;
      if (path.startsWith("/login") || path.startsWith("/register")) return;
      const next = path && path !== "/" ? path : undefined;
      const href = next
        ? `/login?next=${encodeURIComponent(next)}`
        : "/login";
      window.location.assign(href);
    });

    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const refreshToken = readPersistedRefreshToken();
      const persistedUser = readPersistedUser();

      if (!refreshToken || !persistedUser) {
        // Incomplete cookie pair (e.g. legacy {id,email} user cookie) cannot be restored.
        clearAuthSessionCookies();
        if (!cancelled) setIsReady(true);
        return;
      }

      try {
        const result = await httpClient<RefreshTokenResult>("/api/auth/refresh", {
          method: "POST",
          body: { refreshToken },
          skipAuth: true,
        });

        if (cancelled) return;

        setAccessToken(result.accessToken);
        const enrichedUser = await enrichAuthUser(persistedUser);
        if (cancelled) return;

        applySession(
          result.accessToken,
          result.refreshToken,
          result.refreshTokenExpiresAtUtc,
          enrichedUser,
        );
      } catch {
        if (!cancelled) {
          clearAuthSessionCookies();
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await httpClient<LoginResult>("/api/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
      });

      setAccessToken(result.token);
      const enrichedUser = await enrichAuthUser({
        id: result.userId,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        imageUrl: result.imageUrl,
      });

      applySession(
        result.token,
        result.refreshToken,
        result.refreshTokenExpiresAtUtc,
        enrichedUser,
      );
    },
    [applySession],
  );

  const value = useMemo<AuthContextValue>(() => {
    const roles = parseJwtRoles(token);
    return {
      user,
      token,
      roles,
      isAdmin: jwtHasRole(token, "Admin"),
      isAuthenticated: Boolean(token),
      isReady,
      login,
      logout,
    };
  }, [user, token, isReady, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { getApiErrorMessages as getLoginErrorMessages };
