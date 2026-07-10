"use client";

type PageSkeletonProps = {
  variant?: "form" | "page" | "auth";
};

export function PageSkeleton({ variant = "page" }: PageSkeletonProps) {
  if (variant === "auth") {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-pulse space-y-6">
          <div className="mx-auto h-3 w-24 rounded bg-beige" />
          <div className="mx-auto h-8 w-40 rounded bg-beige" />
          <div className="card-surface p-8">
            <div className="space-y-4">
              <div className="h-10 rounded-lg bg-beige/70" />
              <div className="h-10 rounded-lg bg-beige/70" />
              <div className="h-10 rounded-lg bg-beige" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (variant === "form") {
    return (
      <main className="min-h-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl animate-pulse space-y-6">
          <div className="h-4 w-28 rounded bg-beige" />
          <div className="h-9 w-56 rounded bg-beige" />
          <div className="card-surface space-y-4 p-8">
            <div className="h-10 rounded-lg bg-beige/70" />
            <div className="h-32 rounded-lg bg-beige/70" />
            <div className="h-10 rounded-lg bg-beige/70" />
            <div className="ml-auto h-10 w-32 rounded-lg bg-beige" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md animate-pulse space-y-3">
        <div className="h-4 w-1/3 rounded bg-beige" />
        <div className="h-24 rounded-2xl bg-beige" />
        <div className="h-4 w-2/3 rounded bg-beige/70" />
      </div>
    </div>
  );
}
