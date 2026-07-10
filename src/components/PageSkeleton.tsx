"use client";

type PageSkeletonProps = {
  variant?: "form" | "page" | "auth";
};

export function PageSkeleton({ variant = "page" }: PageSkeletonProps) {
  if (variant === "auth") {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <div className="w-full max-w-md animate-pulse space-y-6">
          <div className="mx-auto h-3 w-24 rounded bg-zinc-200" />
          <div className="mx-auto h-8 w-40 rounded bg-zinc-200" />
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <div className="h-10 rounded-lg bg-zinc-100" />
              <div className="h-10 rounded-lg bg-zinc-100" />
              <div className="h-10 rounded-lg bg-zinc-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (variant === "form") {
    return (
      <main className="min-h-full flex-1 bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl animate-pulse space-y-6">
          <div className="h-4 w-28 rounded bg-zinc-200" />
          <div className="h-9 w-56 rounded bg-zinc-200" />
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="h-10 rounded-lg bg-zinc-100" />
            <div className="h-32 rounded-lg bg-zinc-100" />
            <div className="h-10 rounded-lg bg-zinc-100" />
            <div className="ml-auto h-10 w-32 rounded-lg bg-zinc-200" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md animate-pulse space-y-3">
        <div className="h-4 w-1/3 rounded bg-zinc-200" />
        <div className="h-24 rounded-2xl bg-zinc-200" />
        <div className="h-4 w-2/3 rounded bg-zinc-100" />
      </div>
    </div>
  );
}
