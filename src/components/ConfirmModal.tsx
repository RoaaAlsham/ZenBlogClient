"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirming = false,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !confirming) {
        onCancel();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [confirming, onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px]"
        disabled={confirming}
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <h2
          id={titleId}
          className="text-lg font-semibold tracking-tight text-zinc-900"
        >
          {title}
        </h2>
        <div id={descriptionId} className="mt-2 text-sm leading-6 text-zinc-600">
          {description}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            disabled={confirming}
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? "bg-red-700 hover:bg-red-800"
                : "bg-zinc-900 hover:bg-zinc-800"
            }`}
          >
            {confirming ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
