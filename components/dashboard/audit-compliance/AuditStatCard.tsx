"use client";

type AuditStatCardProps = {
  label: string;
  value: string;
};

export function AuditStatCard({ label, value }: AuditStatCardProps) {
  return (
    <div className="rounded-lg border bg-white px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

