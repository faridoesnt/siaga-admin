"use client";

import type { DashboardAuditCompliance } from "@/types/dashboard";
import { AuditStatCard } from "./AuditStatCard";

type AuditComplianceProps = {
  audit: DashboardAuditCompliance;
};

export function AuditCompliance({ audit }: AuditComplianceProps) {
  if (!audit) {
    return null;
  }

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Audit & Compliance
        </h2>
        <p className="text-xs text-slate-500">
          Indikator override manual dan kelengkapan bukti absensi.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2">
        <AuditStatCard
          label="Manual override"
          value={audit.manual_override.toString()}
        />
        <AuditStatCard
          label="Data completeness"
          value={`${Number(audit.data_completeness || 0).toFixed(1)}%`}
        />
      </div>
    </section>
  );
}
