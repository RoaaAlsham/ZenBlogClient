"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useAuth } from "@/context/AuthContext";

type RequireAuthProps = {
  children: ReactNode;
};

/**
 * Client-side route guard. In-memory JWT cannot be read by Next.js middleware,
 * so protected layouts wrap content with this component instead.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      const next = pathname && pathname !== "/" ? pathname : undefined;
      const href = next
        ? `/login?next=${encodeURIComponent(next)}`
        : "/login";
      router.replace(href);
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated) {
    return <PageSkeleton variant="form" />;
  }

  return <>{children}</>;
}
