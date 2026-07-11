"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useAuth } from "@/context/AuthContext";

type RequireAuthProps = {
  children: ReactNode;
};

/**
 * Client-side route guard. Access tokens live in memory (cookies only hold the
 * refresh token), so Next.js middleware cannot see the session — protected
 * layouts wrap content with this component instead.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady || isAuthenticated) return;

    const next = pathname && pathname !== "/" ? pathname : undefined;
    const href = next
      ? `/login?next=${encodeURIComponent(next)}`
      : "/login";
    router.replace(href);
  }, [isAuthenticated, isReady, pathname, router]);

  if (!isReady || !isAuthenticated) {
    return <PageSkeleton variant="form" />;
  }

  return <>{children}</>;
}
