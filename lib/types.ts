export interface ApiErrorBody {
  code?: string;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  raw?: unknown;

  constructor(message: string, status: number, code?: string, raw?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.raw = raw;
  }
}

export interface Satpam {
  id: number;
  email: string;
  name: string;
  work_start_date?: string | null;
  is_active: boolean;
}

export interface FaceEnrollStatus {
  user_id: number;
  enrolled: boolean;
  count: number;
  model?: string | null;
  updated_at?: string | null;
}

export interface AttendanceSpot {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  late_tolerance_minute: number;
}

export type ShiftSwapStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ShiftSwapRequest {
  id: number;
  requester_user_id: number;
  target_user_id: number;
  requester_name?: string | null;
  target_name?: string | null;
  shift_date: string;
  requester_user_shift_id: number;
  target_user_shift_id: number;
  status: ShiftSwapStatus;
  reason?: string | null;
  note?: string | null;
  decided_by?: number | null;
  decided_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminAttendanceItem {
  attendance_id: number;
  user: {
    id: number;
    name: string;
  };
  shift: {
    name: string;
  };
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  status?: string | null;
  clock_in_photo_url?: string | null;
  clock_out_photo_url?: string | null;
  face_verified: boolean;
  face_match_score?: number | null;
  clock_in?: {
    time?: string | null;
    spot?: {
      id: number;
      name: string;
    } | null;
  };
  clock_out?: {
    time?: string | null;
    spot?: {
      id: number;
      name: string;
    } | null;
  };
  activities?: {
    id: number;
    photo_url: string;
    note?: string | null;
    taken_at: string;
    spot?: {
      id: number;
      name: string;
    } | null;
  }[];
}

export interface AdminUserShiftItem {
  id: number;
  user_id: number;
  user_name: string;
  shift_id: number;
  shift_name: string;
  shift_date: string;
}

export interface AdminUserAttendanceSpotItem {
  id: number;
  user_id: number;
  user_name: string;
  attendance_spot_id: number;
  attendance_spot_name: string;
  active_from: string;
  active_until?: string | null;
}
