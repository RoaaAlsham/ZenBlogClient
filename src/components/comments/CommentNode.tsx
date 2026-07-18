"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment, deleteComment } from "@/api/comments";
import type { CommentResult } from "@/api/types";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/providers/ToastProvider";

type CommentNodeProps = {
  comment: CommentResult;
  blogId: string;
};

export function CommentNode({ comment, blogId }: CommentNodeProps) {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { toastError, toastSuccess } = useToast();
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const replies = comment.replies ?? [];
  const authorName = comment.user?.username ?? "Anonymous";
  const authorUsername = comment.user?.username;
  const canDelete =
    Boolean(user?.id) && (user?.id === comment.userId || isAdmin);

  const replyMutation = useMutation({
    mutationFn: createComment,
    onSuccess: async () => {
      setReplyBody("");
      setIsReplying(false);
      setReplyError(null);
      setRepliesOpen(true);
      await queryClient.invalidateQueries({
        queryKey: ["comments", blogId],
      });
      toastSuccess("Your reply was posted.", "Reply added");
    },
    onError: (error: unknown) => {
      toastError(error, "Couldn’t post reply");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(comment.id),
    onSuccess: async () => {
      setConfirmDelete(false);
      await queryClient.invalidateQueries({
        queryKey: ["comments", blogId],
      });
      toastSuccess("The comment has been removed.", "Comment deleted");
    },
    onError: (error: unknown) => {
      toastError(error, "Couldn’t delete comment");
    },
  });

  function handleReplySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = replyBody.trim();
    if (!body) {
      setReplyError("Comment body is required.");
      return;
    }
    if (body.length > 1000) {
      setReplyError("Comment cannot exceed 1000 characters.");
      return;
    }

    setReplyError(null);
    replyMutation.mutate({
      body,
      blogId,
      parentCommentId: comment.id,
    });
  }

  return (
    <li className="list-none">
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {authorUsername ? (
            <Link
              href={`/authors/${encodeURIComponent(authorUsername)}`}
              className="text-sm font-medium text-zinc-900 hover:underline"
            >
              {authorName}
            </Link>
          ) : (
            <p className="text-sm font-medium text-zinc-900">{authorName}</p>
          )}
          <time
            className="text-xs text-zinc-400"
            dateTime={comment.createdAt}
          >
            {comment.createdAt
              ? new Date(comment.createdAt).toLocaleString()
              : ""}
          </time>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
          {comment.body}
        </p>

        {(isAuthenticated || canDelete) && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {isAuthenticated && (
              <>
                {!isReplying ? (
                  <button
                    type="button"
                    onClick={() => setIsReplying(true)}
                    className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
                  >
                    Reply
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm font-medium text-red-600 transition hover:text-red-800 disabled:opacity-60"
                  >
                    Delete
                  </button>
                ) : null}
              </>
            )}
          </div>
        )}

        {isAuthenticated && isReplying ? (
          <form onSubmit={handleReplySubmit} className="mt-3 space-y-2">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Write a reply…"
              className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              autoFocus
            />
            {replyError && (
              <p role="alert" className="text-sm text-red-600">
                {replyError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={replyMutation.isPending}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {replyMutation.isPending ? "Posting…" : "Post reply"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false);
                  setReplyBody("");
                  setReplyError(null);
                }}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {replies.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setRepliesOpen((open) => !open)}
            aria-expanded={repliesOpen}
            className="mt-3 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
          >
            {repliesOpen
              ? "Hide replies"
              : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
          </button>

          {repliesOpen && (
            <ul className="mt-3 space-y-3 border-l border-zinc-200 pl-4 sm:pl-6">
              {replies.map((reply) => (
                <CommentNode key={reply.id} comment={reply} blogId={blogId} />
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmModal
        open={confirmDelete}
        title="Delete this comment?"
        description={
          replies.length > 0 ? (
            <>
              This permanently removes this comment and its{" "}
              {replies.length === 1 ? "reply" : `${replies.length} replies`}.
              This cannot be undone.
            </>
          ) : (
            <>This permanently removes this comment. This cannot be undone.</>
          )
        }
        confirmLabel="Delete comment"
        cancelLabel="Keep comment"
        danger
        confirming={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) setConfirmDelete(false);
        }}
        onConfirm={() => deleteMutation.mutate()}
      />
    </li>
  );
}
