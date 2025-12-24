"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
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

  useEffect(() => {
    if (!ready) return;
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
                <th className="px-3 py-2">Actions</th>
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
    </div>
  );
}
