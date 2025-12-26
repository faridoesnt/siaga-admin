 "use client";

import type { AdminDashboardData } from "@/types/dashboard";
import { HeroInsight } from "./HeroInsight";
import { ExecutiveSummary } from "./executive-summary/ExecutiveSummary";
import { AttendanceTrend } from "./attendance-trend/AttendanceTrend";
import { DisciplineBreakdown } from "./discipline-breakdown/DisciplineBreakdown";
import { RiskEmployees } from "./risk-employees/RiskEmployees";
import { AttendanceConsistency } from "./attendance-consistency/AttendanceConsistency";
import { AuditCompliance } from "./audit-compliance/AuditCompliance";
import { DashboardActions } from "./actions/DashboardActions";

type DashboardViewProps = {
  data: AdminDashboardData;
  month: string;
  onMonthChange?: (value: string) => void;
};

export function DashboardView({ data, month, onMonthChange }: DashboardViewProps) {
  const safeTrend = data.attendance_trend ?? {
    labels: [],
    present: [],
    late: [],
    absent: [],
  };
  const safeRiskItems = data.risk_employees ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Attendance Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Ringkasan performa kehadiran dan disiplin satpam.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Bulan:</span>
          <input
            type="month"
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
            value={month}
            onChange={(e) => onMonthChange?.(e.target.value)}
          />
        </div>
      </div>

      {/* <HeroInsight hero={data.hero_insight} /> */}
      <ExecutiveSummary summary={data.summary} kpis={data.kpis} />
      <AttendanceTrend trend={safeTrend} />
      <DisciplineBreakdown breakdown={data.discipline_breakdown} />
      <RiskEmployees items={safeRiskItems} />
      <AttendanceConsistency consistency={data.attendance_consistency} />
      <AuditCompliance audit={data.audit_compliance} />
      <DashboardActions month={month} />
    </div>
  );
}
