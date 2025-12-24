"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError, ShiftSwapRequest } from "@/lib/types";
import { Badge } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/date";
import { Pagination } from "@/components/pagination";

export default function ApprovalsPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [requests, setRequests] = useState<ShiftSwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ShiftSwapRequest[]>(
        `/v1/admin/shift-swap-requests`
      );
      setRequests(data);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load shift swap requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);


  if (!ready) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Shift Swap History</h2>
          <p className="text-xs text-slate-500">
            All shift swap requests are auto-approved by system.
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Requester</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">Shift date</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created at</th>
                </tr>
              </thead>
              <tbody>
                {requests
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{r.id}</td>
                    <td className="px-3 py-2">
                      {r.requester_name || `#${r.requester_user_id}`}
                    </td>
                    <td className="px-3 py-2">
                      {r.target_name || `#${r.target_user_id}`}
                    </td>
                    <td className="px-3 py-2">{formatDate(r.shift_date)}</td>
                    <td className="px-3 py-2">
                      {r.reason || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          r.status === "PENDING"
                            ? "muted"
                            : r.status === "APPROVED"
                            ? "success"
                            : "danger"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {formatDateTime(r.created_at)}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-3 text-center text-sm text-slate-500"
                    >
                      No requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={requests.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>

    </div>
  );
}
