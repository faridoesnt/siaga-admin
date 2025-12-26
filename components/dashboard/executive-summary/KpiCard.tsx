"use client";

type KpiCardProps = {
  label: string;
  value: string;
  delta: number;
  trend: "up" | "down" | "flat";
  status: "good" | "warning" | "bad";
};

export function KpiCard({ label, value, delta, trend, status }: KpiCardProps) {
  const colorMap: Record<KpiCardProps["status"], string> = {
    good: "text-emerald-600",
    warning: "text-amber-600",
    bad: "text-rose-600",
  };

  const safeDelta = Number.isFinite(delta) ? delta : 0;
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const deltaSign = safeDelta > 0 ? "+" : "";
  const deltaLabel = `${arrow} ${deltaSign}${safeDelta.toFixed(1)}`;

  return (
    <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className={`mt-1 text-xs font-medium ${colorMap[status]}`}>
        {deltaLabel}{" "}
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          {status === "good"
            ? "Sehat"
            : status === "warning"
            ? "Perlu perhatian"
            : "Butuh tindakan"}
        </span>
      </p>
    </div>
  );
}
