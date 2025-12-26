"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError, Shift } from "@/lib/types";
import { Button, ConfirmModal, Modal } from "@/components/ui";
import { showError, showSuccess } from "@/lib/toast";
import { Pagination } from "@/components/pagination";
import { downloadApiFile } from "@/lib/download";
import { getToken, clearToken } from "@/lib/auth";
import { canManage, canView } from "@/lib/permissions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8686";

interface CreateShiftForm {
  name: string;
  start_time: string;
  end_time: string;
  late_tolerance_minute: string;
}

export default function ShiftsPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateShiftForm>({
    name: "",
    start_time: "",
    end_time: "",
    late_tolerance_minute: "10",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!canView("SHIFT")) {
      showError("You do not have access to this page.");
      router.replace("/dashboard");
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Shift[]>("/v1/admin/shifts");
        setShifts(data);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace("/login");
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load shifts"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ready, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!canManage("SHIFT")) {
      setSubmitError("You do not have permission to manage shifts.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        start_time: form.start_time,
        end_time: form.end_time,
        late_tolerance_minute: Number(form.late_tolerance_minute || "0"),
      };
      if (editingId != null) {
        const updated = await apiFetch<Shift>(`/v1/admin/shifts/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setShifts((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s))
        );
        setEditingId(null);
        showSuccess("Shift updated.");
      } else {
        const created = await apiFetch<Shift>("/v1/admin/shifts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setShifts((prev) => [...prev, created]);
        showSuccess("Shift created.");
      }
      setForm({
        name: "",
        start_time: "",
        end_time: "",
        late_tolerance_minute: "10",
      });
      setCreateOpen(false);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to create shift";
      setSubmitError(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (shift: Shift) => {
    setEditingId(shift.id);
    setForm({
      name: shift.name,
      start_time: shift.start_time?.slice(0, 5) || "",
      end_time: shift.end_time?.slice(0, 5) || "",
      late_tolerance_minute: String(shift.late_tolerance_minute),
    });
    setCreateOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      name: "",
      start_time: "",
      end_time: "",
      late_tolerance_minute: "10",
    });
    setSubmitError(null);
  };

  const handleDelete = async (id: number) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId == null) return;
    const id = confirmDeleteId;
    setSubmitError(null);
    if (!canManage("SHIFT")) {
      setSubmitError("You do not have permission to delete shifts.");
      return;
    }
    try {
      await apiFetch(`/v1/admin/shifts/${id}`, {
        method: "DELETE",
      });
      setShifts((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) {
        cancelEdit();
      }
      setConfirmDeleteId(null);
      showSuccess("Shift deleted.");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to delete shift";
      showError(msg);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!canManage("SHIFT")) {
      showError("You do not have permission to manage shifts.");
      return;
    }
    try {
      await downloadApiFile(
        "/v1/admin/import-templates/shifts",
        `shift_import_template_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      showSuccess("Template downloaded.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to download template";
      showError(msg);
    }
  };

  const handleImportFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] ?? null;
    setImportFile(file);
    setImportError(null);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError("Please select an Excel (.xlsx) file.");
      return;
    }
    if (!canManage("SHIFT")) {
      setImportError("You do not have permission to manage shifts.");
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await fetch(`${API_BASE_URL}/v1/admin/import/shifts`, {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
        body: formData,
      });

      if (res.status === 401 || res.status === 403) {
        clearToken();
        router.replace("/login");
        return;
      }

      let payload: { success: boolean; data?: any; error?: { message?: string } };
      try {
        payload = await res.json();
      } catch {
        throw new Error("Invalid response from server");
      }

      if (!res.ok || !payload.success) {
        const msg = payload.error?.message || "Failed to import shifts";
        setImportError(msg);
        showError(msg);
        return;
      }

      const inserted = payload.data?.inserted_count ?? 0;
      showSuccess(`Imported ${inserted} shifts.`);

      const data = await apiFetch<Shift[]>("/v1/admin/shifts");
      setShifts(data);

      setImportOpen(false);
      setImportFile(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to import shifts";
      setImportError(msg);
      showError(msg);
    } finally {
      setImporting(false);
    }
  };

  if (!ready) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Shifts</h2>
          <p className="text-xs text-slate-500">
            Manage shift templates for scheduling.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {canManage("SHIFT") && (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleDownloadTemplate}
              >
                Download Template
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setImportOpen(true);
                  setImportError(null);
                }}
              >
                Import from Excel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    name: "",
                    start_time: "",
                    end_time: "",
                    late_tolerance_minute: "10",
                  });
                  setCreateOpen(true);
                }}
              >
                + Add Shift
              </Button>
            </>
          )}
        </div>
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-700">
          Shifts List
        </h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Start</th>
                  <th className="px-3 py-2">End</th>
                  <th className="px-3 py-2">Late tolerance</th>
                  {canManage("SHIFT") && (
                    <th className="px-3 py-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {shifts
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.start_time}</td>
                    <td className="px-3 py-2">{s.end_time}</td>
                    <td className="px-3 py-2">
                      {s.late_tolerance_minute} min
                    </td>
                    {canManage("SHIFT") && (
                      <td className="px-3 py-2 space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-xs px-2 py-1"
                          onClick={() => startEdit(s)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          className="text-xs px-2 py-1"
                          onClick={() => handleDelete(s.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
                {shifts.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-3 text-center text-sm text-slate-500"
                    >
                      No shifts defined.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          pageSize={pageSize}
          total={shifts.length}
          onPageChange={setPage}
        />
      </section>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setSubmitError(null);
        }}
        title={editingId != null ? "Edit Shift" : "Create Shift"}
      >
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 md:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Name
            </label>
            <input
              type="text"
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Start time
            </label>
            <input
              type="time"
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={form.start_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, start_time: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              End time
            </label>
            <input
              type="time"
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={form.end_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, end_time: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Late tolerance (minutes)
            </label>
            <input
              type="number"
              min={0}
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={form.late_tolerance_minute}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  late_tolerance_minute: e.target.value,
                }))
              }
            />
          </div>
          {submitError && (
            <div className="md:col-span-2">
              <p className="text-xs text-red-600">{submitError}</p>
            </div>
          )}
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setCreateOpen(false);
                setSubmitError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={submitting}
            >
              {editingId != null ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmDeleteId != null}
        title="Delete Shift"
        message="Delete this shift? This cannot be undone."
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
      />

      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportFile(null);
          setImportError(null);
        }}
        title="Import Shifts from Excel"
      >
        <form onSubmit={handleImportSubmit} className="space-y-3">
          <p className="text-xs text-slate-600">
            Upload Excel (.xlsx) file using the Shift import template.
          </p>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleImportFileChange}
            className="w-full text-xs"
          />
          {importError && (
            <p className="text-xs text-red-600">{importError}</p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setImportOpen(false);
                setImportFile(null);
                setImportError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={importing}>
              Import
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
