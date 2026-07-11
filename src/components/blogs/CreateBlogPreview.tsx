"use client";

import type { FormEvent } from "react";
import type { CategoryDto } from "@/api/types";
import { getApiErrorMessages } from "@/api/httpClient";
import { MarkdownContent } from "@/components/MarkdownContent";

type CreateBlogPreviewProps = {
  title: string;
  description: string;
  categoryId: string;
  coverImageUrl: string;
  categories: CategoryDto[];
  categoriesLoading: boolean;
  categoriesError: unknown;
  fieldErrors: {
    categoryId?: string;
  };
  formErrors: string[];
  isPublishing: boolean;
  onCategoryChange: (value: string) => void;
  onCoverImageUrlChange: (value: string) => void;
  onBack: () => void;
  onPublish: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateBlogPreview({
  title,
  description,
  categoryId,
  coverImageUrl,
  categories,
  categoriesLoading,
  categoriesError,
  fieldErrors,
  formErrors,
  isPublishing,
  onCategoryChange,
  onCoverImageUrlChange,
  onBack,
  onPublish,
}: CreateBlogPreviewProps) {
  const cover = coverImageUrl.trim();

  return (
    <main className="min-h-full flex-1 bg-white px-4 py-8 sm:px-6 lg:px-10">
      <form
        onSubmit={onPublish}
        className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]"
        noValidate
      >
        <section className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Story preview
          </h1>

          <div className="mt-6 overflow-hidden rounded-2xl bg-zinc-100">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- cover URLs are user-supplied
              <img
                src={cover}
                alt=""
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center text-sm text-zinc-400">
                Include a high-quality image in your story to make it more
                inviting to readers.
              </div>
            )}
          </div>

          <h2
            dir="auto"
            className="font-writer mt-8 text-3xl font-bold leading-tight text-zinc-900"
          >
            {title.trim() || "Untitled"}
          </h2>

          <div className="font-writer mt-4">
            <MarkdownContent content={description} />
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-6 lg:pt-10">
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

          <div>
            <label
              htmlFor="categoryId"
              className="mb-2 block text-sm font-medium text-zinc-800"
            >
              Category
            </label>
            {categoriesLoading ? (
              <div className="h-11 animate-pulse rounded-full bg-zinc-100" />
            ) : (
              <select
                id="categoryId"
                name="categoryId"
                value={categoryId}
                onChange={(e) => onCategoryChange(e.target.value)}
                disabled={Boolean(categoriesError)}
                aria-invalid={Boolean(fieldErrors.categoryId)}
                className="w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.categoryId ? (
              <p className="mt-1.5 text-sm text-red-600">
                {fieldErrors.categoryId}
              </p>
            ) : null}
            {categoriesError ? (
              <p className="mt-1.5 text-sm text-red-600">
                {getApiErrorMessages(categoriesError).join("; ")}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="coverImageUrl"
              className="mb-2 block text-sm font-medium text-zinc-800"
            >
              Cover image URL
            </label>
            <input
              id="coverImageUrl"
              type="url"
              name="coverImageUrl"
              value={coverImageUrl}
              onChange={(e) => onCoverImageUrlChange(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          <button
            type="button"
            onClick={onBack}
            className="self-start text-sm font-medium text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline"
          >
            Go back to writing
          </button>

          <div className="mt-auto flex items-center justify-end gap-2 pt-4">
            <button
              type="submit"
              disabled={isPublishing || categoriesLoading}
              className="rounded-full bg-zinc-900 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishing ? "Publishing…" : "Publish"}
            </button>
          </div>
        </aside>
      </form>
    </main>
  );
}
