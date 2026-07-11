import { httpClient } from "./httpClient";
import type {
  ChangePasswordCommand,
  CreateUserCommand,
  CreateUserResult,
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
