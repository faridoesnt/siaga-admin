import type { DashboardKPI, DashboardSummary } from "@/types/dashboard";

export type ExecutiveSummaryProps = {
  summary: DashboardSummary;
  kpis?: DashboardKPI[];
};
