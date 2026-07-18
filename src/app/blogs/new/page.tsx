"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createBlog } from "@/api/blogs";
import { fetchCategories } from "@/api/categories";
import { getApiErrorMessages } from "@/api/httpClient";
import type { CreateBlogCommand } from "@/api/types";
import { CreateBlogPreview } from "@/components/blogs/CreateBlogPreview";
import { CreateBlogWriter } from "@/components/blogs/CreateBlogWriter";
import { RequireAuth } from "@/components/RequireAuth";
import { useToast } from "@/providers/ToastProvider";

type Stage = "write" | "preview";

type FieldErrors = {
  title?: string;
  description?: string;
  categoryId?: string;
};

function CreateBlogForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toastError, toastSuccess } = useToast();

  const [stage, setStage] = useState<Stage>("write");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImagePublicId, setCoverImagePublicId] = useState("");
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

  function handleContinue() {
    const nextErrors: FieldErrors = {};
    if (!title.trim()) {
      nextErrors.title = "Title is required.";
    }
    if (!description.trim()) {
      nextErrors.description = "Description is required.";
    }
    setFieldErrors(nextErrors);
    setFormErrors([]);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setStage("preview");
  }

  function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormErrors([]);

    const nextErrors: FieldErrors = {};
    if (!title.trim()) {
      nextErrors.title = "Title is required.";
    }
    if (!description.trim()) {
      nextErrors.description = "Description is required.";
    }
    if (!categoryId.trim()) {
      nextErrors.categoryId = "Category is required.";
    }
    setFieldErrors(nextErrors);
    if (nextErrors.title || nextErrors.description) {
      setStage("write");
      return;
    }
    if (nextErrors.categoryId) {
      return;
    }

    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      categoryId,
      coverImageUrl: coverImageUrl.trim() || null,
      coverImagePublicId: coverImagePublicId.trim() || null,
    });
  }

  if (stage === "write") {
    return (
      <CreateBlogWriter
        title={title}
        description={description}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onContinue={handleContinue}
        titleError={fieldErrors.title}
        descriptionError={fieldErrors.description}
      />
    );
  }

  return (
    <CreateBlogPreview
      title={title}
      description={description}
      categoryId={categoryId}
      coverImageUrl={coverImageUrl}
      coverImagePublicId={coverImagePublicId}
      categories={categories}
      categoriesLoading={categoriesQuery.isLoading}
      categoriesError={categoriesQuery.isError ? categoriesQuery.error : null}
      fieldErrors={{ categoryId: fieldErrors.categoryId }}
      formErrors={formErrors}
      isPublishing={mutation.isPending}
      onCategoryChange={setCategoryId}
      onCoverImageChange={(url, publicId) => {
        setCoverImageUrl(url);
        setCoverImagePublicId(publicId);
      }}
      onBack={() => {
        setFieldErrors((prev) => ({
          title: prev.title,
          description: prev.description,
        }));
        setStage("write");
      }}
      onPublish={handlePublish}
    />
  );
}

export default function NewBlogPage() {
  return (
    <RequireAuth>
      <CreateBlogForm />
    </RequireAuth>
  );
}
