"use client";

import type { ExecutiveSummaryProps } from "./types";
import { KpiCard } from "./KpiCard";

export function ExecutiveSummary({ summary, kpis }: ExecutiveSummaryProps) {
  const kpiList =
    kpis ??
    [
      {
        label: "Attendance Rate",
        value: summary.attendance_rate,
        delta: 0,
        trend: "flat",
        status: "good",
      },
      {
        label: "On-Time Rate",
        value: summary.on_time_rate,
        delta: 0,
        trend: "flat",
        status: "good",
      },
      {
        label: "Absent Rate",
        value: summary.absent_rate,
        delta: 0,
        trend: "flat",
        status: "good",
      },
      {
        label: "Avg Late Minutes",
        value: summary.avg_late_minutes,
        delta: 0,
        trend: "flat",
        status: "good",
      },
    ];

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Executive Summary
        </h2>
        <p className="text-xs text-slate-500">
          Ringkasan singkat performa kehadiran satpam pada bulan terpilih.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <KpiCard
          label="Total Satpam"
          value={summary.total_security.toString()}
          delta={0}
          trend="flat"
          status="good"
        />
        {kpiList.map((kpi) => (
          // Normalise numeric values defensively
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={
              kpi.label.includes("Rate")
                ? `${Number(kpi.value || 0).toFixed(1)}%`
                : `${Number(kpi.value || 0).toFixed(1)} mnt`
            }
            delta={Number.isFinite(kpi.delta) ? kpi.delta : 0}
            trend={kpi.trend}
            status={kpi.status}
          />
        ))}
      </div>
    </section>
  );
}
