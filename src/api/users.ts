import { httpClient } from "./httpClient";
import type {
  CreateUserCommand,
  CreateUserResult,
  GetAllUsersQueryResult,
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
