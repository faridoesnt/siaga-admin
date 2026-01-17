"use client";

import type { DashboardGuardSummary } from "@/types/dashboard";
import { RiskBadge } from "../risk-employees/RiskBadge";

type GuardSummaryTableProps = {
  items: DashboardGuardSummary[];
};

export function GuardSummaryTable({ items }: GuardSummaryTableProps) {
  const safeItems = items ?? [];

  if (safeItems.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        No scheduled security staff in the selected period.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Position</th>
            <th className="px-3 py-2 text-right">Scheduled</th>
            <th className="px-3 py-2 text-right">Present</th>
            <th className="px-3 py-2 text-right">Absent</th>
            <th className="px-3 py-2 text-right">Late</th>
            <th className="px-3 py-2">Risk</th>
          </tr>
        </thead>
        <tbody>
          {safeItems.map((g) => (
            <tr key={g.id} className="border-t last:border-b-0">
              <td className="px-3 py-1.5">{g.name}</td>
              <td className="px-3 py-1.5">{g.position}</td>
              <td className="px-3 py-1.5 text-right">{g.scheduled}</td>
              <td className="px-3 py-1.5 text-right">{g.present}</td>
              <td className="px-3 py-1.5 text-right">{g.absent}</td>
              <td className="px-3 py-1.5 text-right">{g.late}</td>
              <td className="px-3 py-1.5">
                <RiskBadge score={g.risk_score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

