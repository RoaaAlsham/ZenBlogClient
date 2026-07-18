import { httpClient } from "./httpClient";
import type {
  ChangePasswordCommand,
  CreateUserCommand,
  CreateUserResult,
  DeleteMyAccountCommand,
  GetAllUsersQueryResult,
  PublicUserResult,
  UpdateProfileCommand,
  UserProfileResult,
} from "./types";

export function registerUser(command: CreateUserCommand) {
  return httpClient<CreateUserResult>("/api/users/register", {
    method: "POST",
    body: command,
    skipAuth: true,
  });
}

export function fetchUsers() {
  return httpClient<GetAllUsersQueryResult[]>("/api/users");
}

export function fetchCurrentUser() {
  return httpClient<UserProfileResult>("/api/users/me");
}

export function updateProfile(command: UpdateProfileCommand) {
  return httpClient<UserProfileResult>("/api/users/me", {
    method: "PUT",
    body: command,
  });
}

export function changePassword(command: ChangePasswordCommand) {
  return httpClient<boolean>("/api/users/me/password", {
    method: "PUT",
    body: command,
  });
}

export function fetchPublicUserByUsername(username: string) {
  return httpClient<PublicUserResult>(
    `/api/users/by-username/${encodeURIComponent(username)}`,
    { skipAuth: true },
  );
}

export function deleteMyAccount(command: DeleteMyAccountCommand) {
  return httpClient<void>("/api/users/me", {
    method: "DELETE",
    body: command,
  });
}

export function deleteUser(id: string) {
  return httpClient<void>(`/api/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
