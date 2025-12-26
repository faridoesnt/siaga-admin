"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError, FaceEnrollStatus, Satpam } from "@/lib/types";
import { Badge, Button, ConfirmModal, Modal } from "@/components/ui";
import { showError, showSuccess } from "@/lib/toast";
import { formatDate } from "@/lib/date";
import { Pagination } from "@/components/pagination";
import { downloadApiFile } from "@/lib/download";
import { getToken, clearToken } from "@/lib/auth";
import { canManage, canView } from "@/lib/permissions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8686";

interface CreateSatpamForm {
  name: string;
  email: string;
  password: string;
  is_active: boolean;
  jabatan: string;
  jenis_kelamin: "L" | "P";
  tanggal_lahir: string;
  tempat_lahir: string;
  no_ktp: string;
  alamat: string;
  no_telepon: string;
  agama: string;
  status_pernikahan: string;
  kebangsaan: string;
  work_start_date: string;
}

interface EditSatpamForm {
  name: string;
  email: string;
  is_active: boolean;
  jabatan: string;
  jenis_kelamin: "L" | "P";
  tanggal_lahir: string;
  tempat_lahir: string;
  no_ktp: string;
  alamat: string;
  no_telepon: string;
  agama: string;
  status_pernikahan: string;
  kebangsaan: string;
  work_start_date: string;
}

export default function SatpamPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [satpam, setSatpam] = useState<Satpam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateSatpamForm>({
    name: "",
    email: "",
    password: "",
    is_active: true,
    jabatan: "",
    jenis_kelamin: "L",
    tanggal_lahir: "",
    tempat_lahir: "",
    no_ktp: "",
    alamat: "",
    no_telepon: "",
    agama: "",
    status_pernikahan: "",
    kebangsaan: "",
    work_start_date: "",
  });

  const [editing, setEditing] = useState<Satpam | null>(null);
  const [editForm, setEditForm] = useState<EditSatpamForm>({
    name: "",
    email: "",
    is_active: true,
    jabatan: "",
    jenis_kelamin: "L",
    tanggal_lahir: "",
    tempat_lahir: "",
    no_ktp: "",
    alamat: "",
    no_telepon: "",
    agama: "",
    status_pernikahan: "",
    kebangsaan: "",
    work_start_date: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [enrollUser, setEnrollUser] = useState<Satpam | null>(null);
  const [enrollFiles, setEnrollFiles] = useState<File[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);
  const [enrollStatus, setEnrollStatus] = useState<FaceEnrollStatus | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    type: "toggle" | "delete" | "deleteEnroll" | "resetPassword" | null;
    target?: Satpam;
  }>({ type: null });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [viewSatpam, setViewSatpam] = useState<Satpam | null>(null);
  const [actionMenuFor, setActionMenuFor] = useState<number | null>(null);

  const toInputDate = (value?: string | null): string => {
    if (!value) return "";
    // If already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    // If ISO string, cut to first 10 chars
    if (value.length >= 10 && value[4] === "-" && value[7] === "-") {
      return value.slice(0, 10);
    }
    // Fallback via Date parsing
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
    return value;
  };

  // Close action dropdown when clicking anywhere outside the actions cell.
  useEffect(() => {
    if (actionMenuFor === null) return;
    const handleClickOutside = () => {
      setActionMenuFor(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [actionMenuFor]);

  useEffect(() => {
    if (!ready) return;

    const canViewSatpam = canView("SATPAM");
    if (!canViewSatpam) {
      showError("You do not have access to this page.");
      router.replace("/dashboard");
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Satpam[]>("/v1/admin/satpam");
        setSatpam(data);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load satpam");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ready, router]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return satpam;
    return satpam.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [satpam, search]);

  useEffect(() => {
    setPage(1);
  }, [search, satpam.length]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage("SATPAM")) {
      showError("You do not have permission to manage satpam.");
      return;
    }
    setCreating(true);
    try {
      const created = await apiFetch<Satpam>("/v1/admin/satpam", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      setSatpam((prev) => [...prev, created]);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        is_active: true,
        jabatan: "",
        jenis_kelamin: "L",
        tanggal_lahir: "",
        tempat_lahir: "",
        no_ktp: "",
        alamat: "",
        no_telepon: "",
        agama: "",
        status_pernikahan: "",
        kebangsaan: "",
        work_start_date: "",
      });
      showSuccess("Satpam created.");
      setCreateOpen(false);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to create satpam";
      showError(msg);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (user: Satpam) => {
    setConfirmState({ type: "toggle", target: user });
  };

  const confirmToggleActive = async () => {
    const user = confirmState.target;
    if (!user) return;
    if (!canManage("SATPAM")) {
      showError("You do not have permission to change status.");
      return;
    }
    try {
      await apiFetch<{ id: number; is_active: boolean }>(
        `/v1/admin/satpam/${user.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: !user.is_active }),
        }
      );
      // Refresh list from server to ensure FE matches BE state.
      const data = await apiFetch<Satpam[]>("/v1/admin/satpam");
      setSatpam(data);
      showSuccess(
        `Satpam ${user.name} set to ${
          !user.is_active ? "active" : "inactive"
        }.`
      );
      setConfirmState({ type: null });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to update satpam status";
      showError(msg);
    }
  };

  const startEdit = (user: Satpam) => {
    setEditing(user);
    setEditForm({
      name: user.name,
      email: user.email,
      is_active: user.is_active,
      jabatan: user.jabatan || "",
      jenis_kelamin: user.jenis_kelamin,
      tanggal_lahir: toInputDate(user.tanggal_lahir),
      tempat_lahir: user.tempat_lahir || "",
      no_ktp: user.no_ktp || "",
      alamat: user.alamat || "",
      no_telepon: user.no_telepon || "",
      agama: user.agama || "",
      status_pernikahan: user.status_pernikahan || "",
      kebangsaan: user.kebangsaan || "",
      work_start_date: toInputDate(user.work_start_date),
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditForm({
      name: "",
      email: "",
      is_active: true,
      jabatan: "",
      jenis_kelamin: "L",
      tanggal_lahir: "",
      tempat_lahir: "",
      no_ktp: "",
      alamat: "",
      no_telepon: "",
      agama: "",
      status_pernikahan: "",
      kebangsaan: "",
      work_start_date: "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    try {
      const updated = await apiFetch<Satpam>(`/v1/admin/satpam/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setSatpam((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      cancelEdit();
      showSuccess("Satpam updated.");
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to update satpam";
      showError(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (user: Satpam) => {
    setConfirmState({ type: "delete", target: user });
  };

  const confirmDelete = async () => {
    const user = confirmState.target;
    if (!user) return;
    if (!canManage("SATPAM")) {
      showError("You do not have permission to delete satpam.");
      return;
    }
    try {
      await apiFetch(`/v1/admin/satpam/${user.id}`, {
        method: "DELETE",
      });
      setSatpam((prev) => prev.filter((s) => s.id !== user.id));
      if (editing && editing.id === user.id) {
        cancelEdit();
      }
      showSuccess("Satpam deleted.");
      setConfirmState({ type: null });
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to delete satpam";
      showError(msg);
    }
  };

  const handleResetPassword = (user: Satpam) => {
    setResetPassword("");
    setConfirmState({ type: "resetPassword", target: user });
  };

  const confirmResetPassword = async () => {
    const user = confirmState.target;
    if (!user) return;
    if (!canManage("SATPAM")) {
      showError("You do not have permission to reset password.");
      return;
    }
    if (!resetPassword || resetPassword.length < 8) {
      showError("New password must be at least 8 characters.");
      return;
    }
    setResetLoading(true);
    try {
      await apiFetch(`/v1/admin/satpam/${user.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: resetPassword }),
      });
      showSuccess(`Password for ${user.name} has been reset.`);
      setConfirmState({ type: null });
      setResetPassword("");
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to reset password";
      showError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!canManage("SATPAM")) {
      showError("You do not have permission to manage satpam.");
      return;
    }
    try {
      await downloadApiFile(
        "/v1/admin/import-templates/satpam",
        `satpam_import_template_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      showSuccess("Template downloaded.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to download template";
      showError(msg);
    }
  };

  const handleExportSatpam = async () => {
    if (!canManage("SATPAM")) {
      showError("You do not have permission to export satpam.");
      return;
    }
    try {
      await downloadApiFile(
        "/v1/admin/export/satpam",
        `satpam_export_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      showSuccess("Satpam export downloaded.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to export satpam";
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
    if (!canManage("SATPAM")) {
      setImportError("You do not have permission to manage satpam.");
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await fetch(`${API_BASE_URL}/v1/admin/import/satpam`, {
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
        const msg = payload.error?.message || "Failed to import satpam";
        setImportError(msg);
        showError(msg);
        return;
      }

      const inserted = payload.data?.inserted_count ?? 0;
      showSuccess(`Imported ${inserted} satpam.`);

      // Refresh list after import
      const data = await apiFetch<Satpam[]>("/v1/admin/satpam");
      setSatpam(data);

      setImportOpen(false);
      setImportFile(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to import satpam";
      setImportError(msg);
      showError(msg);
    } finally {
      setImporting(false);
    }
  };

  const openEnroll = (user: Satpam) => {
    if (!canManage("SATPAM")) {
      showError("You do not have permission to manage face enrollment.");
      return;
    }
    setEnrollUser(user);
    setEnrollFiles([]);
    setEnrollError(null);
    setEnrollSuccess(null);
    setEnrollStatus(null);
    // load current enroll status
    apiFetch<FaceEnrollStatus>(`/v1/admin/face-enroll/${user.id}`)
      .then((res) => {
        setEnrollStatus(res);
      })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace("/login");
          return;
        }
        // diamkan; status opsional
      });
  };

  const closeEnroll = () => {
    setEnrollUser(null);
    setEnrollFiles([]);
    setEnrollError(null);
    setEnrollSuccess(null);
    setEnrollStatus(null);
  };

  const handleEnrollFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setEnrollFiles(files);
    setEnrollError(null);
    setEnrollSuccess(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollUser) return;
    if (enrollFiles.length === 0) {
      setEnrollError("Please select at least one photo.");
      return;
    }
    setEnrollError(null);
    setEnrollSuccess(null);
    setEnrolling(true);
    try {
      const images: string[] = [];
      for (const f of enrollFiles) {
        // only basic image validation here; BE will validate faces
        images.push(await fileToBase64(f));
      }
      await apiFetch("/v1/admin/face-enroll", {
        method: "POST",
        body: JSON.stringify({
          user_id: enrollUser.id,
          images,
        }),
      });
      setEnrollSuccess(
        `Face data enrolled for ${enrollUser.name}.`
      );
      showSuccess(`Face data enrolled for ${enrollUser.name}.`);
      // refresh status
      const status = await apiFetch<FaceEnrollStatus>(
        `/v1/admin/face-enroll/${enrollUser.id}`
      );
      setEnrollStatus(status);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to enroll face";
      setEnrollError(msg);
      showError(msg);
    } finally {
      setEnrolling(false);
    }
  };

  const handleEnrollDelete = async () => {
    if (!enrollUser) return;
    setConfirmState({ type: "deleteEnroll", target: enrollUser });
  };

  const confirmDeleteEnroll = async () => {
    const user = confirmState.target;
    if (!user) return;
    setEnrollError(null);
    setEnrollSuccess(null);
    try {
      await apiFetch(`/v1/admin/face-enroll/${user.id}`, {
        method: "DELETE",
      });
      setEnrollSuccess("Face enrollment deleted.");
      setEnrollStatus({
        user_id: user.id,
        enrolled: false,
        count: 0,
        model: null,
        updated_at: null,
      });
      setConfirmState({ type: null });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to delete face data";
      setEnrollError(msg);
      showError(msg);
    }
  };

  if (!ready) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  const canViewSatpam = canView("SATPAM");
  const canManageSatpam = canManage("SATPAM");
  const showActionsColumn = canViewSatpam || canManageSatpam;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
       <div>
          <h2 className="text-xl font-semibold">Satpam</h2>
          <p className="text-xs text-slate-500">
            Manage guards and face enrollment.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search by name or email"
            className="w-full rounded-md border px-3 py-1.5 text-sm sm:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              setCreateOpen(true);
            }}
            disabled={!canManage("SATPAM")}
          >
            + Add Satpam
          </Button>
        </div>
      </div>

      {/* Edit form moved into modal below; create stays hidden unless using modal */}

      {/* List */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            Satpam List
          </h3>
         <div className="flex flex-wrap gap-2">
            {canManage("SATPAM") && (
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
              </>
            )}
            {canManage("SATPAM") && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleExportSatpam}
              >
                Export Satpam
              </Button>
            )}
          </div>
        </div>
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
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Position</th>
                  <th className="px-3 py-2">Gender</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Work start</th>
                  <th className="px-3 py-2">Active</th>
                  {showActionsColumn && (
                    <th className="px-3 py-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paged.map((s, rowIndex) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.email}</td>
                    <td className="px-3 py-2">
                      {s.jabatan}
                    </td>
                    <td className="px-3 py-2">
                      {s.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                    </td>
                    <td className="px-3 py-2">{s.no_telepon}</td>
                    <td className="px-3 py-2">
                      {s.work_start_date ? (
                        formatDate(s.work_start_date)
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={s.is_active ? "success" : "muted"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    {showActionsColumn && (
                      <td
                        className="px-3 py-2"
                        onClick={(e) => {
                          // Prevent closing the dropdown when clicking inside the cell.
                          e.stopPropagation();
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {canViewSatpam && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="px-2 py-1 text-xs"
                              onClick={() => setViewSatpam(s)}
                            >
                              View
                            </Button>
                          )}
                          {canManageSatpam && (
                            <div className="relative">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="px-2 py-1 text-xs"
                                onClick={() =>
                                  setActionMenuFor((prev) =>
                                    prev === s.id ? null : s.id
                                  )
                                }
                              >
                                More
                              </Button>
                              {actionMenuFor === s.id && (
                                <div
                                  className={`absolute right-0 z-10 w-44 rounded-md border bg-white py-1 text-xs shadow-lg ${
                                    rowIndex >= paged.length - 2
                                      ? "bottom-full mb-1"
                                      : "mt-1"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50"
                                    onClick={() => {
                                      setActionMenuFor(null);
                                      startEdit(s);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50"
                                    onClick={() => {
                                      setActionMenuFor(null);
                                      handleResetPassword(s);
                                    }}
                                  >
                                    Reset password
                                  </button>
                                  <button
                                    type="button"
                                    className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50"
                                    onClick={() => {
                                      setActionMenuFor(null);
                                      toggleActive(s);
                                    }}
                                  >
                                    {s.is_active ? "Disable" : "Enable"}
                                  </button>
                                  <button
                                    type="button"
                                    className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50"
                                    onClick={() => {
                                      setActionMenuFor(null);
                                      openEnroll(s);
                                    }}
                                  >
                                    Enroll face
                                  </button>
                                  <button
                                    type="button"
                                    className="flex w-full items-center px-3 py-1.5 text-left text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      setActionMenuFor(null);
                                      handleDelete(s);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
               ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={showActionsColumn ? 8 : 7}
                      className="px-3 py-3 text-center text-sm text-slate-500"
                    >
                      No satpam found.
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
          total={filtered.length}
          onPageChange={setPage}
        />
      </section>

      {viewSatpam && (
        <Modal
          open={!!viewSatpam}
          onClose={() => setViewSatpam(null)}
          title={`Satpam Detail — ${viewSatpam.name}`}
          size="lg"
        >
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-slate-700">Account</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">Name</p>
              <p className="font-medium">{viewSatpam.name}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">Email</p>
              <p className="font-medium break-all">{viewSatpam.email}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">Active</p>
              <Badge variant={viewSatpam.is_active ? "success" : "muted"}>
                {viewSatpam.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="md:col-span-2 mt-2">
              <p className="text-xs font-semibold text-slate-700">
                Personal Information
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">Position</p>
              <p className="font-medium">{viewSatpam.jabatan}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">Gender</p>
              <p className="font-medium">
                {viewSatpam.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">
                Birth date
              </p>
              <p className="font-medium">
                {viewSatpam.tanggal_lahir
                  ? formatDate(viewSatpam.tanggal_lahir)
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">
                Birth place
              </p>
              <p className="font-medium">
                {viewSatpam.tempat_lahir || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">
                National ID (No KTP)
              </p>
              <p className="font-medium">
                {viewSatpam.no_ktp || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">
                Phone number
              </p>
              <p className="font-medium">
                {viewSatpam.no_telepon}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">
                Work start date
              </p>
              <p className="font-medium">
                {formatDate(viewSatpam.work_start_date)}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-[11px] uppercase text-slate-500">
                Address
              </p>
              <p className="font-medium whitespace-pre-wrap">
                {viewSatpam.alamat}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">Religion</p>
              <p className="font-medium">
                {viewSatpam.agama || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">
                Marital status
              </p>
              <p className="font-medium">
                {viewSatpam.status_pernikahan || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">
                Nationality
              </p>
              <p className="font-medium">
                {viewSatpam.kebangsaan || "-"}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={!!editing || createOpen}
        onClose={() => {
          setEditing(null);
          setCreateOpen(false);
        }}
        title={editing ? "Edit Satpam" : "Create Satpam"}
      >
        <form
          onSubmit={editing ? handleEditSubmit : handleCreate}
          className="grid gap-3 md:grid-cols-2"
        >
          <div className="md:col-span-2 mb-1">
            <p className="text-xs font-semibold text-slate-700">Account</p>
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={editing ? editForm.name : createForm.name}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({ ...f, name: e.target.value }))
                  : setCreateForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={editing ? editForm.email : createForm.email}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({ ...f, email: e.target.value }))
                  : setCreateForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
          {!editing && (
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
          )}
          <div className="md:col-span-1 flex items-center gap-2">
            <label className="block text-xs font-medium text-slate-700">
              Active
            </label>
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={editing ? editForm.is_active : createForm.is_active}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({ ...f, is_active: e.target.checked }))
                  : setCreateForm((f) => ({
                      ...f,
                      is_active: e.target.checked,
                    }))
              }
            />
          </div>

          <div className="md:col-span-2 mt-2 mb-1">
            <p className="text-xs font-semibold text-slate-700">
              Personal Information
            </p>
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Position (Jabatan) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={editing ? editForm.jabatan : createForm.jabatan}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({ ...f, jabatan: e.target.value }))
                  : setCreateForm((f) => ({ ...f, jabatan: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={editing ? editForm.jenis_kelamin : createForm.jenis_kelamin}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({
                      ...f,
                      jenis_kelamin: e.target.value as "L" | "P",
                    }))
                  : setCreateForm((f) => ({
                      ...f,
                      jenis_kelamin: e.target.value as "L" | "P",
                    }))
              }
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Birth date
            </label>
            <input
              type="date"
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={editing ? editForm.tanggal_lahir : createForm.tanggal_lahir}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({
                      ...f,
                      tanggal_lahir: e.target.value,
                    }))
                  : setCreateForm((f) => ({
                      ...f,
                      tanggal_lahir: e.target.value,
                    }))
              }
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Birth place
            </label>
            <input
              type="text"
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={editing ? editForm.tempat_lahir : createForm.tempat_lahir}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({
                      ...f,
                      tempat_lahir: e.target.value,
                    }))
                  : setCreateForm((f) => ({
                      ...f,
                      tempat_lahir: e.target.value,
                    }))
              }
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              National ID (No KTP)
            </label>
            <input
              type="text"
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={editing ? editForm.no_ktp : createForm.no_ktp}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({ ...f, no_ktp: e.target.value }))
                  : setCreateForm((f) => ({ ...f, no_ktp: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Phone number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={editing ? editForm.no_telepon : createForm.no_telepon}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({ ...f, no_telepon: e.target.value }))
                  : setCreateForm((f) => ({
                      ...f,
                      no_telepon: e.target.value,
                    }))
              }
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Work start date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={
                editing ? editForm.work_start_date : createForm.work_start_date
              }
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({
                      ...f,
                      work_start_date: e.target.value,
                    }))
                  : setCreateForm((f) => ({
                      ...f,
                      work_start_date: e.target.value,
                    }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={editing ? editForm.alamat : createForm.alamat}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({ ...f, alamat: e.target.value }))
                  : setCreateForm((f) => ({ ...f, alamat: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Religion
            </label>
            <input
              type="text"
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={editing ? editForm.agama : createForm.agama}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({ ...f, agama: e.target.value }))
                  : setCreateForm((f) => ({ ...f, agama: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Marital status
            </label>
            <input
              type="text"
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={
                editing
                  ? editForm.status_pernikahan
                  : createForm.status_pernikahan
              }
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({
                      ...f,
                      status_pernikahan: e.target.value,
                    }))
                  : setCreateForm((f) => ({
                      ...f,
                      status_pernikahan: e.target.value,
                    }))
              }
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Nationality
            </label>
            <input
              type="text"
              className="w-full rounded-md border px-2 py-1.5 text-sm"
              value={editing ? editForm.kebangsaan : createForm.kebangsaan}
              onChange={(e) =>
                editing
                  ? setEditForm((f) => ({
                      ...f,
                      kebangsaan: e.target.value,
                    }))
                  : setCreateForm((f) => ({
                      ...f,
                      kebangsaan: e.target.value,
                    }))
              }
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditing(null);
                setCreateOpen(false);
              }}
            >
              Cancel
            </Button>
          <Button
            type="submit"
            size="sm"
            loading={editing ? savingEdit : creating}
          >
              {editing ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {enrollUser && (
        <Modal
          open={!!enrollUser}
          onClose={closeEnroll}
          title={`Enroll Face — ${enrollUser.name}`}
          size="md"
        >
            <form onSubmit={handleEnrollSubmit} className="space-y-3">
              <p className="text-xs text-slate-600">
                Upload 1–3 clear photos of the guard&apos;s face. Front-facing,
                good lighting, no mask.
              </p>
              {enrollStatus && (
                <p className="text-[11px] text-slate-500">
                  Current:{" "}
                  {enrollStatus.enrolled
                    ? `Enrolled (${enrollStatus.count} embedding${
                        enrollStatus.count === 1 ? "" : "s"
                      })`
                    : "Not enrolled"}
                </p>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleEnrollFilesChange}
                className="w-full text-xs"
              />
              {enrollFiles.length > 0 && (
                <p className="text-[11px] text-slate-500">
                  Selected {enrollFiles.length} file
                  {enrollFiles.length > 1 ? "s" : ""}.
                </p>
              )}
              {enrollError && (
                <p className="text-xs text-red-600">{enrollError}</p>
              )}
              {enrollSuccess && (
                <p className="text-xs text-emerald-600">{enrollSuccess}</p>
              )}
              <div className="mt-2 flex justify-end gap-2">
                {enrollStatus?.enrolled && (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={handleEnrollDelete}
                  >
                    Delete Enroll
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={closeEnroll}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={enrolling}
                >
                  {enrolling ? "Enrolling..." : "Enroll Face"}
                </Button>
              </div>
            </form>
        </Modal>
      )}

      <ConfirmModal
        open={confirmState.type === "toggle"}
        title="Change status"
        message={
          confirmState.target
            ? `Set ${confirmState.target.name} as ${
                confirmState.target.is_active ? "inactive" : "active"
              }?`
            : ""
        }
        onCancel={() => setConfirmState({ type: null })}
        onConfirm={confirmToggleActive}
      />
      <ConfirmModal
        open={confirmState.type === "delete"}
        title="Delete Satpam"
        message={
          confirmState.target
            ? `Delete satpam ${confirmState.target.name} (${confirmState.target.email})? This cannot be undone.`
            : ""
        }
        onCancel={() => setConfirmState({ type: null })}
        onConfirm={confirmDelete}
      />
      {confirmState.type === "resetPassword" && confirmState.target && (
        <Modal
          open={true}
          onClose={() => {
            setConfirmState({ type: null });
            setResetPassword("");
          }}
          title="Reset Password"
          size="sm"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void confirmResetPassword();
            }}
            className="space-y-3"
          >
            <p className="text-xs text-slate-700">
              Reset password untuk{" "}
              <span className="font-semibold">
                {confirmState.target.name} ({confirmState.target.email})
              </span>
              .
            </p>
            <label className="block text-xs font-medium text-slate-700">
              New password <span className="text-red-500">*</span>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setConfirmState({ type: null });
                  setResetPassword("");
                }}
                disabled={resetLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={resetLoading}
              >
                Reset Password
              </Button>
            </div>
          </form>
        </Modal>
      )}
      <ConfirmModal
        open={confirmState.type === "deleteEnroll"}
        title="Delete Face Enrollment"
        message={
          confirmState.target
            ? `Delete enrolled face data for ${confirmState.target.name}?`
            : ""
        }
        onCancel={() => setConfirmState({ type: null })}
        onConfirm={confirmDeleteEnroll}
      />

      {/* Import modal */}
      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportFile(null);
          setImportError(null);
        }}
        title="Import Satpam from Excel"
      >
        <form onSubmit={handleImportSubmit} className="space-y-3">
          <p className="text-xs text-slate-600">
            Upload Excel (.xlsx) file using the Satpam import template.
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
