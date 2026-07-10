"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogs, fetchBlogsByCategory } from "@/api/blogs";
import { fetchCategories } from "@/api/categories";
import { getApiErrorMessages } from "@/api/httpClient";
import type { GetBlogsQueryResult } from "@/api/types";
import { useAuth } from "@/context/AuthContext";

function errorMessage(error: unknown): string {
  return getApiErrorMessages(error).join("; ");
}

function BlogCard({ blog }: { blog: GetBlogsQueryResult }) {
  const cover = blog.coverImageUrl || blog.blogImageUrl;

  return (
    <Link
      href={`/blogs/${blog.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md"
    >
      <article className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- cover URLs come from the API
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-sm text-zinc-400">
              No cover image
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
              {blog.category?.categoryName ?? "Uncategorized"}
            </span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            {blog.title}
          </h2>
          <p className="line-clamp-3 flex-1 text-sm leading-6 text-zinc-600">
            {blog.description}
          </p>
        </div>
      </article>
    </Link>
  );
}

function BlogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="aspect-[16/10] animate-pulse bg-zinc-200" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-24 animate-pulse rounded-full bg-zinc-200" />
        <div className="h-6 w-48 animate-pulse rounded bg-zinc-200 sm:w-56" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

function CategorySidebarSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-10 animate-pulse rounded-lg bg-zinc-200"
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const blogsQuery = useQuery({
    queryKey: ["blogs", selectedCategoryId ?? "all"],
    queryFn: () =>
      selectedCategoryId
        ? fetchBlogsByCategory(selectedCategoryId)
        : fetchBlogs(),
  });

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId || !categoriesQuery.data) return "All posts";
    return (
      categoriesQuery.data.find((c) => c.id === selectedCategoryId)
        ?.categoryName ?? "Filtered posts"
    );
  }, [categoriesQuery.data, selectedCategoryId]);

  const blogsError = blogsQuery.isError ? errorMessage(blogsQuery.error) : null;
  const categoriesError = categoriesQuery.isError
    ? errorMessage(categoriesQuery.error)
    : null;

  return (
    <div className="min-h-full flex-1 bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase">
              ZenBlog
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              Discover stories
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-zinc-500 sm:inline">
                  {user?.email}
                </span>
                <Link
                  href="/blogs/new"
                  className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Create New Blog
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-900 uppercase">
            Categories
          </h2>

          {categoriesQuery.isLoading ? (
            <CategorySidebarSkeleton />
          ) : categoriesError ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {categoriesError}
            </div>
          ) : (
            <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  selectedCategoryId === null
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
                }`}
              >
                All
              </button>
              {(categoriesQuery.data ?? []).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    selectedCategoryId === category.id
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  {category.categoryName}
                </button>
              ))}
            </nav>
          )}
        </aside>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                {selectedCategoryName}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {blogsQuery.isLoading
                  ? "Loading posts…"
                  : `${blogsQuery.data?.length ?? 0} post${(blogsQuery.data?.length ?? 0) === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          {blogsError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700"
            >
              <p className="font-medium">Couldn’t load blogs</p>
              <p className="mt-1">{blogsError}</p>
              <button
                type="button"
                onClick={() => blogsQuery.refetch()}
                className="mt-4 rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-800"
              >
                Try again
              </button>
            </div>
          ) : blogsQuery.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <BlogCardSkeleton key={index} />
              ))}
            </div>
          ) : (blogsQuery.data?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
              <p className="text-base font-medium text-zinc-900">No posts yet</p>
              <p className="mt-1 text-sm text-zinc-600">
                {selectedCategoryId
                  ? "Try another category or view all posts."
                  : "Check back soon for new stories."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {(blogsQuery.data ?? []).map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
