"use client";

type MiniStatCardProps = {
  label: string;
  value: number;
  color?: "amber" | "rose" | "sky" | "slate" | "emerald";
};

export function MiniStatCard({
  label,
  value,
  color = "slate",
}: MiniStatCardProps) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-rose-800",
    sky: "bg-sky-50 text-sky-800",
    slate: "bg-slate-50 text-slate-800",
    emerald: "bg-emerald-50 text-emerald-800",
  };

  return (
    <div className="rounded-lg border bg-white px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p
        className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
          colorMap[color] ?? colorMap.slate
        }`}
      >
        {value}
      </p>
    </div>
  );
}
