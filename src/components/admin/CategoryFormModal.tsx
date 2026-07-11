"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";

type CategoryFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialName?: string;
  submitting?: boolean;
  onSubmit: (categoryName: string) => void;
  onCancel: () => void;
};

export function CategoryFormModal({
  open,
  mode,
  initialName = "",
  submitting = false,
  onSubmit,
  onCancel,
}: CategoryFormModalProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setError(null);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [initialName, open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onCancel();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel, open, submitting]);

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    if (trimmed.length > 100) {
      setError("Name cannot exceed 100 characters.");
      return;
    }
    setError(null);
    onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px]"
        disabled={submitting}
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <h2
          id={titleId}
          className="text-lg font-semibold tracking-tight text-zinc-900"
        >
          {mode === "create" ? "Add New Category" : "Edit Category"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Category name
            </span>
            <input
              ref={inputRef}
              type="text"
              value={name}
              maxLength={100}
              disabled={submitting}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:bg-zinc-50"
              placeholder="e.g. Technology"
            />
            {error && (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onCancel}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {submitting
                ? mode === "create"
                  ? "Creating…"
                  : "Saving…"
                : mode === "create"
                  ? "Create category"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
