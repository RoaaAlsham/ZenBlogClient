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
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-900">{authorName}</p>
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

        {isAuthenticated && (
          <div className="mt-3">
            {!isReplying ? (
              <button
                type="button"
                onClick={() => setIsReplying(true)}
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
              >
                Reply
              </button>
            ) : (
              <form onSubmit={handleReplySubmit} className="space-y-2">
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
            )}
          </div>
        )}
      </div>

      {replies.length > 0 && (
        <ul className="mt-3 space-y-3 border-l border-zinc-200 pl-4 sm:pl-6">
          {replies.map((reply) => (
            <CommentNode key={reply.id} comment={reply} blogId={blogId} />
          ))}
        </ul>
      )}
    </li>
  );
}
