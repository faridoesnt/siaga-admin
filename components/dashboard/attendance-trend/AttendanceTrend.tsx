"use client";

import type { AttendanceTrendProps } from "./types";
import { TrendChart } from "./TrendChart";
import { TrendToggle } from "./TrendToggle";
import { useState } from "react";

export function AttendanceTrend({ trend }: AttendanceTrendProps) {
  const [view, setView] = useState<"daily">("daily");

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Attendance & Discipline Trend
          </h2>
          <p className="text-xs text-slate-500">
            Pergerakan kehadiran, keterlambatan, dan ketidakhadiran per hari.
          </p>
        </div>
        <TrendToggle value={view} onChange={setView} />
      </div>
      <TrendChart trend={trend} />
    </section>
  );
}

