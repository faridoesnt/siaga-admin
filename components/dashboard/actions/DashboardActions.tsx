"use client";

import { useEffect, useState, FormEvent } from "react";
import { ExportButton } from "./ExportButton";
import { downloadApiFilePost } from "@/lib/download";
import { Modal, Button } from "@/components/ui";
import { showError, showSuccess } from "@/lib/toast";

type DashboardActionsProps = {
  month: string;
};

export function DashboardActions({ month }: DashboardActionsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<"pdf" | "xlsx">("pdf");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeDefaultRange = (monthStr: string): { from: string; to: string } => {
    // Helper to format a Date as YYYY-MM-DD without timezone shifts.
    const formatYMD = (d: Date) =>
      d.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const from = formatYMD(start);
      const to = formatYMD(now);
      return { from, to };
    }
    const [yearStr, monStr] = monthStr.split("-");
    const year = Number(yearStr);
    const mon = Number(monStr);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0);
    return {
      from: formatYMD(start),
      to: formatYMD(end),
    };
  };

  useEffect(() => {
    const { from, to } = computeDefaultRange(month);
    setDateFrom(from);
    setDateTo(to);
  }, [month]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("siaga_dashboard_export_format");
      if (saved === "pdf" || saved === "xlsx") {
        setFormat(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleOpenModal = () => {
    setError(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dateFrom || !dateTo) {
      setError("Please select a date range.");
      return;
    }
    if (dateTo < dateFrom) {
      setError("End date must be on or after start date.");
      return;
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    const diffDays = Math.floor(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    if (diffDays > 92) {
      setError("Maximum export range is 92 days.");
      return;
    }

    // Normalize dates to YYYY-MM-DD in local time to avoid any timezone
    // shifts when sending to backend.
    const formatLocalYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const normalizedFrom = formatLocalYMD(fromDate);
    const normalizedTo = formatLocalYMD(toDate);

    setSubmitting(true);
    try {
      const payload = {
        date_from: normalizedFrom,
        date_to: normalizedTo,
        format,
      };
      const fallbackName = `attendance-report-${normalizedFrom.replace(/-/g, "")}-${normalizedTo.replace(/-/g, "")}.${format}`;
      await downloadApiFilePost(
        "/v1/admin/reports/attendance/export",
        payload,
        fallbackName
      );
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "siaga_dashboard_export_format",
            format
          );
        }
      } catch {
        // ignore storage errors
      }
      showSuccess("Attendance report download started.");
      setModalOpen(false);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to export attendance report.";
      setError(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Actions & Export
          </h2>
          <p className="text-xs text-slate-500">
            Export attendance report for the selected period.
          </p>
        </div>
        <ExportButton onClick={handleOpenModal} loading={submitting} />
      </section>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title="Export Attendance Report"
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Date from
              </label>
              <input
                type="date"
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Date to
              </label>
              <input
                type="date"
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-slate-700">
              Format
            </p>
            <div className="flex gap-3 text-xs">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  className="h-3 w-3"
                  checked={format === "pdf"}
                  onChange={() => setFormat("pdf")}
                />
                <span>PDF (Executive report)</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  className="h-3 w-3"
                  checked={format === "xlsx"}
                  onChange={() => setFormat("xlsx")}
                />
                <span>XLSX (HR data file)</span>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={submitting}
            >
              Export
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
