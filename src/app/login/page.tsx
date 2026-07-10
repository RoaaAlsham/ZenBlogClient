"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BotanicalLoginDecor } from "@/components/botanical/BotanicalDecor";
import { PageSkeleton } from "@/components/PageSkeleton";
import { getLoginErrorMessages, useAuth } from "@/context/AuthContext";
import { useToast } from "@/providers/ToastProvider";

function LoginForm() {
  const { login, isAuthenticated } = useAuth();
  const { toastError } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = searchParams.get("next") || "/";

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, nextPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      router.replace(nextPath);
    } catch (error) {
      const messages = getLoginErrorMessages(error);
      setErrors(messages);
      toastError(error, "Sign in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <BotanicalLoginDecor />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium tracking-[0.28em] text-sage uppercase">
            ZenBlog
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-forest">
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A quiet place for literary thoughts and reflections.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-surface border-sage/20 p-8 shadow-md shadow-forest/5 sm:p-9"
          noValidate
        >
          {errors.length > 0 && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <ul className="list-disc space-y-1 pl-4">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-forest">
              Email
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-forest">
              Password
            </span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary mt-7 w-full py-3"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="auth" />}>
      <LoginForm />
    </Suspense>
  );
}
