"use client";

import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessages } from "@/api/httpClient";
import { fetchUsers } from "@/api/users";

export function UsersAdminTab() {
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  if (usersQuery.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-xl bg-zinc-200"
          />
        ))}
      </div>
    );
  }

  if (usersQuery.isError) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700"
      >
        <p className="font-medium">Couldn’t load users</p>
        <p className="mt-1">
          {getApiErrorMessages(usersQuery.error).join("; ")}
        </p>
        <button
          type="button"
          onClick={() => usersQuery.refetch()}
          className="mt-4 rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const users = usersQuery.data ?? [];

  return (
    <>
      <div className="mb-4">
        <p className="text-sm text-zinc-600">
          {users.length} registered user{users.length === 1 ? "" : "s"}
        </p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center text-sm text-zinc-600">
          No users found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 sm:px-5">User</th>
                <th className="px-4 py-3 sm:px-5">Username</th>
                <th className="px-4 py-3 sm:px-5">Email</th>
                <th className="px-4 py-3 sm:px-5">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => (
                <tr key={user.id} className="align-middle">
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500">
                        {user.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (user.fullName || user.username || "?")
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>
                      <span className="font-medium text-zinc-900">
                        {user.fullName || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 sm:px-5">
                    {user.username}
                  </td>
                  <td className="px-4 py-3 break-all text-zinc-700 sm:px-5">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500 sm:px-5">
                    {user.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
