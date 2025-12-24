import { Button } from "./ui";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, maxPage);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(total, current * pageSize);

  const goTo = (target: number) => {
    const clamped = Math.min(Math.max(target, 1), maxPage);
    if (clamped !== current) onPageChange(clamped);
  };

  return (
    <div className="mt-3 flex flex-col items-center justify-between gap-2 border-t pt-3 text-xs text-slate-600 sm:flex-row">
      <span>
        Showing{" "}
        <span className="font-medium text-slate-900">
          {start}-{end}
        </span>{" "}
        of{" "}
        <span className="font-medium text-slate-900">
          {total}
        </span>
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="px-2 py-1 text-xs"
          onClick={() => goTo(current - 1)}
          disabled={current <= 1}
        >
          Prev
        </Button>
        <span className="text-[11px] text-slate-500">
          Page {current} of {maxPage}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="px-2 py-1 text-xs"
          onClick={() => goTo(current + 1)}
          disabled={current >= maxPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
