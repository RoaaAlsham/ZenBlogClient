"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogsByUserId } from "@/api/blogs";
import { getApiErrorMessages } from "@/api/httpClient";
import type { GetBlogsQueryResult } from "@/api/types";
import { fetchPublicUserByUsername } from "@/api/users";
import { PageSkeleton } from "@/components/PageSkeleton";

function AuthorPostCard({ blog }: { blog: GetBlogsQueryResult }) {
  const cover = blog.coverImageUrl;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm sm:flex-row">
      <Link
        href={`/blogs/${blog.id}`}
        className="relative aspect-[16/10] shrink-0 overflow-hidden bg-zinc-100 sm:aspect-auto sm:w-48"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- cover URLs come from the API
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-28 items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-xs text-zinc-400">
            No cover
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
            {blog.category?.categoryName ?? "Uncategorized"}
          </span>
          <h3 className="mt-2 truncate text-lg font-semibold tracking-tight text-zinc-900">
            <Link href={`/blogs/${blog.id}`} className="hover:underline">
              {blog.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600">
            {blog.description}
          </p>
        </div>

        <div>
          <Link
            href={`/blogs/${blog.id}`}
            className="text-sm font-medium text-zinc-700 underline-offset-2 hover:underline"
          >
            Read post
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function AuthorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = use(params);
  const username = decodeURIComponent(rawUsername);

  const authorQuery = useQuery({
    queryKey: ["users", "by-username", username],
    queryFn: () => fetchPublicUserByUsername(username),
    enabled: Boolean(username),
    retry: false,
  });

  const blogsQuery = useQuery({
    queryKey: ["blogs", "user", authorQuery.data?.id],
    queryFn: () => fetchBlogsByUserId(authorQuery.data!.id),
    enabled: Boolean(authorQuery.data?.id),
  });

  if (authorQuery.isLoading) {
    return <PageSkeleton variant="page" />;
  }

  if (authorQuery.isError || !authorQuery.data) {
    const message = authorQuery.error
      ? getApiErrorMessages(authorQuery.error).join("; ")
      : "Author not found.";

    return (
      <main className="min-h-full flex-1 bg-zinc-50">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
          >
            ← Back to posts
          </Link>
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
            <p className="text-base font-medium text-zinc-900">
              Author not found
            </p>
            <p className="mt-1 text-sm text-zinc-600">{message}</p>
          </div>
        </div>
      </main>
    );
  }

  const author = authorQuery.data;
  const firstName = author.firstName ?? "";
  const lastName = author.lastName ?? "";
  const displayName =
    `${firstName} ${lastName}`.trim() || author.username || "Author";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    author.username.charAt(0).toUpperCase() ||
    "?";
  const blogs = blogsQuery.data ?? [];
  const blogsError = blogsQuery.isError
    ? getApiErrorMessages(blogsQuery.error).join("; ")
    : null;

  return (
    <main className="min-h-full flex-1 bg-zinc-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
        >
          ← Back to posts
        </Link>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-100 sm:mx-0">
              {author.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- profile URLs come from the API
                <img
                  src={author.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-400">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-zinc-600">@{author.username}</p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              Published posts
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {blogsQuery.isLoading
                ? "Loading posts…"
                : `${blogs.length} post${blogs.length === 1 ? "" : "s"}`}
            </p>
          </div>

          {blogsError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700"
            >
              <p className="font-medium">Couldn’t load posts</p>
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
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-2xl bg-zinc-200"
                />
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
              <p className="text-base font-medium text-zinc-900">
                No published posts yet
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                This author has not published anything yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {blogs.map((blog) => (
                <AuthorPostCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
