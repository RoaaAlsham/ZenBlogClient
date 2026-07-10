"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiErrorMessages } from "@/api/httpClient";

export type ToastVariant = "error" | "success" | "info";

export type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
  toastError: (error: unknown, title?: string) => void;
  toastSuccess: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      setToasts((current) => [...current, { ...toast, id }]);

      window.setTimeout(() => {
        dismissToast(id);
      }, AUTO_DISMISS_MS);
    },
    [dismissToast],
  );

  const toastError = useCallback(
    (error: unknown, title = "Request failed") => {
      const messages = getApiErrorMessages(error);
      for (const message of messages) {
        pushToast({ variant: "error", title, message });
      }
    },
    [pushToast],
  );

  const toastSuccess = useCallback(
    (message: string, title?: string) => {
      pushToast({ variant: "success", title, message });
    },
    [pushToast],
  );

  const value = useMemo(
    () => ({ pushToast, dismissToast, toastError, toastSuccess }),
    [pushToast, dismissToast, toastError, toastSuccess],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition ${
              toast.variant === "error"
                ? "border-red-200 bg-red-50/95 text-red-800"
                : toast.variant === "success"
                  ? "border-sage/40 bg-beige/95 text-forest"
                  : "border-border-soft bg-surface/95 text-forest"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                {toast.title && (
                  <p className="text-sm font-semibold">{toast.title}</p>
                )}
                <p
                  className={`text-sm leading-5 ${toast.title ? "mt-0.5" : ""}`}
                >
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium opacity-70 transition hover:opacity-100"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
