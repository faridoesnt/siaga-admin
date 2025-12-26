"use client";

import type { DashboardAttendanceConsistency } from "@/types/dashboard";
import { ConsistencyCard } from "./ConsistencyCard";

type AttendanceConsistencyProps = {
  consistency: DashboardAttendanceConsistency;
};

export function AttendanceConsistency({
  consistency,
}: AttendanceConsistencyProps) {
  if (!consistency) {
    return null;
  }

  const total = (consistency.consistent || 0) + (consistency.irregular || 0);
  const consistentRate =
    total > 0 ? ((consistency.consistent || 0) / total) * 100 : 0;

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Attendance Consistency
        </h2>
        <p className="text-xs text-slate-500">
          Gambaran konsistensi kehadiran satpam pada periode ini.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <ConsistencyCard
          label="Satpam konsisten"
          value={`${consistency.consistent}`}
          description={`${consistentRate.toFixed(1)}% dari total`}
        />
        <ConsistencyCard
          label="Satpam tidak konsisten"
          value={`${consistency.irregular}`}
        />
        <ConsistencyCard
          label="Rata-rata hari hadir per satpam"
          value={Number(consistency.avg_streak_days || 0).toFixed(1)}
          description="Perkiraan rata-rata hari hadir dalam bulan ini"
        />
      </div>
    </section>
  );
}
