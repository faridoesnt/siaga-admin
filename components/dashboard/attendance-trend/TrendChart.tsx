"use client";

import type { DashboardAttendanceTrend } from "@/types/dashboard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TrendChartProps = {
  trend: DashboardAttendanceTrend;
};

export function TrendChart({ trend }: TrendChartProps) {
  const labels = trend?.labels ?? [];

  if (labels.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        Tidak ada data kehadiran pada bulan ini.
      </p>
    );
  }

  const data = labels.map((label, idx) => ({
    date: (() => {
      const d = new Date(label);
      if (Number.isNaN(d.getTime())) return label;
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
    })(),
    rawDate: label,
    hadir: trend.present[idx] ?? 0,
    terlambat: trend.late[idx] ?? 0,
    absen: trend.absent[idx] ?? 0,
    belumAbsen: trend.belum_absen?.[idx] ?? 0,
  }));

  return (
    <div className="h-72 w-full rounded-lg border bg-white px-2 py-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickMargin={8}
          />
          <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="hadir"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="terlambat"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="absen"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="belumAbsen"
            stroke="#0ea5e9"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="Belum absen"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
