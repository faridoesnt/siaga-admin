"use client";

import type { DashboardDisciplineBreakdown } from "@/types/dashboard";
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
      <DisciplineDonut breakdown={breakdown} />
    </section>
  );
}
