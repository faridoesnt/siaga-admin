"use client";

import { getToken, clearToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8686";

export async function downloadApiFile(path: string, fallbackFilename: string) {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return;
    }

    let message = "Failed to download file";
    try {
      const payload = await res.json();
      if (payload?.error?.message) {
        message = payload.error.message;
      }
    } catch {
      // ignore JSON parse error; keep default message
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fallbackFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

