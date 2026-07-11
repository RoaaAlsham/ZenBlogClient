"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteBlog, fetchBlogs } from "@/api/blogs";
import { getApiErrorMessages } from "@/api/httpClient";
import type { GetBlogsQueryResult } from "@/api/types";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PageSkeleton } from "@/components/PageSkeleton";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/providers/ToastProvider";

function ProfilePostCard({
  blog,
  onDelete,
  isDeleting,
}: {
  blog: GetBlogsQueryResult;
  onDelete: (blog: GetBlogsQueryResult) => void;
  isDeleting: boolean;
}) {
  const cover = blog.coverImageUrl || blog.blogImageUrl;

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

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/blogs/${blog.id}/edit`}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Edit Post
          </Link>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onDelete(blog)}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Delete Post"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toastError, toastSuccess } = useToast();
  const [pendingDelete, setPendingDelete] =
    useState<GetBlogsQueryResult | null>(null);

  const blogsQuery = useQuery({
    queryKey: ["blogs", "all"],
    queryFn: fetchBlogs,
  });

  const myBlogs = useMemo(() => {
    if (!user || !blogsQuery.data) return [];
    return blogsQuery.data.filter((blog) => blog.userId === user.id);
  }, [blogsQuery.data, user]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: async (_data, id) => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["blogs"] });
      await queryClient.removeQueries({ queryKey: ["blog", id] });
      toastSuccess("The post has been removed.", "Post deleted");
    },
    onError: (error: unknown) => {
      toastError(error, "Couldn’t delete post");
    },
  });

  if (!user) {
    return <PageSkeleton variant="page" />;
  }

  const firstName = user.firstName ?? "";
  const lastName = user.lastName ?? "";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    (user.email?.charAt(0).toUpperCase() ?? "?");

  const blogsError = blogsQuery.isError
    ? getApiErrorMessages(blogsQuery.error).join("; ")
    : null;

  return (
    <main className="min-h-full flex-1 bg-zinc-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
            >
              ← Back to posts
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
              Your profile
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Account details and the posts you have published.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Log out
          </button>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-100 sm:mx-0">
              {user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- profile URLs come from the API
                <img
                  src={user.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-400">
                  {initials}
                </div>
              )}
            </div>

            <dl className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  First name
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-900">
                  {firstName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Last name
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-900">
                  {lastName || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Email
                </dt>
                <dd className="mt-1 break-all text-sm font-medium text-zinc-900">
                  {user.email}
                </dd>
              </div>
              {user.imageUrl ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Image URL
                  </dt>
                  <dd className="mt-1 break-all text-sm text-zinc-700">
                    {user.imageUrl}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                My Published Posts
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {blogsQuery.isLoading
                  ? "Loading your posts…"
                  : `${myBlogs.length} post${myBlogs.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <Link
              href="/blogs/new"
              className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Create New Blog
            </Link>
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
          ) : myBlogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
              <p className="text-base font-medium text-zinc-900">
                No published posts yet
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Write your first story to see it here.
              </p>
              <Link
                href="/blogs/new"
                className="mt-5 inline-flex rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Create New Blog
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myBlogs.map((blog) => (
                <ProfilePostCard
                  key={blog.id}
                  blog={blog}
                  onDelete={setPendingDelete}
                  isDeleting={
                    deleteMutation.isPending &&
                    pendingDelete?.id === blog.id
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete this blog?"
        description={
          <>
            This permanently removes{" "}
            <span className="font-medium text-zinc-800">
              {pendingDelete?.title ?? "this post"}
            </span>
            . This action cannot be undone.
          </>
        }
        confirmLabel="Delete Post"
        cancelLabel="Keep post"
        danger
        confirming={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
        }}
      />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
