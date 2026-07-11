"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteBlog, fetchBlogs } from "@/api/blogs";
import { getApiErrorMessages } from "@/api/httpClient";
import type { GetBlogsQueryResult } from "@/api/types";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/providers/ToastProvider";

export function BlogsAdminTab() {
  const queryClient = useQueryClient();
  const { toastError, toastSuccess } = useToast();
  const [pendingDelete, setPendingDelete] =
    useState<GetBlogsQueryResult | null>(null);

  const blogsQuery = useQuery({
    queryKey: ["blogs", "all"],
    queryFn: fetchBlogs,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: async (_data, id) => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["blogs"] });
      await queryClient.removeQueries({ queryKey: ["blog", id] });
      toastSuccess("The post has been removed.", "Blog deleted");
    },
    onError: (error: unknown) => {
      toastError(error, "Couldn’t delete blog");
    },
  });

  if (blogsQuery.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl bg-zinc-200"
          />
        ))}
      </div>
    );
  }

  if (blogsQuery.isError) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700"
      >
        <p className="font-medium">Couldn’t load blogs</p>
        <p className="mt-1">
          {getApiErrorMessages(blogsQuery.error).join("; ")}
        </p>
        <button
          type="button"
          onClick={() => blogsQuery.refetch()}
          className="mt-4 rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const blogs = blogsQuery.data ?? [];

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="text-sm text-zinc-600">
          {blogs.length} post{blogs.length === 1 ? "" : "s"} across the site
        </p>
      </div>

      {blogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center text-sm text-zinc-600">
          No blogs published yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <ul className="divide-y divide-zinc-100">
            {blogs.map((blog) => (
              <li
                key={blog.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/blogs/${blog.id}`}
                    className="truncate text-sm font-semibold text-zinc-900 hover:underline"
                  >
                    {blog.title}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">
                    {blog.category?.categoryName ?? "Uncategorized"}
                    <span className="mx-1.5 text-zinc-300">·</span>
                    Author ID {blog.userId.slice(0, 8)}…
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDelete(blog)}
                  className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        confirming={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
        }}
      />
    </>
  );
}
