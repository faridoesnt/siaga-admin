"use client";

import type { DashboardDisciplineBreakdown } from "@/types/dashboard";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type DisciplineDonutProps = {
  breakdown: DashboardDisciplineBreakdown;
};

const COLORS = ["#f97316", "#0ea5e9", "#ef4444", "#64748b", "#10b981"];

export function DisciplineDonut({ breakdown }: DisciplineDonutProps) {
  const data = [
    { name: "Terlambat", value: breakdown.late },
    { name: "Pulang lebih awal", value: breakdown.early_leave },
    { name: "Tidak masuk shift", value: breakdown.missed_shift },
    { name: "Belum absen", value: breakdown.belum_absen },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        Tidak ada pelanggaran disiplin pada bulan ini.
      </p>
    );
  }

  return (
    <div className="h-64 w-full rounded-lg border bg-white px-2 py-3">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
