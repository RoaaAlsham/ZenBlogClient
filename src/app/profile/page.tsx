"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteBlog, fetchBlogsByUserId } from "@/api/blogs";
import { getApiErrorMessages } from "@/api/httpClient";
import type { GetBlogsQueryResult } from "@/api/types";
import {
  changePassword,
  deleteMyAccount,
  fetchCurrentUser,
  updateProfile,
} from "@/api/users";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PageSkeleton } from "@/components/PageSkeleton";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import {
  validateChangePasswordForm,
  validateProfileForm,
  type ChangePasswordFieldErrors,
  type ChangePasswordFormValues,
  type ProfileFieldErrors,
  type ProfileFormValues,
} from "@/lib/profileValidation";
import { stripMarkdown } from "@/lib/stripMarkdown";
import { useToast } from "@/providers/ToastProvider";

function fieldClassName(invalid: boolean) {
  return [
    "mt-1.5 w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition",
    invalid
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-zinc-300 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100",
  ].join(" ");
}

function ProfilePostCard({
  blog,
  onDelete,
  isDeleting,
}: {
  blog: GetBlogsQueryResult;
  onDelete: (blog: GetBlogsQueryResult) => void;
  isDeleting: boolean;
}) {
  const cover = blog.coverImageUrl;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm sm:flex-row">
      <Link
        href={`/blogs/${blog.id}`}
        className="relative aspect-[16/10] shrink-0 overflow-hidden bg-zinc-100 sm:aspect-auto sm:w-48"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- cover URLs come from the API
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-28 items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-xs text-zinc-400">
            No cover
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
            {blog.category?.categoryName ?? "Uncategorized"}
          </span>
          <h3 className="mt-2 truncate text-lg font-semibold tracking-tight text-zinc-900">
            <Link href={`/blogs/${blog.id}`} className="hover:underline">
              {blog.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600">
            {stripMarkdown(blog.description)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/blogs/${blog.id}/edit`}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Edit Post
          </Link>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onDelete(blog)}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Delete Post"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const { toastError, toastSuccess } = useToast();
  const [pendingDelete, setPendingDelete] =
    useState<GetBlogsQueryResult | null>(null);
  const [confirmAccountDelete, setConfirmAccountDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(
    null,
  );
  const [editing, setEditing] = useState(false);
  const [profileValues, setProfileValues] = useState<ProfileFormValues>({
    firstName: "",
    lastName: "",
    imageUrl: "",
  });
  const [profileErrors, setProfileErrors] = useState<ProfileFieldErrors>({});
  const [passwordValues, setPasswordValues] = useState<ChangePasswordFormValues>(
    {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  );
  const [passwordErrors, setPasswordErrors] =
    useState<ChangePasswordFieldErrors>({});

  const profileQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: fetchCurrentUser,
    enabled: Boolean(user),
  });

  const blogsQuery = useQuery({
    queryKey: ["blogs", "user", user?.id],
    queryFn: () => fetchBlogsByUserId(user!.id),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setProfileValues({
      firstName: profileQuery.data.firstName,
      lastName: profileQuery.data.lastName,
      imageUrl: profileQuery.data.imageUrl ?? "",
    });
  }, [profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (result) => {
      updateUser(result);
      await queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      setEditing(false);
      setProfileErrors({});
      toastSuccess("Your profile has been updated.", "Profile saved");
    },
    onError: (error: unknown) => {
      toastError(error, "Couldn’t update profile");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswordValues({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      toastSuccess("Your password has been changed.", "Password updated");
    },
    onError: (error: unknown) => {
      toastError(error, "Couldn’t change password");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: async (_data, id) => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["blogs"] });
      await queryClient.removeQueries({ queryKey: ["blog", id] });
      toastSuccess("The post has been removed.", "Post deleted");
    },
    onError: (error: unknown) => {
      toastError(error, "Couldn’t delete post");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (currentPassword: string) =>
      deleteMyAccount({ currentPassword }),
    onSuccess: () => {
      setConfirmAccountDelete(false);
      setDeletePassword("");
      logout();
      toastSuccess("Your account has been permanently deleted.", "Account deleted");
      router.replace("/");
    },
    onError: (error: unknown) => {
      toastError(error, "Couldn’t delete account");
    },
  });

  if (!user) {
    return <PageSkeleton variant="page" />;
  }

  const profile = profileQuery.data;
  const firstName = profile?.firstName ?? user.firstName ?? "";
  const lastName = profile?.lastName ?? user.lastName ?? "";
  const username = profile?.username ?? user.username ?? "";
  const email = profile?.email ?? user.email;
  const imageUrl = profile?.imageUrl ?? user.imageUrl;
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    (email?.charAt(0).toUpperCase() ?? "?");

  const myBlogs = blogsQuery.data ?? [];
  const blogsError = blogsQuery.isError
    ? getApiErrorMessages(blogsQuery.error).join("; ")
    : null;
  const profileError = profileQuery.isError
    ? getApiErrorMessages(profileQuery.error).join("; ")
    : null;

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateProfileForm(profileValues);
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    updateMutation.mutate({
      firstName: profileValues.firstName.trim(),
      lastName: profileValues.lastName.trim(),
      imageUrl: profileValues.imageUrl.trim() || null,
    });
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateChangePasswordForm(passwordValues);
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    passwordMutation.mutate({
      currentPassword: passwordValues.currentPassword,
      newPassword: passwordValues.newPassword,
    });
  }

  function cancelEditing() {
    setEditing(false);
    setProfileErrors({});
    if (profile) {
      setProfileValues({
        firstName: profile.firstName,
        lastName: profile.lastName,
        imageUrl: profile.imageUrl ?? "",
      });
    }
  }

  return (
    <main className="min-h-full flex-1 bg-zinc-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
            >
              ← Back to posts
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
              Your profile
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Account details and the posts you have published.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {username ? (
              <Link
                href={`/authors/${encodeURIComponent(username)}`}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                View public profile
              </Link>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Log out
            </button>
          </div>
        </div>

        {profileError ? (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700"
          >
            <p className="font-medium">Couldn’t load profile</p>
            <p className="mt-1">{profileError}</p>
            <button
              type="button"
              onClick={() => profileQuery.refetch()}
              className="mt-4 rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        ) : null}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
              Account
            </h2>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={profileQuery.isLoading}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
              >
                Edit profile
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-100 sm:mx-0">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- profile URLs come from the API
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-400">
                  {initials}
                </div>
              )}
            </div>

            {editing ? (
              <form
                onSubmit={handleProfileSubmit}
                className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2"
              >
                <div>
                  <label
                    htmlFor="profile-firstName"
                    className="text-xs font-medium tracking-wide text-zinc-500 uppercase"
                  >
                    First name
                  </label>
                  <input
                    id="profile-firstName"
                    name="firstName"
                    value={profileValues.firstName}
                    onChange={(e) =>
                      setProfileValues((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    aria-invalid={Boolean(profileErrors.firstName)}
                    className={fieldClassName(Boolean(profileErrors.firstName))}
                  />
                  {profileErrors.firstName ? (
                    <p className="mt-1.5 text-xs text-red-600">
                      {profileErrors.firstName}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label
                    htmlFor="profile-lastName"
                    className="text-xs font-medium tracking-wide text-zinc-500 uppercase"
                  >
                    Last name
                  </label>
                  <input
                    id="profile-lastName"
                    name="lastName"
                    value={profileValues.lastName}
                    onChange={(e) =>
                      setProfileValues((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    aria-invalid={Boolean(profileErrors.lastName)}
                    className={fieldClassName(Boolean(profileErrors.lastName))}
                  />
                  {profileErrors.lastName ? (
                    <p className="mt-1.5 text-xs text-red-600">
                      {profileErrors.lastName}
                    </p>
                  ) : null}
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="profile-imageUrl"
                    className="text-xs font-medium tracking-wide text-zinc-500 uppercase"
                  >
                    Image URL
                  </label>
                  <input
                    id="profile-imageUrl"
                    name="imageUrl"
                    value={profileValues.imageUrl}
                    onChange={(e) =>
                      setProfileValues((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                    placeholder="https://…"
                    aria-invalid={Boolean(profileErrors.imageUrl)}
                    className={fieldClassName(Boolean(profileErrors.imageUrl))}
                  />
                  {profileErrors.imageUrl ? (
                    <p className="mt-1.5 text-xs text-red-600">
                      {profileErrors.imageUrl}
                    </p>
                  ) : null}
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Email
                  </dt>
                  <dd className="mt-1 break-all text-sm font-medium text-zinc-900">
                    {email}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Username
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-900">
                    {username || "—"}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {updateMutation.isPending ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={updateMutation.isPending}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <dl className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    First name
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-900">
                    {profileQuery.isLoading ? "…" : firstName || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Last name
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-900">
                    {profileQuery.isLoading ? "…" : lastName || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Username
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-900">
                    {profileQuery.isLoading ? "…" : username || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Email
                  </dt>
                  <dd className="mt-1 break-all text-sm font-medium text-zinc-900">
                    {email}
                  </dd>
                </div>
                {imageUrl ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                      Image URL
                    </dt>
                    <dd className="mt-1 break-all text-sm text-zinc-700">
                      {imageUrl}
                    </dd>
                  </div>
                ) : null}
              </dl>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Change password
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Choose a strong password you have not used here before.
          </p>
          <form
            onSubmit={handlePasswordSubmit}
            className="mt-6 grid max-w-md gap-4"
          >
            <div>
              <label
                htmlFor="currentPassword"
                className="text-xs font-medium tracking-wide text-zinc-500 uppercase"
              >
                Current password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={passwordValues.currentPassword}
                onChange={(e) =>
                  setPasswordValues((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                aria-invalid={Boolean(passwordErrors.currentPassword)}
                className={fieldClassName(Boolean(passwordErrors.currentPassword))}
              />
              {passwordErrors.currentPassword ? (
                <p className="mt-1.5 text-xs text-red-600">
                  {passwordErrors.currentPassword}
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="newPassword"
                className="text-xs font-medium tracking-wide text-zinc-500 uppercase"
              >
                New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={passwordValues.newPassword}
                onChange={(e) =>
                  setPasswordValues((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                aria-invalid={Boolean(passwordErrors.newPassword)}
                className={fieldClassName(Boolean(passwordErrors.newPassword))}
              />
              {passwordErrors.newPassword ? (
                <p className="mt-1.5 text-xs text-red-600">
                  {passwordErrors.newPassword}
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="text-xs font-medium tracking-wide text-zinc-500 uppercase"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={passwordValues.confirmPassword}
                onChange={(e) =>
                  setPasswordValues((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                aria-invalid={Boolean(passwordErrors.confirmPassword)}
                className={fieldClassName(Boolean(passwordErrors.confirmPassword))}
              />
              {passwordErrors.confirmPassword ? (
                <p className="mt-1.5 text-xs text-red-600">
                  {passwordErrors.confirmPassword}
                </p>
              ) : null}
            </div>
            <div>
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {passwordMutation.isPending
                  ? "Updating…"
                  : "Update password"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-red-900">
            Delete account
          </h2>
          <p className="mt-1 text-sm text-red-800/80">
            Permanently remove your account, blogs, and comments. This cannot be
            undone.
          </p>
          <div className="mt-6 max-w-md space-y-4">
            <div>
              <label
                htmlFor="deleteAccountPassword"
                className="text-xs font-medium tracking-wide text-red-800/70 uppercase"
              >
                Confirm with your password
              </label>
              <input
                id="deleteAccountPassword"
                name="deleteAccountPassword"
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  if (deletePasswordError) setDeletePasswordError(null);
                }}
                aria-invalid={Boolean(deletePasswordError)}
                className={fieldClassName(Boolean(deletePasswordError))}
              />
              {deletePasswordError ? (
                <p className="mt-1.5 text-xs text-red-600">{deletePasswordError}</p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={deleteAccountMutation.isPending}
              onClick={() => {
                if (!deletePassword.trim()) {
                  setDeletePasswordError("Password is required.");
                  return;
                }
                setDeletePasswordError(null);
                setConfirmAccountDelete(true);
              }}
              className="rounded-lg border border-red-300 bg-white px-3.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete my account
            </button>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                My Published Posts
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {blogsQuery.isLoading
                  ? "Loading your posts…"
                  : `${myBlogs.length} post${myBlogs.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <Link
              href="/blogs/new"
              className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Create New Blog
            </Link>
          </div>

          {blogsError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700"
            >
              <p className="font-medium">Couldn’t load posts</p>
              <p className="mt-1">{blogsError}</p>
              <button
                type="button"
                onClick={() => blogsQuery.refetch()}
                className="mt-4 rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-800"
              >
                Try again
              </button>
            </div>
          ) : blogsQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-2xl bg-zinc-200"
                />
              ))}
            </div>
          ) : myBlogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
              <p className="text-base font-medium text-zinc-900">
                No published posts yet
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Write your first story to see it here.
              </p>
              <Link
                href="/blogs/new"
                className="mt-5 inline-flex rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Create New Blog
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myBlogs.map((blog) => (
                <ProfilePostCard
                  key={blog.id}
                  blog={blog}
                  onDelete={setPendingDelete}
                  isDeleting={
                    deleteMutation.isPending && pendingDelete?.id === blog.id
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete this blog?"
        description={
          <>
            This permanently removes{" "}
            <span className="font-medium text-zinc-800">
              {pendingDelete?.title ?? "this post"}
            </span>
            . This action cannot be undone.
          </>
        }
        confirmLabel="Delete Post"
        cancelLabel="Keep post"
        danger
        confirming={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
        }}
      />

      <ConfirmModal
        open={confirmAccountDelete}
        title="Delete your account?"
        description={
          <>
            Your account, blogs, and comments will be permanently deleted. You
            can register again later with the same email, but your content will
            not come back.
          </>
        }
        confirmLabel="Delete account"
        cancelLabel="Keep account"
        danger
        confirming={deleteAccountMutation.isPending}
        onCancel={() => {
          if (!deleteAccountMutation.isPending) setConfirmAccountDelete(false);
        }}
        onConfirm={() => {
          deleteAccountMutation.mutate(deletePassword);
        }}
      />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
