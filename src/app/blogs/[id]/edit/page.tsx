"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { fetchBlogById, updateBlog } from "@/api/blogs";
import { fetchCategories } from "@/api/categories";
import { getApiErrorMessages } from "@/api/httpClient";
import { uploadImage } from "@/api/media";
import type { UpdateBlogCommand } from "@/api/types";
import { PageSkeleton } from "@/components/PageSkeleton";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { IMAGE_ACCEPT, validateImageFile } from "@/lib/imageValidation";
import { useToast } from "@/providers/ToastProvider";

type FieldErrors = {
  title?: string;
  description?: string;
  categoryId?: string;
};

function validateEditBlogForm(values: {
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

function EditBlogForm() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toastError, toastSuccess } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImagePublicId, setCoverImagePublicId] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const blogQuery = useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlogById(id),
    enabled: Boolean(id),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  useEffect(() => {
    if (!blogQuery.data || hydrated) return;

    if (user && blogQuery.data.userId !== user.id) {
      toastError(
        new Error("You can only edit your own posts."),
        "Not allowed",
      );
      router.replace(`/blogs/${id}`);
      return;
    }

    setTitle(blogQuery.data.title);
    setDescription(blogQuery.data.description);
    setCategoryId(blogQuery.data.categoryId);
    setCoverImageUrl(blogQuery.data.coverImageUrl ?? "");
    setCoverImagePublicId(blogQuery.data.coverImagePublicId ?? "");
    setHydrated(true);
  }, [blogQuery.data, hydrated, id, router, toastError, user]);

  const mutation = useMutation({
    mutationFn: (command: UpdateBlogCommand) => updateBlog(id, command),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["blogs"] });
      await queryClient.invalidateQueries({ queryKey: ["blog", id] });
      toastSuccess("Your changes are saved.", "Post updated");
      router.push(`/blogs/${id}`);
    },
    onError: (error: unknown) => {
      const messages = getApiErrorMessages(error);
      setFormErrors(messages);
      toastError(error, "Couldn’t update blog");
    },
  });

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormErrors([]);

    const nextErrors = validateEditBlogForm({
      title,
      description,
      categoryId,
    });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    mutation.mutate({
      id,
      title: title.trim(),
      description: description.trim(),
      categoryId,
      coverImageUrl: coverImageUrl.trim() || null,
      coverImagePublicId: coverImagePublicId.trim() || null,
    });
  }

  async function handleCoverChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setCoverUploadError(validationError);
      return;
    }

    setCoverUploading(true);
    setCoverUploadError(null);
    try {
      const uploaded = await uploadImage(file, "BlogCover");
      setCoverImageUrl(uploaded.url);
      setCoverImagePublicId(uploaded.publicId);
    } catch (error) {
      setCoverUploadError(getApiErrorMessages(error).join("; "));
    } finally {
      setCoverUploading(false);
    }
  }

  if (blogQuery.isLoading || !hydrated) {
    return <PageSkeleton variant="form" />;
  }

  if (blogQuery.isError) {
    return (
      <main className="min-h-full flex-1 bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700">
          <p className="font-medium">Couldn’t load this post</p>
          <p className="mt-1">
            {getApiErrorMessages(blogQuery.error).join("; ")}
          </p>
          <Link
            href={`/blogs/${id}`}
            className="mt-4 inline-flex rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-800"
          >
            Back to blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full flex-1 bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8">
          <Link
            href={`/blogs/${id}`}
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
          >
            ← Back to blog
          </Link>
          <h1 className="mt-3 font-title text-3xl font-semibold tracking-tight text-zinc-900">
            Edit Blog
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Update the details below, then save your changes.
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
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Cover image
            </span>
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded CDN URL
              <img
                src={coverImageUrl}
                alt=""
                className="mb-3 aspect-[16/9] w-full rounded-lg object-cover"
              />
            ) : null}
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              onChange={handleCoverChange}
              disabled={coverUploading || mutation.isPending}
              className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />
            {coverUploading ? (
              <p className="mt-1.5 text-sm text-zinc-500">Uploading…</p>
            ) : null}
            {coverUploadError ? (
              <p className="mt-1.5 text-sm text-red-600">{coverUploadError}</p>
            ) : null}
            {coverImageUrl ? (
              <button
                type="button"
                onClick={() => {
                  setCoverImageUrl("");
                  setCoverImagePublicId("");
                  setCoverUploadError(null);
                }}
                disabled={coverUploading || mutation.isPending}
                className="mt-2 text-sm font-medium text-zinc-600 underline-offset-2 hover:underline"
              >
                Remove cover
              </button>
            ) : null}
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={`/blogs/${id}`}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={
                mutation.isPending ||
                categoriesQuery.isLoading ||
                coverUploading
              }
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function EditBlogPage() {
  return (
    <RequireAuth>
      <EditBlogForm />
    </RequireAuth>
  );
}
