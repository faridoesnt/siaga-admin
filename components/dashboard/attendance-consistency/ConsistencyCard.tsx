"use client";

type ConsistencyCardProps = {
  label: string;
  value: string;
  description?: string;
};

export function ConsistencyCard({
  label,
  value,
  description,
}: ConsistencyCardProps) {
  return (
    <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
      {description && (
        <p className="mt-1 text-[11px] text-slate-500">{description}</p>
      )}
    </div>
  );
}

