"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError, Satpam, ShiftSwapRequest, AdminAttendanceItem } from "@/lib/types";

function todayString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [totalSatpam, setTotalSatpam] = useState<number | null>(null);
  const [pendingSwap, setPendingSwap] = useState<number | null>(null);
  const [attendanceCount, setAttendanceCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    const load = async () => {
      setError(null);
      try {
        const [satpam, swaps, attendance] = await Promise.all([
          apiFetch<Satpam[]>("/v1/admin/satpam"),
          apiFetch<ShiftSwapRequest[]>(
            "/v1/admin/shift-swap-requests?status=PENDING"
          ),
          apiFetch<AdminAttendanceItem[]>(
            `/v1/admin/attendance?date=${todayString()}`
          ),
        ]);
        setTotalSatpam(satpam.length);
        setPendingSwap(swaps.length);
        setAttendanceCount(attendance.length);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load data");
      }
    };

    load();
  }, [ready, router]);

  if (!ready) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Total Satpam"
          value={totalSatpam}
          onClick={() => router.push("/satpam")}
        />
        <DashboardCard
          title="Pending Shift Swaps"
          value={pendingSwap}
          onClick={() => router.push("/approvals")}
        />
        <DashboardCard
          title="Today's Attendance"
          value={attendanceCount}
          onClick={() => router.push("/attendance")}
        />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  onClick,
}: {
  title: string;
  value: number | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-28 w-full flex-col justify-between rounded-lg border bg-white px-4 py-3 text-left shadow-sm hover:bg-slate-50"
    >
      <span className="text-xs font-medium uppercase text-slate-500">
        {title}
      </span>
      <span className="text-3xl font-semibold">
        {value === null ? "…" : value}
      </span>
      <span className="text-xs text-slate-500">View details</span>
    </button>
  );
}

