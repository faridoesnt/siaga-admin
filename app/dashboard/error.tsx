"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-red-700">
        Gagal memuat dashboard
      </h2>
      <p className="text-xs text-slate-700">
        {error.message || "Terjadi kesalahan tak terduga."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-50"
      >
        Coba lagi
      </button>
    </div>
  );
}

