import { httpClient } from "./httpClient";
import type { GetCategoryQueryResult } from "./types";

export function fetchCategories() {
  return httpClient<GetCategoryQueryResult[]>("/api/categories");
}
