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
          Overview of security attendance consistency for this period.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <ConsistencyCard
          label="Consistent security"
          value={`${consistency.consistent}`}
          description={`${consistentRate.toFixed(1)}% of total`}
        />
        <ConsistencyCard
          label="Irregular security"
          value={`${consistency.irregular}`}
        />
        <ConsistencyCard
          label="Avg presence days per security"
          value={Number(consistency.avg_streak_days || 0).toFixed(1)}
          description="Estimated average days present in this month"
        />
      </div>
    </section>
  );
}
