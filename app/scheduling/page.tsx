"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";
import {
  ApiError,
  Satpam,
  Shift,
  AdminUserShiftItem,
} from "@/lib/types";
import { Button, ConfirmModal, Modal } from "@/components/ui";
import { showError, showSuccess } from "@/lib/toast";
import { formatDate } from "@/lib/date";
import { Pagination } from "@/components/pagination";
import { canManage, canView } from "@/lib/permissions";

interface FormState {
  user_id: string;
  shift_id: string;
  shift_date: string;
}

export default function SchedulingPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [satpam, setSatpam] = useState<Satpam[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    user_id: "",
    shift_id: "",
    shift_date: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState<AdminUserShiftItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [scheduleMonth, setScheduleMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [scheduleYear, setScheduleYear] = useState<number>(
    new Date().getFullYear()
  );
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!canView("SCHEDULING")) {
      showError("You do not have access to this page.");
      router.replace("/dashboard");
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [satpamData, shiftData] = await Promise.all([
          apiFetch<Satpam[]>("/v1/admin/satpam"),
          apiFetch<Shift[]>("/v1/admin/shifts"),
        ]);
        setSatpam(satpamData);
        setShifts(shiftData);
        await loadItems();
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace("/login");
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load scheduling data"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ready, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (!canManage("SCHEDULING")) {
      showError("You do not have permission to manage scheduling.");
      setSubmitting(false);
      return;
    }
    try {
      if (editingId != null) {
        await apiFetch(`/v1/admin/user-shifts/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            shift_id: Number(form.shift_id),
            shift_date: form.shift_date,
          }),
        });
        showSuccess("Shift assignment updated.");
        setEditingId(null);
      } else {
        await apiFetch("/v1/admin/user-shifts", {
          method: "POST",
          body: JSON.stringify({
            user_id: Number(form.user_id),
            shift_id: Number(form.shift_id),
            shift_date: form.shift_date,
          }),
        });
        showSuccess("Shift assigned.");
      }
      await loadItems();
      setFormOpen(false);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to assign shift";
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: AdminUserShiftItem) => {
    setEditingId(item.id);
    setForm({
      user_id: String(item.user_id),
      shift_id: String(item.shift_id),
      shift_date: item.shift_date?.slice(0, 10) || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      user_id: "",
      shift_id: "",
      shift_date: "",
    });
  };

  const handleDelete = async (id: number) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId == null) return;
    const id = confirmDeleteId;
    if (!canManage("SCHEDULING")) {
      showError("You do not have permission to delete scheduling.");
      return;
    }
    try {
      await apiFetch(`/v1/admin/user-shifts/${id}`, {
        method: "DELETE",
      });
      await loadItems();
      if (editingId === id) {
        cancelEdit();
      }
      setConfirmDeleteId(null);
      showSuccess("Shift assignment deleted.");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to delete shift assignment";
      showError(msg);
    }
  };

  const loadItems = async (overrideDate?: string) => {
    try {
      const date = overrideDate ?? filterDate;
      const qs = date ? `?date=${date}` : "";
      const data = await apiFetch<AdminUserShiftItem[]>(
        `/v1/admin/user-shifts${qs}`
      );
      setItems(data);
      setPage(1);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load assigned shifts";
      showError(msg);
    }
  };

  if (!ready) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Shift Scheduling</h2>
          <p className="text-xs text-slate-500">
            Assign shifts to satpam for specific dates.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {canManage("SCHEDULING") && (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setDownloadOpen(true);
                }}
              >
                Download Template
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setImportOpen(true);
                  setImportResult(null);
                  setImportFile(null);
                }}
              >
                Import Jadwal
              </Button>
            </div>
          )}
          {canManage("SCHEDULING") && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingId(null);
                setForm({
                  user_id: "",
                  shift_id: "",
                  shift_date: "",
                });
                setFormOpen(true);
              }}
            >
              + Assign Shift
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Assigned Shifts</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">
                Filter date
              </label>
              <input
                type="date"
                className="rounded-md border px-2 py-1.5 text-sm"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  void loadItems();
                }}
              >
                Apply
              </Button>
              {filterDate && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFilterDate("");
                    void loadItems("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Satpam</th>
                <th className="px-3 py-2">Shift</th>
                {canManage("SCHEDULING") && (
                  <th className="px-3 py-2">Actions</th>
                )}
              </tr>
            </thead>
              <tbody>
              {items
                .slice((page - 1) * pageSize, page * pageSize)
                .map((it) => (
                <tr key={it.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    {formatDate(it.shift_date)}
                  </td>
                  <td className="px-3 py-2">
                    {it.user_name} (#{it.user_id})
                  </td>
                  <td className="px-3 py-2">
                    {it.shift_name} (#{it.shift_id})
                  </td>
                  {canManage("SCHEDULING") && (
                    <td className="px-3 py-2 space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="px-2 py-1 text-xs"
                        onClick={() => {
                          startEdit(it);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        className="px-2 py-1 text-xs"
                        onClick={() => handleDelete(it.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-3 text-center text-sm text-slate-500"
                  >
                    No shifts assigned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={items.length}
          onPageChange={setPage}
        />
      </section>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingId(null);
        }}
        title={editingId != null ? "Edit Shift Assignment" : "Assign Shift"}
      >
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-3 md:items-end"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Satpam
              </label>
              <select
                required
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                disabled={editingId != null}
                value={form.user_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, user_id: e.target.value }))
                }
              >
                <option value="">Select satpam</option>
                {satpam.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Shift
              </label>
              <select
                required
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.shift_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, shift_id: e.target.value }))
                }
              >
                <option value="">Select shift</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_time}-{s.end_time})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Date
              </label>
              <input
                type="date"
                required
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.shift_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, shift_date: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setFormOpen(false);
                  cancelEdit();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={submitting}
              >
                {submitting
                  ? editingId != null
                    ? "Saving..."
                    : "Assigning..."
                  : editingId != null
                  ? "Save"
                  : "Assign Shift"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        open={confirmDeleteId != null}
        title="Delete Shift Assignment"
        message="Delete this shift assignment? This cannot be undone."
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
      />

      <Modal
        open={downloadOpen}
        onClose={() => {
          if (!downloadingTemplate) {
            setDownloadOpen(false);
          }
        }}
        title="Download Scheduling Template"
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canManage("SCHEDULING")) {
              showError("You do not have permission to download templates.");
              return;
            }
            setDownloadingTemplate(true);
            try {
              const params = new URLSearchParams({
                month: String(scheduleMonth),
                year: String(scheduleYear),
              });
              const token = getToken();
              const res = await fetch(
                `${
                  process.env.NEXT_PUBLIC_API_BASE_URL ||
                  "http://localhost:8686"
                }/v1/admin/scheduling/template?${params.toString()}`,
                {
                  headers: token
                    ? {
                        Authorization: `Bearer ${token}`,
                      }
                    : undefined,
                }
              );
              if (!res.ok) {
                throw new Error("Failed to download template");
              }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `SIAGA_Scheduling_Template_${scheduleYear}-${String(
                scheduleMonth
              ).padStart(2, "0")}.xlsx`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              showSuccess("Scheduling template downloaded.");
              setDownloadOpen(false);
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : "Failed to download template";
              showError(msg);
            } finally {
              setDownloadingTemplate(false);
            }
          }}
          className="space-y-4"
        >
          <p className="text-xs text-slate-600">
            Select month and year to generate the scheduling template. The file
            will include all active satpam.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">
                Month
              </label>
              <select
                className="rounded-md border px-2 py-1.5 text-xs"
                value={scheduleMonth}
                onChange={(e) => setScheduleMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">
                Year
              </label>
              <input
                type="number"
                className="w-20 rounded-md border px-2 py-1.5 text-xs"
                value={scheduleYear}
                onChange={(e) => setScheduleYear(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!downloadingTemplate) {
                  setDownloadOpen(false);
                }
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={downloadingTemplate}>
              Download
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportFile(null);
          setImportResult(null);
        }}
        title="Import Scheduling"
        size="lg"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!importFile) {
              showError("Please select an Excel (.xlsx) file.");
              return;
            }
              setImporting(true);
            try {
              const formData = new FormData();
              formData.append("file", importFile);
              const token = getToken();
              const res = await fetch(
                `${
                  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8686"
                }/v1/admin/scheduling/import`,
                {
                  method: "POST",
                  body: formData,
                  headers: token
                    ? {
                        Authorization: `Bearer ${token}`,
                      }
                    : undefined,
                }
              );
              const payload = await res.json();
              if (!res.ok || !payload.success) {
                const msg =
                  payload?.error?.message ||
                  "Failed to import scheduling from Excel";
                showError(msg);
                return;
              }
              setImportResult(payload.data);
              showSuccess("Scheduling import completed.");
              await loadItems();
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : "Failed to import scheduling from Excel";
              showError(msg);
            } finally {
              setImporting(false);
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <p className="text-xs text-slate-600">
              Upload the filled scheduling template (.xlsx). Only shift codes
              that are listed in the KET section of the template are allowed in
              the day columns.
            </p>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setImportFile(file);
              }}
              className="text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setImportOpen(false);
                setImportFile(null);
                setImportResult(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={importing}>
              Import
            </Button>
          </div>
        </form>

        {importResult && (
          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700">
              Import Summary
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <p>Processed rows: {importResult.processed_rows}</p>
              <p>Processed cells: {importResult.processed_cells}</p>
              <p>Inserted: {importResult.inserted}</p>
              <p>Updated: {importResult.updated}</p>
              <p>Skipped: {importResult.skipped}</p>
            </div>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-2">
                <h5 className="mb-1 text-xs font-semibold text-red-700">
                  Errors
                </h5>
                <div className="max-h-56 overflow-y-auto">
                  <table className="min-w-full text-left text-[11px]">
                    <thead className="border-b bg-red-50 text-[10px] font-medium text-red-700">
                      <tr>
                        <th className="px-2 py-1">Satpam</th>
                        <th className="px-2 py-1">Date</th>
                        <th className="px-2 py-1">Value</th>
                        <th className="px-2 py-1">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((err: any, idx: number) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-2 py-1">{err.satpam_name}</td>
                          <td className="px-2 py-1">{err.date}</td>
                          <td className="px-2 py-1">{err.value}</td>
                          <td className="px-2 py-1">{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
