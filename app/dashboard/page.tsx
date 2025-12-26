 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError } from "@/lib/types";
import type { AdminDashboardData } from "@/types/dashboard";
import { DashboardView } from "@/components/dashboard/DashboardView";

function currentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function DashboardPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<string>(currentMonth());

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const dashboard = await apiFetch<AdminDashboardData>(
          `/v1/admin/dashboard?month=${encodeURIComponent(month)}`
        );
        setData(dashboard);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace("/login");
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ready, router, month]);

  if (!ready) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-20 animate-pulse rounded-lg border bg-slate-100"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg border bg-slate-100" />
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-red-700">
          Gagal memuat dashboard
        </h2>
        <p className="text-xs text-slate-700">
          {error || "Terjadi kesalahan tak terduga."}
        </p>
        <button
          type="button"
          onClick={() => setMonth(currentMonth())}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-50"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const handleMonthChange = (value: string) => {
    if (!value) return;
    setMonth(value);
  };

  return (
    <DashboardView data={data} month={month} onMonthChange={handleMonthChange} />
  );
}
