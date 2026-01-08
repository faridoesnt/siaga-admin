"use client";

import type { DashboardDisciplineBreakdown } from "@/types/dashboard";
import { MiniStatCard } from "./MiniStatCard";
import { DisciplineDonut } from "./DisciplineDonut";

type DisciplineBreakdownProps = {
  breakdown: DashboardDisciplineBreakdown;
};

export function DisciplineBreakdown({ breakdown }: DisciplineBreakdownProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Discipline Breakdown
          </h2>
          <p className="text-xs text-slate-500">
            Summary of discipline violations in this month.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
        <div className="space-y-2">
          <div className="grid gap-3 md:grid-cols-2">
            <MiniStatCard
              label="Late"
              value={breakdown.late}
              color="amber"
            />
            <MiniStatCard
              label="Early leave"
              value={breakdown.early_leave}
              color="sky"
            />
            <MiniStatCard
              label="Missed shift"
              value={breakdown.missed_shift}
              color="slate"
            />
            <MiniStatCard
              label="Not yet checked in (upcoming shifts)"
              value={breakdown.belum_absen}
              color="emerald"
            />
          </div>
        </div>
        <DisciplineDonut breakdown={breakdown} />
      </div>
    </section>
  );
}
