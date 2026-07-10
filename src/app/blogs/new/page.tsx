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
  const [blogImageUrl, setBlogImageUrl] = useState("");
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
      blogImageUrl: blogImageUrl.trim(),
    });
  }

  return (
    <main className="min-h-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-sage transition hover:text-forest"
          >
            ← Back to posts
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest">
            Create New Blog
          </h1>
          <p className="mt-2 text-sm text-muted">
            Fill in the details below. Your account is attached automatically
            from your session.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-surface space-y-5 p-6 sm:p-8"
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
            <span className="mb-1.5 block text-sm font-medium text-forest">
              Title
            </span>
            <input
              type="text"
              name="title"
              dir="auto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-start"
              placeholder="A clear, compelling title"
              aria-invalid={Boolean(fieldErrors.title)}
            />
            {fieldErrors.title && (
              <p className="mt-1.5 text-sm text-red-600">{fieldErrors.title}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-forest">
              Description
            </span>
            <textarea
              name="description"
              dir="auto"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-y text-start"
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
            <span className="mb-1.5 block text-sm font-medium text-forest">
              Category
            </span>
            {categoriesQuery.isLoading ? (
              <div className="h-11 animate-pulse rounded-lg bg-beige" />
            ) : (
              <select
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={categoriesQuery.isError}
                className="input-field disabled:cursor-not-allowed disabled:bg-beige/40"
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
            <span className="mb-1.5 block text-sm font-medium text-forest">
              Cover image URL
            </span>
            <input
              type="url"
              name="coverImageUrl"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="input-field"
              placeholder="https://…"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-forest">
              Blog image URL
            </span>
            <input
              type="url"
              name="blogImageUrl"
              value={blogImageUrl}
              onChange={(e) => setBlogImageUrl(e.target.value)}
              className="input-field"
              placeholder="https://…"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending || categoriesQuery.isLoading}
              className="btn-primary"
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
