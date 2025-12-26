export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="h-20 animate-pulse rounded-lg border bg-slate-100"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg border bg-slate-100" />
    </div>
  );
}

