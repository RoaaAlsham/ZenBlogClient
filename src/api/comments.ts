import { httpClient } from "./httpClient";
import type {
  CommentResult,
  CreateCommentCommand,
  CreateCommentResult,
} from "./types";

export function fetchCommentsByBlogId(blogId: string) {
  return httpClient<CommentResult[]>(`/api/comments/blog/${blogId}`);
}

export function createComment(command: CreateCommentCommand) {
  return httpClient<CreateCommentResult>("/api/comments", {
    method: "POST",
    body: command,
  });
}

export function deleteComment(id: string) {
  return httpClient<void>(`/api/comments/${id}`, {
    method: "DELETE",
  });
}
