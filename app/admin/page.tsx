"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { canManage, canView } from "@/lib/permissions";
import { apiFetch } from "@/lib/apiClient";
import { ApiError } from "@/lib/types";
import { toast } from "react-toastify";
import { Button } from "@/components/ui";

type Permission = {
  code: string;
  label: string;
};

type AdminItem = {
  id: number;
  name: string;
  email: string;
  permissions: string[];
};

export default function AdminPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modalType, setModalType] = useState<"create" | "edit" | "reset" | "delete" | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminItem | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPerms, setFormPerms] = useState<string[]>([]);

  useEffect(() => {
    if (!ready) return;

    if (!canView("ADMIN")) {
      toast.error("You do not have access to this page.");
      router.replace("/dashboard");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const [perms, admins] = await Promise.all([
          apiFetch<Permission[]>("/v1/admin/permissions"),
          apiFetch<AdminItem[]>("/v1/admin/admins"),
        ]);
        setPermissions(perms);
        setItems(admins);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace("/login");
          return;
        }
        toast.error("Gagal memuat data admin");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ready, router]);

  const openCreate = () => {
    setSelectedAdmin(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormPerms([]);
    setModalType("create");
  };

  const openEdit = (admin: AdminItem) => {
    setSelectedAdmin(admin);
    setFormName(admin.name);
    setFormEmail(admin.email);
    setFormPassword("");
    setFormPerms(admin.permissions || []);
    setModalType("edit");
  };

  const openReset = (admin: AdminItem) => {
    setSelectedAdmin(admin);
    setFormPassword("");
    setModalType("reset");
  };

  const openDelete = (admin: AdminItem) => {
    setSelectedAdmin(admin);
    setModalType("delete");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedAdmin(null);
  };

  const togglePerm = (code: string) => {
    setFormPerms((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmitCreate = async () => {
    if (!canManage("ADMIN")) {
      toast.error("Tidak punya izin untuk membuat admin.");
      return;
    }
    try {
      const payload = {
        name: formName,
        email: formEmail,
        password: formPassword,
        permissions: formPerms,
      };
      const created = await apiFetch<AdminItem>("/v1/admin/admins", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setItems((prev) => [...prev, created]);
      toast.success("Admin berhasil dibuat");
      closeModal();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal membuat admin"
      );
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedAdmin) return;
    if (!canManage("ADMIN")) {
      toast.error("Tidak punya izin untuk mengubah admin.");
      return;
    }
    try {
      const payload = {
        name: formName,
        email: formEmail,
        permissions: formPerms,
      };
      const updated = await apiFetch<AdminItem>(`/v1/admin/admins/${selectedAdmin.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setItems((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success("Admin berhasil diperbarui");
      closeModal();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah admin"
      );
    }
  };

  const handleSubmitReset = async () => {
    if (!selectedAdmin) return;
    if (!canManage("ADMIN")) {
      toast.error("Tidak punya izin untuk reset password.");
      return;
    }
    try {
      await apiFetch(`/v1/admin/admins/${selectedAdmin.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: formPassword }),
      });
      toast.success("Password admin berhasil direset");
      closeModal();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal reset password admin"
      );
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedAdmin) return;
    if (!canManage("ADMIN")) {
      toast.error("Tidak punya izin untuk menghapus admin.");
      return;
    }
    try {
      await apiFetch(`/v1/admin/admins/${selectedAdmin.id}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((a) => a.id !== selectedAdmin.id));
      toast.success("Admin berhasil dihapus");
      closeModal();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus admin"
      );
    }
  };

  if (!ready) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-40 animate-pulse rounded-lg border bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Admin Management
          </h1>
          <p className="text-xs text-slate-500">
            Kelola akun admin dan izin akses fitur SIAGA CS.
          </p>
        </div>
        {canManage("ADMIN") && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            + Add Admin
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Permissions</th>
              {canManage("ADMIN") && (
                <th className="px-3 py-2 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((admin) => (
              <tr key={admin.id} className="border-t last:border-b-0">
                <td className="px-3 py-1.5">{admin.name}</td>
                <td className="px-3 py-1.5">{admin.email}</td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {admin.permissions.map((code) => (
                      <span
                        key={code}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </td>
                {canManage("ADMIN") && (
                  <td className="px-3 py-1.5 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(admin)}
                        className="text-xs font-medium text-slate-700 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openReset(admin)}
                        className="text-xs font-medium text-amber-700 hover:underline"
                      >
                        Reset Password
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        className="text-xs px-2 py-1"
                        onClick={() => openDelete(admin)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalType && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-lg">
            {modalType === "create" && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Create Admin
                  </h2>
                  <button
                    type="button"
                    className="text-xs text-slate-500"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
                <AdminForm
                  permissions={permissions}
                  formName={formName}
                  formEmail={formEmail}
                  formPassword={formPassword}
                  formPerms={formPerms}
                  setFormName={setFormName}
                  setFormEmail={setFormEmail}
                  setFormPassword={setFormPassword}
                  togglePerm={togglePerm}
                  onSubmit={handleSubmitCreate}
                />
              </>
            )}
            {modalType === "edit" && selectedAdmin && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Edit Admin
                  </h2>
                  <button
                    type="button"
                    className="text-xs text-slate-500"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
                <AdminForm
                  permissions={permissions}
                  formName={formName}
                  formEmail={formEmail}
                  formPassword={formPassword}
                  formPerms={formPerms}
                  setFormName={setFormName}
                  setFormEmail={setFormEmail}
                  setFormPassword={setFormPassword}
                  togglePerm={togglePerm}
                  onSubmit={handleSubmitEdit}
                  hidePassword
                />
              </>
            )}
            {modalType === "reset" && selectedAdmin && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Reset Password
                  </h2>
                  <button
                    type="button"
                    className="text-xs text-slate-500"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Reset password untuk <span className="font-semibold">{selectedAdmin.email}</span>.
                  </p>
                  <label className="block text-xs font-medium text-slate-700">
                    New password
                    <input
                      type="password"
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                    />
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitReset}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </>
            )}
            {modalType === "delete" && selectedAdmin && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-rose-700">
                    Delete Admin
                  </h2>
                  <button
                    type="button"
                    className="text-xs text-slate-500"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs text-slate-700">
                  Yakin ingin menghapus admin{" "}
                  <span className="font-semibold">{selectedAdmin.email}</span>?
                  Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={handleSubmitDelete}
                  >
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type AdminFormProps = {
  permissions: Permission[];
  formName: string;
  formEmail: string;
  formPassword: string;
  formPerms: string[];
  setFormName: (v: string) => void;
  setFormEmail: (v: string) => void;
  setFormPassword: (v: string) => void;
  togglePerm: (code: string) => void;
  onSubmit: () => void;
  hidePassword?: boolean;
};

function AdminForm({
  permissions,
  formName,
  formEmail,
  formPassword,
  formPerms,
  setFormName,
  setFormEmail,
  setFormPassword,
  togglePerm,
  onSubmit,
  hidePassword,
}: AdminFormProps) {
  const grouped = {
    Dashboard: permissions.filter((p) => p.code.startsWith("DASHBOARD_")),
    Satpam: permissions.filter((p) => p.code.startsWith("SATPAM_")),
    "Attendance Spot": permissions.filter((p) =>
      p.code.startsWith("ATTENDANCE_SPOT_")
    ),
    Shift: permissions.filter((p) => p.code.startsWith("SHIFT_")),
    Scheduling: permissions.filter((p) => p.code.startsWith("SCHEDULING_")),
    "Spot Assignment": permissions.filter((p) =>
      p.code.startsWith("SPOT_ASSIGNMENT_")
    ),
    "Shift Swap": permissions.filter((p) => p.code.startsWith("SHIFT_SWAP_")),
    "Attendance Monitoring": permissions.filter((p) =>
      p.code.startsWith("ATTENDANCE_MONITORING_")
    ),
    Admin: permissions.filter((p) => p.code.startsWith("ADMIN_")),
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-700">
          Name
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
          />
        </label>
        {!hidePassword && (
          <label className="block text-xs font-medium text-slate-700">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
            />
          </label>
        )}
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-slate-200 px-3 py-2">
        {Object.entries(grouped).map(([group, perms]) => {
          if (perms.length === 0) return null;
          return (
            <div key={group} className="mb-1">
              <p className="text-[11px] font-semibold text-slate-700">
                {group}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {perms.map((p) => (
                  <label
                    key={p.code}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-600"
                  >
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      checked={formPerms.includes(p.code)}
                      onChange={() => togglePerm(p.code)}
                    />
                    <span>{p.code.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Save
        </button>
      </div>
    </div>
  );
}
