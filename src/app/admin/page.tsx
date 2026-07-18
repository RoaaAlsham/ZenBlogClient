"use client";

import Link from "next/link";
import { useState } from "react";
import { BlogsAdminTab } from "@/components/admin/BlogsAdminTab";
import { CategoriesAdminTab } from "@/components/admin/CategoriesAdminTab";
import { SettingsAdminTab } from "@/components/admin/SettingsAdminTab";
import { UsersAdminTab } from "@/components/admin/UsersAdminTab";
import { PageSkeleton } from "@/components/PageSkeleton";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";

type AdminTab = "blogs" | "categories" | "users" | "settings";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "blogs", label: "Global Blog Management" },
  { id: "categories", label: "Category Management" },
  { id: "users", label: "User Management" },
  { id: "settings", label: "Settings" },
];

function ForbiddenScreen() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          403
        </p>
        <h1 className="mt-3 font-title text-2xl font-semibold tracking-tight text-zinc-900">
          Forbidden
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          You need the Admin role to access this dashboard. If you believe this
          is a mistake, contact a site administrator.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Back to home
          </Link>
          <Link
            href="/profile"
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Go to profile
          </Link>
        </div>
      </div>
    </main>
  );
}

function AdminDashboard() {
  const { isAdmin, isReady, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("blogs");

  if (!isReady) {
    return <PageSkeleton variant="page" />;
  }

  if (!isAdmin) {
    return <ForbiddenScreen />;
  }

  return (
    <main className="min-h-full flex-1 bg-zinc-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
          >
            ← Back to posts
          </Link>
          <h1 className="mt-3 font-title text-3xl font-semibold tracking-tight text-zinc-900">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Signed in as {user?.email}. Manage blogs, categories, users, and
            site settings.
          </p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-zinc-200 pb-px">
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                  selected
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <section role="tabpanel" aria-label={TABS.find((t) => t.id === activeTab)?.label}>
          {activeTab === "blogs" && <BlogsAdminTab />}
          {activeTab === "categories" && <CategoriesAdminTab />}
          {activeTab === "users" && <UsersAdminTab />}
          {activeTab === "settings" && <SettingsAdminTab />}
        </section>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminDashboard />
    </RequireAuth>
  );
}
