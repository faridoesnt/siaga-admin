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
        No attendance data for this month.
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
    present: trend.present[idx] ?? 0,
    late: trend.late[idx] ?? 0,
    absent: trend.absent[idx] ?? 0,
    notCheckedIn: trend.belum_absen?.[idx] ?? 0,
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
            dataKey="present"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
            name="Present"
          />
          <Line
            type="monotone"
            dataKey="late"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            name="Late"
          />
          <Line
            type="monotone"
            dataKey="absent"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Absent"
          />
          <Line
            type="monotone"
            dataKey="notCheckedIn"
            stroke="#0ea5e9"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="Not yet checked in"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
