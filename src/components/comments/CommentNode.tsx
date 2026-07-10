"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "@/api/comments";
import type { CommentResult } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/providers/ToastProvider";

type CommentNodeProps = {
  comment: CommentResult;
  blogId: string;
};

export function CommentNode({ comment, blogId }: CommentNodeProps) {
  const { isAuthenticated } = useAuth();
  const { toastError, toastSuccess } = useToast();
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);

  const replies = comment.replies ?? [];
  const authorName = comment.user?.username ?? "Anonymous";

  const replyMutation = useMutation({
    mutationFn: createComment,
    onSuccess: async () => {
      setReplyBody("");
      setIsReplying(false);
      setReplyError(null);
      await queryClient.invalidateQueries({
        queryKey: ["comments", blogId],
      });
      toastSuccess("Your reply was posted.", "Reply added");
    },
    onError: (error: unknown) => {
      toastError(error, "Couldn’t post reply");
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
      <div className="rounded-xl border border-border-soft/80 bg-surface px-4 py-3 shadow-sm shadow-forest/5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-forest">{authorName}</p>
          <time
            className="text-xs text-sage"
            dateTime={comment.createdAt}
          >
            {comment.createdAt
              ? new Date(comment.createdAt).toLocaleString()
              : ""}
          </time>
        </div>
        <p
          dir="auto"
          className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted text-start"
        >
          {comment.body}
        </p>

        {isAuthenticated && (
          <div className="mt-3">
            {!isReplying ? (
              <button
                type="button"
                onClick={() => setIsReplying(true)}
                className="text-sm font-medium text-olive transition hover:text-forest"
              >
                Reply
              </button>
            ) : (
              <form onSubmit={handleReplySubmit} className="space-y-2">
                <textarea
                  dir="auto"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Write a reply…"
                  className="input-field resize-y text-sm text-start"
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
                    className="btn-primary px-3 py-1.5"
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
                    className="btn-secondary px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {replies.length > 0 && (
        <ul className="mt-3 space-y-3 border-l border-border-soft ps-4 sm:ps-6">
          {replies.map((reply) => (
            <CommentNode key={reply.id} comment={reply} blogId={blogId} />
          ))}
        </ul>
      )}
    </li>
  );
}
