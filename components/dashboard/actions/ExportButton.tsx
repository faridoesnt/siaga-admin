"use client";

type ExportButtonProps = {
  onClick: () => void;
  loading?: boolean;
};

export function ExportButton({ onClick, loading }: ExportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-50 shadow disabled:opacity-60"
    >
      {loading ? "Mengekspor..." : "Export Attendance Report"}
    </button>
  );
}

