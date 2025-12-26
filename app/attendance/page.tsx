"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError, AdminAttendanceItem } from "@/lib/types";
import { formatDateTime } from "@/lib/date";
import { Pagination } from "@/components/pagination";
import { Badge, Button, Modal } from "@/components/ui";
import { showError, showSuccess } from "@/lib/toast";
import { downloadApiFile } from "@/lib/download";
import { canManage, canView } from "@/lib/permissions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8686";

function todayString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [date, setDate] = useState(todayString());
  const [rangeStart, setRangeStart] = useState(todayString());
  const [rangeEnd, setRangeEnd] = useState(todayString());
  const [items, setItems] = useState<AdminAttendanceItem[]>([]);
  const [openItems, setOpenItems] = useState<AdminAttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoItem, setPhotoItem] = useState<AdminAttendanceItem | null>(null);
  const [forceItem, setForceItem] = useState<AdminAttendanceItem | null>(null);
  const [forceReason, setForceReason] = useState("");
  const [forceLoading, setForceLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async (targetDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminAttendanceItem[]>(
        `/v1/admin/attendance?date=${targetDate}`
      );
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Failed to load attendance"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadOpen = async () => {
    try {
      const data = await apiFetch<AdminAttendanceItem[]>(
        "/v1/admin/attendance/open"
      );
      setOpenItems(data);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load open attendance"
      );
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!canView("ATTENDANCE_MONITORING")) {
      showError("You do not have access to this page.");
      router.replace("/dashboard");
      return;
    }
    load(date);
    loadOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const handleChangeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDate(value);
    if (value) {
      load(value);
    }
  };

  const handleExport = async () => {
    if (!rangeStart || !rangeEnd) {
      showError("Please select start and end dates for export.");
      return;
    }
    if (!canManage("ATTENDANCE_MONITORING")) {
      showError("You do not have permission to export attendance.");
      return;
    }
    try {
      await downloadApiFile(
        `/v1/admin/export/attendance-monitoring?start_date=${rangeStart}&end_date=${rangeEnd}`,
        `attendance_export_${rangeStart}_${rangeEnd}.xlsx`
      );
      showSuccess("Attendance export downloaded.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to export attendance";
      showError(msg);
    }
  };

  const formatOpenDuration = (clockIn?: string | null) => {
    if (!clockIn) return "-";
    const start = new Date(clockIn);
    if (Number.isNaN(start.getTime())) return "-";
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    if (diffMs <= 0) return "0 menit";
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} jam`);
    if (minutes > 0) parts.push(`${minutes} menit`);
    return parts.join(" ");
  };

  const handleForceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forceItem) return;
    if (!canManage("ATTENDANCE_MONITORING")) {
      showError("You do not have permission to force clock-out.");
      return;
    }
    if (!forceReason.trim()) {
      showError("Reason is required.");
      return;
    }
    setForceLoading(true);
    try {
      await apiFetch(`/v1/admin/attendance/${forceItem.attendance_id}/force-clock-out`, {
        method: "POST",
        body: JSON.stringify({ reason: forceReason }),
      });
      showSuccess("Attendance force clock-out completed.");
      setForceItem(null);
      setForceReason("");
      await Promise.all([load(date), loadOpen()]);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to force clock-out";
      showError(msg);
    } finally {
      setForceLoading(false);
    }
  };

  if (!ready) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Attendance Monitoring</h2>
          <p className="text-xs text-slate-500">
            Monitor daily attendance and export reports.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-sm sm:items-end">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Date:</span>
            <input
              type="date"
              value={date}
              onChange={handleChangeDate}
              className="rounded-md border px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600">Export range:</span>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="rounded-md border px-2 py-1.5 text-sm"
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="rounded-md border px-2 py-1.5 text-sm"
            />
            {canManage("ATTENDANCE_MONITORING") && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleExport}
              >
                Export Attendance
              </Button>
            )}
          </div>
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
                  <th className="px-3 py-2">Satpam</th>
                  <th className="px-3 py-2">Shift</th>
                  <th className="px-3 py-2">Clock in</th>
                  <th className="px-3 py-2">Clock out</th>
                  <th className="px-3 py-2">Late status</th>
                  <th className="px-3 py-2">Face verify</th>
                  <th className="px-3 py-2">Photos</th>
                  {canManage("ATTENDANCE_MONITORING") && (
                    <th className="px-3 py-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((item, idx) => {
                    const isOpen = openItems.some(
                      (o) => o.attendance_id === item.attendance_id
                    );
                    return (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="px-3 py-2">{item.user.name}</td>
                    <td className="px-3 py-2">{item.shift.name}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span>
                          {item.clock_in_time ? (
                            formatDateTime(item.clock_in_time)
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </span>
                        {item.clock_in?.spot && (
                          <span className="text-xs text-slate-500">
                            Spot: {item.clock_in.spot.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2">
                          {item.clock_out_time ? (
                            formatDateTime(item.clock_out_time)
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                          {isOpen && (
                            <Badge
                              variant="danger"
                              className="ml-1 whitespace-nowrap"
                            >
                              Open
                            </Badge>
                          )}
                        </span>
                        {isOpen && (
                          <span className="text-xs text-slate-500">
                            Durasi terbuka:{" "}
                            {formatOpenDuration(item.clock_in_time)}
                          </span>
                        )}
                        {item.clock_out?.spot && (
                          <span className="text-xs text-slate-500">
                            Spot: {item.clock_out.spot.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {item.status ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.status === "ON_TIME"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.status === "LATE"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.face_verified ? (
                        <span className="text-xs text-emerald-700">
                          Yes{" "}
                          {typeof item.face_match_score === "number" &&
                            `(score: ${item.face_match_score.toFixed(2)})`}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {(item.clock_in_photo_url || item.clock_out_photo_url) ? (
                        <button
                          type="button"
                          onClick={() => setPhotoItem(item)}
                          className="text-xs font-medium text-slate-900 underline"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    {canManage("ATTENDANCE_MONITORING") && (
                      <td className="px-3 py-2">
                        {isOpen ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            className="px-2 py-1 text-xs"
                            onClick={() => {
                              setForceItem(item);
                              setForceReason("");
                            }}
                          >
                            Force Clock-Out
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                )})}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-3 text-center text-sm text-slate-500"
                    >
                      No attendance records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={items.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>

      {photoItem && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl rounded-lg bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  Photos — {photoItem.user.name} ({date})
                </h3>
                <p className="text-xs text-slate-500">
                  Shift: {photoItem.shift.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoItem(null)}
                className="text-xs text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-700">
                  Clock in photo
                </p>
                {photoItem.clock_in_photo_url ? (
                  <img
                    src={
                      photoItem.clock_in_photo_url.startsWith("http")
                        ? photoItem.clock_in_photo_url
                        : `${API_BASE_URL}${photoItem.clock_in_photo_url}`
                    }
                    alt="Clock in"
                    className="h-60 w-full rounded-md object-cover"
                  />
                ) : (
                  <p className="text-xs text-slate-400">No photo.</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-700">
                  Clock out photo
                </p>
                {photoItem.clock_out_photo_url ? (
                  <img
                    src={
                      photoItem.clock_out_photo_url.startsWith("http")
                        ? photoItem.clock_out_photo_url
                        : `${API_BASE_URL}${photoItem.clock_out_photo_url}`
                    }
                    alt="Clock out"
                    className="h-60 w-full rounded-md object-cover"
                  />
                ) : (
                  <p className="text-xs text-slate-400">No photo.</p>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Spot saat kejadian ditampilkan di bawah waktu clock in/out.
            </p>
            {photoItem.activities && photoItem.activities.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <h4 className="mb-2 text-xs font-semibold text-slate-700">
                  Activity photos
                </h4>
                <div className="grid gap-3 md:grid-cols-3">
                  {photoItem.activities.map((act) => (
                    <div
                      key={act.id}
                      className="rounded-md border bg-slate-50 p-2 text-xs"
                    >
                      <div className="mb-1 h-28 overflow-hidden rounded bg-white">
                        <img
                          src={
                            act.photo_url.startsWith("http")
                              ? act.photo_url
                              : `${API_BASE_URL}${act.photo_url}`
                          }
                          alt="Activity"
                          className="h-28 w-full object-cover"
                        />
                      </div>
                      <p className="font-medium">
                        {new Date(act.taken_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {act.spot && (
                        <p className="text-[11px] text-slate-600">
                          Spot: {act.spot.name}
                        </p>
                      )}
                      {act.note && (
                        <p className="mt-1 text-[11px] text-slate-700">
                          {act.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={!!forceItem}
        onClose={() => {
          if (forceLoading) return;
          setForceItem(null);
          setForceReason("");
        }}
        title="Force Clock-Out"
      >
        {forceItem && (
          <form onSubmit={handleForceSubmit} className="space-y-4">
            <p className="text-sm text-slate-700">
              Paksa clock-out untuk{" "}
              <span className="font-semibold">{forceItem.user.name}</span> pada
              shift <span className="font-semibold">{forceItem.shift.name}</span>?
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Reason
              </label>
              <textarea
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                rows={3}
                value={forceReason}
                onChange={(e) => setForceReason(e.target.value)}
                placeholder="Berikan alasan kenapa perlu force clock-out..."
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (forceLoading) return;
                  setForceItem(null);
                  setForceReason("");
                }}
                disabled={forceLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="danger"
                loading={forceLoading}
              >
                Force Clock-Out
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
