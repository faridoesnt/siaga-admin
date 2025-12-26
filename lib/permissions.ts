"use client";

import { getPermissions } from "./auth";

export type PermissionCode =
  | "DASHBOARD_VIEW"
  | "SATPAM_VIEW"
  | "SATPAM_MANAGE"
  | "ATTENDANCE_SPOT_VIEW"
  | "ATTENDANCE_SPOT_MANAGE"
  | "SHIFT_VIEW"
  | "SHIFT_MANAGE"
  | "SCHEDULING_VIEW"
  | "SCHEDULING_MANAGE"
  | "SPOT_ASSIGNMENT_VIEW"
  | "SPOT_ASSIGNMENT_MANAGE"
  | "SHIFT_SWAP_VIEW"
  | "ATTENDANCE_MONITORING_VIEW"
  | "ATTENDANCE_MONITORING_MANAGE"
  | "ADMIN_VIEW"
  | "ADMIN_MANAGE";

function normalize(perms: string[]): PermissionCode[] {
  return perms.filter(Boolean) as PermissionCode[];
}

export function canView(prefix: string): boolean {
  const perms = normalize(getPermissions());
  const viewCode = `${prefix}_VIEW` as PermissionCode;
  const manageCode = `${prefix}_MANAGE` as PermissionCode;
  return perms.includes(viewCode) || perms.includes(manageCode);
}

export function canManage(prefix: string): boolean {
  const perms = normalize(getPermissions());
  const manageCode = `${prefix}_MANAGE` as PermissionCode;
  return perms.includes(manageCode);
}

// Backward compatible helper (avoid new direct uses).
export function hasPermission(code: PermissionCode): boolean {
  const perms = normalize(getPermissions());
  if (perms.includes(code)) return true;
  if (code.endsWith("_VIEW")) {
    const manage = (code.replace("_VIEW", "_MANAGE") as PermissionCode) || "";
    return perms.includes(manage);
  }
  return false;
}

export function hasAnyPermission(codes: PermissionCode[]): boolean {
  return codes.some((c) => hasPermission(c));
}

export function hasAllPermissions(codes: PermissionCode[]): boolean {
  return codes.every((c) => hasPermission(c));
}
