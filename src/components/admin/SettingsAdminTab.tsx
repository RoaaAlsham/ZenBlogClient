"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSiteSettings, updateSiteSettings } from "@/api/settings";
import { getApiErrorMessages } from "@/api/httpClient";
import { useToast } from "@/providers/ToastProvider";

export function SettingsAdminTab() {
  const queryClient = useQueryClient();
  const { toastError, toastSuccess } = useToast();

  const settingsQuery = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });

  const updateMutation = useMutation({
    mutationFn: (allowRegistrations: boolean) =>
      updateSiteSettings({ allowRegistrations }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toastSuccess(
        data.allowRegistrations
          ? "New user registrations are now enabled."
          : "New user registrations are now disabled.",
        "Settings saved",
      );
    },
    onError: (error: unknown) => toastError(error, "Couldn’t update settings"),
  });

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-200" />
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700"
      >
        <p className="font-medium">Couldn’t load settings</p>
        <p className="mt-1">
          {getApiErrorMessages(settingsQuery.error).join("; ")}
        </p>
        <button
          type="button"
          onClick={() => settingsQuery.refetch()}
          className="mt-4 rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const allowRegistrations = settingsQuery.data?.allowRegistrations ?? false;
  const isSaving = updateMutation.isPending;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        Registration
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Control whether new visitors can create accounts on this site.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900">
            Allow new user registrations
          </p>
          <p className="mt-0.5 text-sm text-zinc-600">
            {allowRegistrations
              ? "Anyone can sign up from the registration page."
              : "Registration is closed. Existing users can still sign in."}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={allowRegistrations}
          aria-label="Allow new user registrations"
          disabled={isSaving}
          onClick={() => updateMutation.mutate(!allowRegistrations)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-60 ${
            allowRegistrations ? "bg-zinc-900" : "bg-zinc-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
              allowRegistrations ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
