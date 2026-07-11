"use client";

import Link from "next/link";
import { FormEvent, use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { deleteBlog, fetchBlogById } from "@/api/blogs";
import { createComment, fetchCommentsByBlogId } from "@/api/comments";
import { getApiErrorMessages } from "@/api/httpClient";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CommentNode } from "@/components/comments/CommentNode";
import { MarkdownContent } from "@/components/MarkdownContent";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/providers/ToastProvider";

type BlogDetailPageProps = {
  params: Promise<{ id: string }>;
};

function errorMessage(error: unknown): string {
  return getApiErrorMessages(error).join("; ");
}

function BlogDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-32 rounded bg-zinc-200" />
      <div className="aspect-[21/9] rounded-2xl bg-zinc-200" />
      <div className="h-10 w-64 rounded bg-zinc-200 sm:w-96" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-zinc-100" />
        <div className="h-4 w-full rounded bg-zinc-100" />
        <div className="h-4 w-2/3 rounded bg-zinc-100" />
      </div>
    </div>
  );
}

function TopLevelCommentForm({ blogId }: { blogId: string }) {
  const queryClient = useQueryClient();
  const { toastError, toastSuccess } = useToast();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createComment,
    onSuccess: async () => {
      setBody("");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["comments", blogId] });
      toastSuccess("Your comment was posted.", "Comment added");
    },
    onError: (err: unknown) => {
      setError(errorMessage(err));
      toastError(err, "Couldn’t post comment");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      setError("Comment body is required.");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Comment cannot exceed 1000 characters.");
      return;
    }

    setError(null);
    mutation.mutate({
      body: trimmed,
      blogId,
      parentCommentId: null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">
          Leave a comment
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Share your thoughts…"
          className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {mutation.isPending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { toastError, toastSuccess } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const blogQuery = useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlogById(id),
  });

  const commentsQuery = useQuery({
    queryKey: ["comments", id],
    queryFn: () => fetchCommentsByBlogId(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBlog(id),
    onSuccess: async () => {
      setDeleteOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["blogs"] });
      await queryClient.removeQueries({ queryKey: ["blog", id] });
      toastSuccess("The post has been removed.", "Blog deleted");
      router.push("/");
    },
    onError: (error: unknown) => {
      toastError(error, "Couldn’t delete blog");
    },
  });

  const cover = blogQuery.data?.coverImageUrl || null;
  const isAuthor =
    Boolean(user?.id) && blogQuery.data?.userId === user?.id;

  return (
    <main className="min-h-full flex-1 bg-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
        >
          ← Back to posts
        </Link>

        <div className="mt-6">
          {blogQuery.isLoading ? (
            <BlogDetailSkeleton />
          ) : blogQuery.isError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700"
            >
              <p className="font-medium">Couldn’t load this blog</p>
              <p className="mt-1">{errorMessage(blogQuery.error)}</p>
              <button
                type="button"
                onClick={() => blogQuery.refetch()}
                className="mt-4 rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
              >
                Try again
              </button>
            </div>
          ) : blogQuery.data ? (
            <article>
              {cover && (
                <div className="mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover}
                    alt=""
                    className="aspect-[21/9] w-full object-cover"
                  />
                </div>
              )}

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-zinc-200/80 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  {blogQuery.data.category?.categoryName ?? "Uncategorized"}
                </span>
                {blogQuery.data.user?.username ? (
                  <Link
                    href={`/authors/${encodeURIComponent(blogQuery.data.user.username)}`}
                    className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 hover:underline"
                  >
                    By @{blogQuery.data.user.username}
                  </Link>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <h1
                  dir="auto"
                  className="font-writer text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl"
                >
                  {blogQuery.data.title}
                </h1>

                {isAuthor && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/blogs/${id}/edit`}
                      className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                    >
                      Edit Blog
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    >
                      Delete Blog
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <MarkdownContent content={blogQuery.data.description} />
              </div>
            </article>
          ) : null}
        </div>

        <section className="mt-14 border-t border-zinc-200 pt-10">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Comments
          </h2>

          <div className="mt-6 space-y-6">
            {isAuthenticated ? (
              <TopLevelCommentForm blogId={id} />
            ) : (
              <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-600">
                <Link
                  href={`/login?next=${encodeURIComponent(`/blogs/${id}`)}`}
                  className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to join the discussion.
              </p>
            )}

            {commentsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-xl bg-zinc-200"
                  />
                ))}
              </div>
            ) : commentsQuery.isError ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {errorMessage(commentsQuery.error)}
                <button
                  type="button"
                  onClick={() => commentsQuery.refetch()}
                  className="ml-3 font-medium underline"
                >
                  Retry
                </button>
              </div>
            ) : (commentsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-zinc-500">
                No comments yet. Be the first to share a thought.
              </p>
            ) : (
              <ul className="space-y-4">
                {(commentsQuery.data ?? []).map((comment) => (
                  <CommentNode
                    key={comment.id}
                    comment={comment}
                    blogId={id}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <ConfirmModal
        open={deleteOpen}
        title="Delete this blog?"
        description={
          <>
            This permanently removes{" "}
            <span className="font-medium text-zinc-800">
              {blogQuery.data?.title ?? "this post"}
            </span>
            . This action cannot be undone.
          </>
        }
        confirmLabel="Delete Blog"
        cancelLabel="Keep post"
        danger
        confirming={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) setDeleteOpen(false);
        }}
        onConfirm={() => deleteMutation.mutate()}
      />
    </main>
  );
}
