"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createBlog } from "@/api/blogs";
import { fetchCategories } from "@/api/categories";
import { getApiErrorMessages } from "@/api/httpClient";
import type { CreateBlogCommand } from "@/api/types";
import { RequireAuth } from "@/components/RequireAuth";
import { useToast } from "@/providers/ToastProvider";

type FieldErrors = {
  title?: string;
  description?: string;
  categoryId?: string;
};

function validateCreateBlogForm(values: {
  title: string;
  description: string;
  categoryId: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  }
  if (!values.description.trim()) {
    errors.description = "Description is required.";
  }
  if (!values.categoryId.trim()) {
    errors.categoryId = "Category is required.";
  }

  return errors;
}

function CreateBlogForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toastError, toastSuccess } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const mutation = useMutation({
    mutationFn: (command: CreateBlogCommand) => createBlog(command),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toastSuccess("Your post is live.", "Blog published");
      router.push("/");
    },
    onError: (error: unknown) => {
      const messages = getApiErrorMessages(error);
      setFormErrors(messages);
      toastError(error, "Couldn’t publish blog");
    },
  });

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormErrors([]);

    const nextErrors = validateCreateBlogForm({
      title,
      description,
      categoryId,
    });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      categoryId,
      coverImageUrl: coverImageUrl.trim(),
    });
  }

  return (
    <main className="min-h-full flex-1 bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
          >
            ← Back to posts
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
            Create New Blog
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Fill in the details below. Your account is attached automatically
            from your session.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
          noValidate
        >
          {formErrors.length > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <ul className="list-disc space-y-1 pl-4">
                {formErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Title
            </span>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              placeholder="A clear, compelling title"
              aria-invalid={Boolean(fieldErrors.title)}
            />
            {fieldErrors.title && (
              <p className="mt-1.5 text-sm text-red-600">{fieldErrors.title}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Description
            </span>
            <textarea
              name="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              placeholder="What is this post about?"
              aria-invalid={Boolean(fieldErrors.description)}
            />
            {fieldErrors.description && (
              <p className="mt-1.5 text-sm text-red-600">
                {fieldErrors.description}
              </p>
            )}
          </label>

          <div className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Category
            </span>
            {categoriesQuery.isLoading ? (
              <div className="h-11 animate-pulse rounded-lg bg-zinc-100" />
            ) : (
              <select
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={categoriesQuery.isError}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-50"
                aria-invalid={Boolean(fieldErrors.categoryId)}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.categoryId && (
              <p className="mt-1.5 text-sm text-red-600">
                {fieldErrors.categoryId}
              </p>
            )}
            {categoriesQuery.isError && (
              <p className="mt-1.5 text-sm text-red-600">
                {getApiErrorMessages(categoriesQuery.error).join("; ")}
              </p>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Cover image URL
            </span>
            <input
              type="url"
              name="coverImageUrl"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              placeholder="https://…"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/"
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending || categoriesQuery.isLoading}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Publishing…" : "Publish blog"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function NewBlogPage() {
  return (
    <RequireAuth>
      <CreateBlogForm />
    </RequireAuth>
  );
}
