"use client";

import { toast } from "react-toastify";

export function showSuccess(message: string) {
  toast.success(message, {
    autoClose: 2500,
  });
}

export function showError(message: string) {
  toast.error(message, {
    autoClose: 3500,
  });
}

export function showInfo(message: string) {
  toast.info(message, {
    autoClose: 3000,
  });
}

