"use client";

const TOKEN_KEY = "siaga_admin_token";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
};

let currentUser: AuthUser | null = null;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  currentUser = null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function setAuthUser(user: AuthUser | null) {
  currentUser = user;
}

export function getAuthUser(): AuthUser | null {
  return currentUser;
}

export function getPermissions(): string[] {
  return currentUser?.permissions ?? [];
}
