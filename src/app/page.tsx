"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogs, fetchBlogsByCategory } from "@/api/blogs";
import { fetchCategories } from "@/api/categories";
import { getApiErrorMessages } from "@/api/httpClient";
import type { GetBlogsQueryResult } from "@/api/types";
import { BotanicalLeafDivider, BotanicalPageDecor } from "@/components/botanical/BotanicalDecor";
import { useAuth } from "@/context/AuthContext";

function errorMessage(error: unknown): string {
  return getApiErrorMessages(error).join("; ");
}

function BlogCard({ blog }: { blog: GetBlogsQueryResult }) {
  const cover = blog.coverImageUrl || blog.blogImageUrl;

  return (
    <Link
      href={`/blogs/${blog.id}`}
      className="group card-surface flex h-full flex-col overflow-hidden hover:border-sage/50 hover:shadow-md hover:shadow-forest/8"
    >
      <article className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-beige/60">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- cover URLs come from the API
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-beige to-sage/20 text-sm text-muted">
              No cover image
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-beige px-2.5 py-1 text-xs font-medium text-olive">
              {blog.category?.categoryName ?? "Uncategorized"}
            </span>
          </div>
          <h2
            dir="auto"
            className="font-serif text-xl font-bold leading-snug tracking-tight text-forest text-start"
          >
            {blog.title}
          </h2>
          <p
            dir="auto"
            className="line-clamp-3 flex-1 text-sm leading-6 text-muted text-start"
          >
            {blog.description}
          </p>
        </div>
      </article>
    </Link>
  );
}

function BlogCardSkeleton() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="aspect-[16/10] animate-pulse bg-beige" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-24 animate-pulse rounded-full bg-beige" />
        <div className="h-6 w-48 animate-pulse rounded bg-beige sm:w-56" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-beige/70" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-beige/70" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-beige/70" />
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
          className="h-10 animate-pulse rounded-lg bg-beige"
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
    <div className="relative min-h-full flex-1 overflow-hidden">
      <BotanicalPageDecor />

      <header className="relative border-b border-border-soft/80 bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-sage uppercase">
              ZenBlog
            </p>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-forest">
              Discover stories
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-muted sm:inline">
                  {user?.email}
                </span>
                <Link href="/blogs/new" className="btn-primary px-3.5 py-2">
                  Create New Blog
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="btn-secondary px-3 py-2"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-secondary px-3.5 py-2">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-forest uppercase">
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
                    ? "bg-forest text-paper"
                    : "bg-surface text-muted ring-1 ring-border-soft hover:bg-beige/70"
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
                      ? "bg-forest text-paper"
                      : "bg-surface text-muted ring-1 ring-border-soft hover:bg-beige/70"
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
              <h2 className="font-serif text-2xl font-bold tracking-tight text-forest">
                {selectedCategoryName}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {blogsQuery.isLoading
                  ? "Loading posts…"
                  : `${blogsQuery.data?.length ?? 0} post${(blogsQuery.data?.length ?? 0) === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          <BotanicalLeafDivider className="mb-8" />

          {blogsError ? (
            <div
              role="alert"
              className="card-surface px-5 py-6 text-sm text-red-700"
            >
              <p className="font-medium">Couldn’t load blogs</p>
              <p className="mt-1">{blogsError}</p>
              <button
                type="button"
                onClick={() => blogsQuery.refetch()}
                className="btn-primary mt-4"
              >
                Try again
              </button>
            </div>
          ) : blogsQuery.isLoading ? (
            <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <BlogCardSkeleton key={index} />
              ))}
            </div>
          ) : (blogsQuery.data?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-soft bg-surface px-6 py-16 text-center">
              <p className="font-serif text-lg font-bold text-forest">
                No posts yet
              </p>
              <p className="mt-1 text-sm text-muted">
                {selectedCategoryId
                  ? "Try another category or view all posts."
                  : "Check back soon for new stories."}
              </p>
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
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
