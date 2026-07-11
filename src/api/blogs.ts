import { httpClient } from "./httpClient";
import type {
  CreateBlogCommand,
  CreateBlogResult,
  GetBlogsQueryResult,
  UpdateBlogCommand,
} from "./types";

export function fetchBlogs() {
  return httpClient<GetBlogsQueryResult[]>("/api/blogs");
}

export function fetchBlogById(id: string) {
  return httpClient<GetBlogsQueryResult>(`/api/blogs/${id}`);
}

export function fetchBlogsByCategory(categoryId: string) {
  return httpClient<GetBlogsQueryResult[]>(
    `/api/blogs/category/${categoryId}`,
  );
}

export function fetchBlogsByUserId(userId: string) {
  return httpClient<GetBlogsQueryResult[]>(
    `/api/blogs/user/${encodeURIComponent(userId)}`,
  );
}

export function createBlog(command: CreateBlogCommand) {
  return httpClient<CreateBlogResult>("/api/blogs", {
    method: "POST",
    body: command,
  });
}

export function updateBlog(id: string, command: UpdateBlogCommand) {
  return httpClient<GetBlogsQueryResult>(`/api/blogs/${id}`, {
    method: "PUT",
    body: command,
  });
}

export function deleteBlog(id: string) {
  return httpClient<void>(`/api/blogs/${id}`, {
    method: "DELETE",
  });
}
