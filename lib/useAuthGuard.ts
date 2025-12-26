"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, isAuthenticated, setAuthUser } from "./auth";
import { apiFetch } from "./apiClient";
import { ApiError } from "./types";

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/login") {
      setReady(true);
      return;
    }

    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    // Load current admin profile + permissions
    const loadProfile = async () => {
      try {
        const token = getToken();
        if (!token) {
          router.replace("/login");
          return;
        }
        const me = await apiFetch<{
          id: number;
          name: string;
          email: string;
          role: string;
          permissions: string[];
        }>("/v1/admin/me");
        setAuthUser({
          id: me.id,
          name: me.name,
          email: me.email,
          role: me.role,
          permissions: me.permissions || [],
        });
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setAuthUser(null);
          router.replace("/login");
          return;
        }
        // On other errors, still mark ready so UI can show error states.
      } finally {
        setReady(true);
      }
    };

    loadProfile();
  }, [router, pathname]);

  return ready;
}
