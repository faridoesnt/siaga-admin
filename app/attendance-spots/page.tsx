"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError, AttendanceSpot } from "@/lib/types";
import { Button, ConfirmModal, Modal } from "@/components/ui";
import { showError, showSuccess } from "@/lib/toast";
import { Pagination } from "@/components/pagination";
import { canManage, canView } from "@/lib/permissions";

interface CreateSpotForm {
  name: string;
  latitude: string;
  longitude: string;
  radius_meter: string;
}

export default function AttendanceSpotsPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [spots, setSpots] = useState<AttendanceSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateSpotForm>({
    name: "",
    latitude: "",
    longitude: "",
    radius_meter: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!ready) return;
    if (!canView("ATTENDANCE_SPOT")) {
      showError("You do not have access to this page.");
      router.replace("/dashboard");
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<AttendanceSpot[]>(
          "/v1/admin/attendance-spots"
        );
        setSpots(data);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace("/login");
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load attendance spots"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ready, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage("ATTENDANCE_SPOT")) {
      setSubmitError("You do not have permission to manage attendance spots.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radius_meter: Number(form.radius_meter),
      };
      if (editingId != null) {
        const updated = await apiFetch<AttendanceSpot>(
          `/v1/admin/attendance-spots/${editingId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );
        setSpots((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s))
        );
        setEditingId(null);
      } else {
        const created = await apiFetch<AttendanceSpot>(
          "/v1/admin/attendance-spots",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
        setSpots((prev) => [...prev, created]);
      }
      setForm({ name: "", latitude: "", longitude: "", radius_meter: "" });
      setCreateOpen(false);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to create attendance spot"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (spot: AttendanceSpot) => {
    setEditingId(spot.id);
    setForm({
      name: spot.name,
      latitude: String(spot.latitude),
      longitude: String(spot.longitude),
      radius_meter: String(spot.radius_meters),
    });
    setCreateOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", latitude: "", longitude: "", radius_meter: "" });
    setSubmitError(null);
  };

  const handleDelete = async (id: number) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId == null) return;
    const id = confirmDeleteId;
    setSubmitError(null);
    if (!canManage("ATTENDANCE_SPOT")) {
      setSubmitError("You do not have permission to delete attendance spots.");
      return;
    }
    try {
      await apiFetch(`/v1/admin/attendance-spots/${id}`, {
        method: "DELETE",
      });
      setSpots((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) {
        cancelEdit();
      }
      setConfirmDeleteId(null);
      showSuccess("Attendance spot deleted.");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to delete attendance spot";
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
          <h2 className="text-xl font-semibold">Attendance Spots</h2>
          <p className="text-xs text-slate-500">
            Define geofenced locations for attendance.
          </p>
        </div>
        {canManage("ATTENDANCE_SPOT") && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingId(null);
              setForm({
                name: "",
                latitude: "",
                longitude: "",
                radius_meter: "",
              });
              setCreateOpen(true);
            }}
          >
            + Add Spot
          </Button>
        )}
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Spots List
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
                  <th className="px-3 py-2">Latitude</th>
                  <th className="px-3 py-2">Longitude</th>
                  <th className="px-3 py-2">Radius (m)</th>
                  {canManage("ATTENDANCE_SPOT") && (
                    <th className="px-3 py-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {spots
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.latitude}</td>
                    <td className="px-3 py-2">{s.longitude}</td>
                    <td className="px-3 py-2">{s.radius_meters}</td>
                    {canManage("ATTENDANCE_SPOT") && (
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
                {spots.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-3 text-center text-sm text-slate-500"
                    >
                      No attendance spots.
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
          total={spots.length}
          onPageChange={setPage}
        />
      </section>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setSubmitError(null);
        }}
        title={editingId != null ? "Edit Attendance Spot" : "Create Attendance Spot"}
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
              Latitude
            </label>
            <input
              type="number"
              step="0.000001"
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={form.latitude}
              onChange={(e) =>
                setForm((f) => ({ ...f, latitude: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Longitude
            </label>
            <input
              type="number"
              step="0.000001"
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={form.longitude}
              onChange={(e) =>
                setForm((f) => ({ ...f, longitude: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Radius (meter)
            </label>
            <input
              type="number"
              min={1}
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={form.radius_meter}
              onChange={(e) =>
                setForm((f) => ({ ...f, radius_meter: e.target.value }))
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
        title="Delete Attendance Spot"
        message="Delete this attendance spot? This cannot be undone."
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
