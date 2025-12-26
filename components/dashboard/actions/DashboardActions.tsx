"use client";

import { useState } from "react";
import { ExportButton } from "./ExportButton";
import { downloadApiFile } from "@/lib/download";

type DashboardActionsProps = {
  month: string;
};

export function DashboardActions({ month }: DashboardActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const [year, mon] = month.split("-");
      const startDate = `${month}-01`;
      const endDate = new Date(
        Number(year),
        Number(mon),
        0
      )
        .toISOString()
        .slice(0, 10);
      await downloadApiFile(
        `/v1/admin/export/attendance-monitoring?start_date=${startDate}&end_date=${endDate}`,
        `attendance_export_${startDate}_${endDate}.xlsx`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Actions & Export
        </h2>
        <p className="text-xs text-slate-500">
          Export laporan kehadiran untuk bulan yang dipilih.
        </p>
      </div>
      <ExportButton onClick={handleExport} loading={loading} />
    </section>
  );
}

