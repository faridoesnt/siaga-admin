"use client";

import type { DashboardDisciplineBreakdown } from "@/types/dashboard";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DisciplineDonutProps = {
  breakdown: DashboardDisciplineBreakdown;
};

const COLORS = ["#f97316", "#0ea5e9", "#ef4444", "#64748b", "#10b981"];

export function DisciplineDonut({ breakdown }: DisciplineDonutProps) {
  const data = [
    { name: "Late", value: breakdown.late },
    { name: "Early leave", value: breakdown.early_leave },
    { name: "Missed shift", value: breakdown.missed_shift },
    { name: "Not yet checked in", value: breakdown.belum_absen },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        No discipline violations in this month.
      </p>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full rounded-lg border bg-white px-4 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="h-56 w-full md:h-52 md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                minAngle={4}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid w-full gap-2 text-xs md:w-1/2">
          {data.map((item, index) => {
            const percentage =
              total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-700">{item.name}</span>
                </div>
                <span className="text-slate-900">
                  {item.value}
                  {total > 0 && (
                    <span className="ml-1 text-slate-500">({percentage}%)</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
