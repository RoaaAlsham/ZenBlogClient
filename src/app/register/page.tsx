"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchSiteSettings } from "@/api/settings";
import { registerUser } from "@/api/users";
import { PageSkeleton } from "@/components/PageSkeleton";
import { getLoginErrorMessages, useAuth } from "@/context/AuthContext";
import {
  validateRegisterForm,
  type RegisterFieldErrors,
  type RegisterFormValues,
} from "@/lib/registerValidation";
import { useToast } from "@/providers/ToastProvider";

const EMPTY_FORM: RegisterFormValues = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function fieldClassName(hasError: boolean): string {
  return `w-full rounded-lg border px-3 py-2.5 text-zinc-900 outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
      : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/10"
  }`;
}

function RegisterForm() {
  const { login, isAuthenticated, isReady } = useAuth();
  const { toastError, toastSuccess } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [values, setValues] = useState<RegisterFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });

  const nextPath = searchParams.get("next") || "/";
  const allowRegistrations = settingsQuery.data?.allowRegistrations === true;

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isReady, nextPath, router]);

  function updateField<K extends keyof RegisterFormValues>(
    key: K,
    value: RegisterFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormErrors([]);

    const validationErrors = validateRegisterForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const email = values.email.trim();
    const password = values.password;

    try {
      await registerUser({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        username: values.username.trim(),
        email,
        password,
      });

      await login(email, password);
      toastSuccess("Welcome to ZenBlog — your account is ready.", "Account created");
      router.replace(nextPath);
    } catch (error) {
      const messages = getLoginErrorMessages(error);
      setFormErrors(messages);
      toastError(error, "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady || settingsQuery.isLoading) {
    return <PageSkeleton variant="auth" />;
  }

  if (settingsQuery.isError) {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Couldn’t load registration status
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Try again in a moment, or sign in if you already have an account.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => settingsQuery.refetch()}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Try again
            </button>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!allowRegistrations) {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
            ZenBlog
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            Registration is closed
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            New accounts are not being accepted right now. If you already have
            an account, you can still sign in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
            ZenBlog
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            Create account
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Join ZenBlog to publish and comment.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
          noValidate
        >
          {formErrors.length > 0 && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <ul className="list-disc space-y-1 pl-4">
                {formErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                First name
              </span>
              <input
                type="text"
                name="firstName"
                autoComplete="given-name"
                required
                maxLength={50}
                value={values.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                aria-invalid={Boolean(fieldErrors.firstName)}
                className={fieldClassName(Boolean(fieldErrors.firstName))}
              />
              {fieldErrors.firstName && (
                <p className="mt-1.5 text-xs text-red-600">{fieldErrors.firstName}</p>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                Last name
              </span>
              <input
                type="text"
                name="lastName"
                autoComplete="family-name"
                required
                maxLength={50}
                value={values.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                aria-invalid={Boolean(fieldErrors.lastName)}
                className={fieldClassName(Boolean(fieldErrors.lastName))}
              />
              {fieldErrors.lastName && (
                <p className="mt-1.5 text-xs text-red-600">{fieldErrors.lastName}</p>
              )}
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Username
            </span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              value={values.username}
              onChange={(e) => updateField("username", e.target.value)}
              aria-invalid={Boolean(fieldErrors.username)}
              className={fieldClassName(Boolean(fieldErrors.username))}
              placeholder="jane_doe"
            />
            {fieldErrors.username && (
              <p className="mt-1.5 text-xs text-red-600">{fieldErrors.username}</p>
            )}
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Email
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={(e) => updateField("email", e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              className={fieldClassName(Boolean(fieldErrors.email))}
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Password
            </span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={values.password}
              onChange={(e) => updateField("password", e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              className={fieldClassName(Boolean(fieldErrors.password))}
              placeholder="••••••••"
            />
            {fieldErrors.password ? (
              <p className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-500">
                At least 8 characters, with an uppercase letter, a number, and a
                special character.
              </p>
            )}
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Confirm password
            </span>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={values.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              className={fieldClassName(Boolean(fieldErrors.confirmPassword))}
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-zinc-900 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="auth" />}>
      <RegisterForm />
    </Suspense>
  );
}
