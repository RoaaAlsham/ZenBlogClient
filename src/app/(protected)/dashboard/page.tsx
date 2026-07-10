"use client";

import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-forest">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as {user?.email}
          </p>
        </div>
        <button type="button" onClick={logout} className="btn-secondary">
          Log out
        </button>
      </div>
    </main>
  );
}
