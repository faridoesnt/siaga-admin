"use client";

type RiskBadgeProps = {
  score: number;
};

export function RiskBadge({ score }: RiskBadgeProps) {
  const safeScore = Number(score || 0);
  let label = "Low";
  let cls =
    "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (safeScore >= 10 && safeScore < 20) {
    label = "Medium";
    cls = "bg-amber-50 text-amber-700 border border-amber-200";
  } else if (safeScore >= 20) {
    label = "High";
    cls = "bg-rose-50 text-rose-700 border border-rose-200";
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {label} ({safeScore.toFixed(0)})
    </span>
  );
}
