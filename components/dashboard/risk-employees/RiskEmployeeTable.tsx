"use client";

import type { DashboardRiskEmployee } from "@/types/dashboard";
import { RiskBadge } from "./RiskBadge";

type RiskEmployeeTableProps = {
  items: DashboardRiskEmployee[];
};

export function RiskEmployeeTable({ items }: RiskEmployeeTableProps) {
  const safeItems = items ?? [];

  if (safeItems.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        Tidak ada satpam dengan risiko tinggi pada bulan ini.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Nama</th>
            <th className="px-3 py-2">Jabatan</th>
            <th className="px-3 py-2">Alasan</th>
            <th className="px-3 py-2">Risk</th>
          </tr>
        </thead>
        <tbody>
          {safeItems.map((emp) => (
            <tr key={emp.id} className="border-t last:border-b-0">
              <td className="px-3 py-1.5">{emp.name}</td>
              <td className="px-3 py-1.5">{emp.position}</td>
              <td className="px-3 py-1.5 text-slate-600">{emp.risk_reason}</td>
              <td className="px-3 py-1.5">
                <RiskBadge score={emp.risk_score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
