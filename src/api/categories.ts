import { httpClient } from "./httpClient";
import type {
  CreateCategoryCommand,
  GetCategoryQueryResult,
  UpdateCategoryCommand,
} from "./types";

export function fetchCategories() {
  return httpClient<GetCategoryQueryResult[]>("/api/categories");
}

export function createCategory(command: CreateCategoryCommand) {
  return httpClient<void>("/api/categories", {
    method: "POST",
    body: command,
  });
}

export function updateCategory(id: string, command: UpdateCategoryCommand) {
  return httpClient<void>(`/api/categories/${id}`, {
    method: "PUT",
    body: command,
  });
}

export function deleteCategory(id: string) {
  return httpClient<void>(`/api/categories/${id}`, {
    method: "DELETE",
  });
}
