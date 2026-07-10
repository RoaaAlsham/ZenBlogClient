import { httpClient } from "./httpClient";
import type { CreateBlogCommand, CreateBlogResult, GetBlogsQueryResult } from "./types";

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

export function createBlog(command: CreateBlogCommand) {
  return httpClient<CreateBlogResult>("/api/blogs", {
    method: "POST",
    body: command,
  });
}
