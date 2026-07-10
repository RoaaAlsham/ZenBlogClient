"use client";

import Link from "next/link";
import { FormEvent, use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBlogById } from "@/api/blogs";
import { createComment, fetchCommentsByBlogId } from "@/api/comments";
import { getApiErrorMessages } from "@/api/httpClient";
import {
  BotanicalLeafDivider,
  BotanicalPageDecor,
} from "@/components/botanical/BotanicalDecor";
import { CommentNode } from "@/components/comments/CommentNode";
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
      <div className="h-4 w-32 rounded bg-beige" />
      <div className="aspect-[21/9] rounded-2xl bg-beige" />
      <div className="h-10 w-64 rounded bg-beige sm:w-96" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-beige/70" />
        <div className="h-4 w-full rounded bg-beige/70" />
        <div className="h-4 w-2/3 rounded bg-beige/70" />
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
    <form onSubmit={handleSubmit} className="card-surface p-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-forest">
          Leave a comment
        </span>
        <textarea
          dir="auto"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Share your thoughts…"
          className="input-field resize-y text-sm text-start"
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
          className="btn-primary"
        >
          {mutation.isPending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { id } = use(params);
  const { isAuthenticated } = useAuth();

  const blogQuery = useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlogById(id),
  });

  const commentsQuery = useQuery({
    queryKey: ["comments", id],
    queryFn: () => fetchCommentsByBlogId(id),
  });

  const cover =
    blogQuery.data?.coverImageUrl || blogQuery.data?.blogImageUrl || null;

  return (
    <main className="relative min-h-full flex-1 overflow-hidden">
      <BotanicalPageDecor />

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-medium text-sage transition hover:text-forest"
        >
          ← Back to posts
        </Link>

        <div className="mt-6">
          {blogQuery.isLoading ? (
            <BlogDetailSkeleton />
          ) : blogQuery.isError ? (
            <div
              role="alert"
              className="card-surface px-5 py-6 text-sm text-red-700"
            >
              <p className="font-medium">Couldn’t load this blog</p>
              <p className="mt-1">{errorMessage(blogQuery.error)}</p>
              <button
                type="button"
                onClick={() => blogQuery.refetch()}
                className="btn-primary mt-4"
              >
                Try again
              </button>
            </div>
          ) : blogQuery.data ? (
            <article>
              {cover && (
                <div className="mb-8 overflow-hidden rounded-2xl border border-border-soft/80 bg-beige/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover}
                    alt=""
                    className="aspect-[21/9] w-full object-cover"
                  />
                </div>
              )}

              <div className="mb-4">
                <span className="rounded-full bg-beige px-2.5 py-1 text-xs font-medium text-olive">
                  {blogQuery.data.category?.categoryName ?? "Uncategorized"}
                </span>
              </div>

              <h1
                dir="auto"
                className="font-serif text-3xl font-bold leading-tight tracking-tight text-forest text-start sm:text-4xl"
              >
                {blogQuery.data.title}
              </h1>

              <p
                dir="auto"
                className="mt-6 whitespace-pre-wrap text-base leading-8 text-muted text-start"
              >
                {blogQuery.data.description}
              </p>
            </article>
          ) : null}
        </div>

        <BotanicalLeafDivider className="mt-12" />

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-forest">
            Comments
          </h2>

          <div className="mt-6 space-y-6">
            {isAuthenticated ? (
              <TopLevelCommentForm blogId={id} />
            ) : (
              <p className="rounded-xl border border-dashed border-border-soft bg-surface px-4 py-3 text-sm text-muted">
                <Link
                  href={`/login?next=${encodeURIComponent(`/blogs/${id}`)}`}
                  className="font-medium text-forest underline-offset-2 hover:underline"
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
                    className="h-24 animate-pulse rounded-xl bg-beige"
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
              <p className="text-sm text-muted">
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
    </main>
  );
}
