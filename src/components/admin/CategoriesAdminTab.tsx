"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/api/categories";
import { getApiErrorMessages } from "@/api/httpClient";
import type { GetCategoryQueryResult } from "@/api/types";
import { CategoryFormModal } from "@/components/admin/CategoryFormModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/providers/ToastProvider";

type CategoryModalState =
  | { mode: "create" }
  | { mode: "edit"; category: GetCategoryQueryResult }
  | null;

export function CategoriesAdminTab() {
  const queryClient = useQueryClient();
  const { toastError, toastSuccess } = useToast();
  const [formState, setFormState] = useState<CategoryModalState>(null);
  const [pendingDelete, setPendingDelete] =
    useState<GetCategoryQueryResult | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: (categoryName: string) => createCategory({ categoryName }),
    onSuccess: async () => {
      setFormState(null);
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      toastSuccess("Category created.", "Success");
    },
    onError: (error: unknown) => toastError(error, "Couldn’t create category"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, categoryName }: { id: string; categoryName: string }) =>
      updateCategory(id, { id, categoryName }),
    onSuccess: async () => {
      setFormState(null);
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      toastSuccess("Category updated.", "Success");
    },
    onError: (error: unknown) => toastError(error, "Couldn’t update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      toastSuccess("Category deleted.", "Success");
    },
    onError: (error: unknown) => toastError(error, "Couldn’t delete category"),
  });

  if (categoriesQuery.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-xl bg-zinc-200"
          />
        ))}
      </div>
    );
  }

  if (categoriesQuery.isError) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700"
      >
        <p className="font-medium">Couldn’t load categories</p>
        <p className="mt-1">
          {getApiErrorMessages(categoriesQuery.error).join("; ")}
        </p>
        <button
          type="button"
          onClick={() => categoriesQuery.refetch()}
          className="mt-4 rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const categories = categoriesQuery.data ?? [];
  const formSubmitting =
    createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">
          {categories.length} categor{categories.length === 1 ? "y" : "ies"}
        </p>
        <button
          type="button"
          onClick={() => setFormState({ mode: "create" })}
          className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Add New Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center text-sm text-zinc-600">
          No categories yet. Create one to organize posts.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 sm:px-5">Name</th>
                <th className="px-4 py-3 sm:px-5">Posts</th>
                <th className="px-4 py-3 sm:px-5">Created</th>
                <th className="px-4 py-3 text-right sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {categories.map((category) => (
                <tr key={category.id} className="align-middle">
                  <td className="px-4 py-3 font-medium text-zinc-900 sm:px-5">
                    {category.categoryName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 sm:px-5">
                    {category.blogs?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 sm:px-5">
                    {category.createdAt
                      ? new Date(category.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right sm:px-5">
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormState({ mode: "edit", category })
                        }
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(category)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryFormModal
        open={Boolean(formState)}
        mode={formState?.mode === "edit" ? "edit" : "create"}
        initialName={
          formState?.mode === "edit" ? formState.category.categoryName : ""
        }
        submitting={formSubmitting}
        onCancel={() => {
          if (!formSubmitting) setFormState(null);
        }}
        onSubmit={(categoryName) => {
          if (!formState) return;
          if (formState.mode === "create") {
            createMutation.mutate(categoryName);
            return;
          }
          updateMutation.mutate({
            id: formState.category.id,
            categoryName,
          });
        }}
      />

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete this category?"
        description={
          <>
            This permanently removes{" "}
            <span className="font-medium text-zinc-800">
              {pendingDelete?.categoryName ?? "this category"}
            </span>
            . Categories with posts may fail to delete on the server.
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        confirming={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
        }}
      />
    </>
  );
}
