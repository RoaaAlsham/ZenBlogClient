import type { ApiError, BaseResult } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/** Module-level access token; set from auth state after login. */
let accessToken: string | null = null;

/** Invoked on 401 for authenticated requests (session expired / invalid token). */
let unauthorizedHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly errors: string[];

  constructor(status: number, errors: string[]) {
    const message = errors.length > 0 ? errors.join("; ") : "Request failed";
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

/** Normalize any thrown value into user-facing API error messages. */
export function getApiErrorMessages(error: unknown): string[] {
  if (error instanceof ApiClientError) {
    return error.errors.length > 0 ? error.errors : [error.message];
  }
  if (error instanceof Error && error.message) {
    return [error.message];
  }
  return ["Something went wrong. Please try again."];
}

function isApiErrorArray(value: unknown): value is ApiError[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "errorMessage" in item &&
        typeof (item as ApiError).errorMessage === "string",
    )
  );
}

function isBaseResult<T>(value: unknown): value is BaseResult<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    "errors" in value
  );
}

function messagesFromErrors(errors: ApiError[] | undefined): string[] {
  if (!errors?.length) return ["Request failed"];
  return errors.map((e) => e.errorMessage).filter(Boolean);
}

function unwrapBaseResult<T>(payload: BaseResult<T>, status: number): T {
  const failed =
    payload.isSuccess === false ||
    (payload.isSuccess !== true &&
      Array.isArray(payload.errors) &&
      payload.errors.length > 0);

  if (failed) {
    throw new ApiClientError(status, messagesFromErrors(payload.errors));
  }

  return payload.data as T;
}

function extractErrorMessages(
  payload: unknown,
  status: number,
  fallbackText: string,
): string[] {
  if (isBaseResult(payload)) {
    return messagesFromErrors(payload.errors);
  }
  if (isApiErrorArray(payload)) {
    return messagesFromErrors(payload);
  }
  if (status === 401) {
    return ["Invalid email or password."];
  }
  return [fallbackText || "Request failed"];
}

function handleUnauthorized(skipAuth: boolean): void {
  // Login/refresh use skipAuth — a 401 there is a credential failure, not a session expiry.
  if (skipAuth) return;

  setAccessToken(null);
  unauthorizedHandler?.();
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpClientOptions = Omit<RequestInit, "method" | "body"> & {
  method?: HttpMethod;
  body?: unknown;
  /** Skip attaching the Bearer token for this request. */
  skipAuth?: boolean;
};

export async function httpClient<T>(
  path: string,
  options: HttpClientOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const { method = "GET", body, skipAuth = false, headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const requestHeaders = new Headers(headers);
  // Let the browser set multipart boundary for FormData; only force JSON otherwise.
  if (body !== undefined && !isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  const response = await fetch(url, {
    ...rest,
    method,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized(skipAuth);
    }

    throw new ApiClientError(
      response.status,
      extractErrorMessages(
        payload,
        response.status,
        text || response.statusText || "Request failed",
      ),
    );
  }

  if (isBaseResult<T>(payload)) {
    return unwrapBaseResult(payload, response.status);
  }

  return payload as T;
}
