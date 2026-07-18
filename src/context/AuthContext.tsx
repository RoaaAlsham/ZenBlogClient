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
import type { LoginResult, RefreshTokenResult, UserProfileResult } from "@/api/types";
import { fetchCurrentUser } from "@/api/users";
import {
  clearAuthSessionCookies,
  persistAuthSession,
  persistAuthUser,
  readPersistedRefreshToken,
  readPersistedUser,
} from "@/lib/authCookies";
import { jwtHasRole, parseJwtRoles } from "@/lib/jwt";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
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
  /** Merge profile fields into the session user (and cookie). */
  updateUser: (next: Partial<AuthUser> | UserProfileResult) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

function normalizeAuthUser(nextUser: AuthUser): AuthUser {
  return {
    id: nextUser.id,
    email: nextUser.email,
    username: typeof nextUser.username === "string" ? nextUser.username : "",
    firstName: typeof nextUser.firstName === "string" ? nextUser.firstName : "",
    lastName: typeof nextUser.lastName === "string" ? nextUser.lastName : "",
    imageUrl: nextUser.imageUrl,
  };
}

/**
 * Login payloads from older API builds omit first/last name. Fall back to
 * GET /users/me so the profile session is still complete.
 */
async function enrichAuthUser(baseUser: AuthUser): Promise<AuthUser> {
  const normalized = normalizeAuthUser(baseUser);
  const needsNames =
    !normalized.firstName.trim() || !normalized.lastName.trim();
  const needsUsername = !normalized.username.trim();

  if (!needsNames && !needsUsername) {
    return normalized;
  }

  try {
    const me = await fetchCurrentUser();
    return {
      ...normalized,
      username: normalized.username.trim() || me.username || "",
      firstName: normalized.firstName.trim() || me.firstName || "",
      lastName: normalized.lastName.trim() || me.lastName || "",
      imageUrl: normalized.imageUrl ?? me.imageUrl,
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

  const updateUser = useCallback(
    (next: Partial<AuthUser> | UserProfileResult) => {
      setUser((prev) => {
        if (!prev) return prev;
        const merged = normalizeAuthUser({
          id: "id" in next && typeof next.id === "string" ? next.id : prev.id,
          email:
            "email" in next && typeof next.email === "string"
              ? next.email
              : prev.email,
          username:
            "username" in next && typeof next.username === "string"
              ? next.username
              : prev.username,
          firstName:
            "firstName" in next && typeof next.firstName === "string"
              ? next.firstName
              : prev.firstName,
          lastName:
            "lastName" in next && typeof next.lastName === "string"
              ? next.lastName
              : prev.lastName,
          imageUrl:
            "imageUrl" in next ? next.imageUrl : prev.imageUrl,
        });
        persistAuthUser(merged);
        return merged;
      });
    },
    [],
  );

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
        username: result.username ?? "",
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
      updateUser,
    };
  }, [user, token, isReady, login, logout, updateUser]);

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
