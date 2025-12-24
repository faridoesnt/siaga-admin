"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiResponse } from "@/lib/types";
import { setToken, isAuthenticated } from "@/lib/auth";
import { showError, showSuccess } from "@/lib/toast";

interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8686";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload =
        (await res.json()) as ApiResponse<LoginResponse | undefined>;

      if (!res.ok || !payload.success || !payload.data) {
        const msg = payload.error?.message || "Login failed";
        setError(msg);
        showError(msg);
        setLoading(false);
        return;
      }

      setToken(payload.data.access_token);
      showSuccess("Login successful.");
      router.replace("/dashboard");
    } catch (err) {
      const msg = "Unable to login. Please try again.";
      setError(msg);
      showError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg border bg-white px-6 py-8 shadow-sm">
        <h2 className="mb-1 text-center text-xl font-semibold">
          Admin Login
        </h2>
        <p className="mb-6 text-center text-sm text-slate-600">
          Sign in to SIAGA CS portal
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
