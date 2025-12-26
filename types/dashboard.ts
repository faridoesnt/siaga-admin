export interface DashboardSummary {
  total_security: number;
  attendance_rate: number;
  on_time_rate: number;
  absent_rate: number;
  avg_late_minutes: number;
}

export type HeroSeverity = "normal" | "warning" | "critical";

export interface DashboardHeroInsight {
  headline: string;
  severity: HeroSeverity;
  context: string;
}

export type KpiTrend = "up" | "down" | "flat";
export type KpiStatus = "good" | "warning" | "bad";

export interface DashboardKPI {
  label: string;
  value: number;
  delta: number;
  trend: KpiTrend;
  status: KpiStatus;
}

export interface DashboardAttendanceTrend {
  labels: string[];
  present: number[];
  late: number[];
  absent: number[];
  belum_absen: number[];
}

export interface DashboardDisciplineBreakdown {
  late: number;
  early_leave: number;
  no_checkin: number;
  missed_shift: number;
   belum_absen: number;
}

export interface DashboardRiskEmployee {
  id: string;
  name: string;
  position: string;
  risk_score: number;
  risk_reason: string;
}

export interface DashboardAttendanceConsistency {
  consistent: number;
  irregular: number;
  avg_streak_days: number;
}

export interface DashboardAuditCompliance {
  manual_override: number;
  data_completeness: number;
}

export interface AdminDashboardData {
  summary: DashboardSummary;
  hero_insight: DashboardHeroInsight;
  kpis: DashboardKPI[];
  attendance_trend: DashboardAttendanceTrend;
  discipline_breakdown: DashboardDisciplineBreakdown;
  risk_employees: DashboardRiskEmployee[];
  attendance_consistency: DashboardAttendanceConsistency;
  audit_compliance: DashboardAuditCompliance;
}
