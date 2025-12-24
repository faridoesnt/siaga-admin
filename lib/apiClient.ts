"use client";

import { ApiError, ApiResponse } from "./types";
import { getToken, clearToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8686";

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, ...rest } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(rest.headers || {}),
  };

  if (auth) {
    const token = getToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
  });

  let payload: ApiResponse<T>;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    if (res.ok) {
      throw new ApiError("Invalid response from server", res.status);
    }
    throw new ApiError("Request failed", res.status);
  }

  if (!res.ok || !payload.success) {
    const message = payload.error?.message || "Request failed";
    const code = payload.error?.code;
    const apiError = new ApiError(message, res.status, code, payload);
    if (res.status === 401 || res.status === 403) {
      clearToken();
    }
    throw apiError;
  }

  let data = payload.data as T;
  // Some endpoints may return null for empty lists; normalize to [] for caller convenience.
  if (data == null) {
    data = ([] as unknown) as T;
  }

  return data;
}
