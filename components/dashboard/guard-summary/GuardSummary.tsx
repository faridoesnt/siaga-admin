"use client";

import type { DashboardGuardSummary } from "@/types/dashboard";
import { GuardSummaryTable } from "./GuardSummaryTable";

type GuardSummaryProps = {
  items: DashboardGuardSummary[];
};

export function GuardSummary({ items }: GuardSummaryProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            All Scheduled Security
          </h2>
          <p className="text-xs text-slate-500">
            Overview of all security staff with scheduled shifts in the selected
            period.
          </p>
        </div>
      </div>
      <GuardSummaryTable items={items} />
    </section>
  );
}

