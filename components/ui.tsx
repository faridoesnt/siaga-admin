"use client";

import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary:
      "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 border border-red-600",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "muted" | "danger";
  className?: string;
}) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    muted: "bg-slate-50 text-slate-500",
    danger: "bg-red-50 text-red-700",
  } as const;
  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  if (!open) return null;

  const sizeClass =
    size === "sm"
      ? "max-w-md"
      : size === "lg"
      ? "max-w-3xl"
      : "max-w-xl";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 sm:px-6"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className={`flex w-full flex-col ${sizeClass} rounded-lg bg-white shadow-lg max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {title ?? "Dialog"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-slate-700">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="danger"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
