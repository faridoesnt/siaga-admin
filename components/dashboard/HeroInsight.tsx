"use client";

import type { DashboardHeroInsight } from "@/types/dashboard";

type HeroInsightProps = {
  hero: DashboardHeroInsight;
};

export function HeroInsight({ hero }: HeroInsightProps) {
  const colorMap: Record<DashboardHeroInsight["severity"], string> = {
    normal: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    critical: "bg-rose-50 border-rose-200 text-rose-900",
  };

  return (
    <section
      className={`rounded-xl border px-4 py-3 shadow-sm ${colorMap[hero.severity]}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide">
        Insight Bulanan
      </p>
      <p className="mt-1 text-sm font-semibold">{hero.headline}</p>
      <p className="mt-1 text-xs opacity-80">{hero.context}</p>
    </section>
  );
}
