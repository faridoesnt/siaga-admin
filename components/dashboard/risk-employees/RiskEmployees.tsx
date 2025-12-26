"use client";

import type { DashboardRiskEmployee } from "@/types/dashboard";
import { RiskEmployeeTable } from "./RiskEmployeeTable";

type RiskEmployeesProps = {
  items: DashboardRiskEmployee[];
};

export function RiskEmployees({ items }: RiskEmployeesProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Risk / Red-Flag Personnel
          </h2>
          <p className="text-xs text-slate-500">
            Daftar satpam dengan pola ketidakhadiran atau keterlambatan yang
            berisiko.
          </p>
        </div>
      </div>
      <RiskEmployeeTable items={items} />
    </section>
  );
}

