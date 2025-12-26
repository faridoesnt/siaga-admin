"use client";

type TrendView = "daily";

type TrendToggleProps = {
  value: TrendView;
  onChange: (value: TrendView) => void;
};

export function TrendToggle({ value, onChange }: TrendToggleProps) {
  return (
    <div className="inline-flex rounded-full bg-slate-900/5 p-0.5 text-[11px]">
      <button
        type="button"
        onClick={() => onChange("daily")}
        className={`rounded-full px-3 py-1 ${
          value === "daily"
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        Harian
      </button>
    </div>
  );
}

