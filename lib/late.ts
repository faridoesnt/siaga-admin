import { AdminAttendanceItem } from "./types";

function parseShiftStart(date: string, shiftStart: string): Date | null {
  if (!date || !shiftStart) return null;

  const [yearStr, monthStr, dayStr] = date.split("-");
  const [hourStr, minuteStr] = shiftStart.split(":");

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (
    [year, month, day, hour, minute].some(
      (v) => Number.isNaN(v) || !Number.isFinite(v)
    )
  ) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function calculateLateMinutesForItem(
  item: AdminAttendanceItem,
  date: string
): number | null {
  if (!item.clock_in_time) return null;
  if (!item.shift?.start_time) return null;

  const shiftStart = parseShiftStart(date, item.shift.start_time);
  if (!shiftStart) return null;

  const clockIn = new Date(item.clock_in_time);
  if (Number.isNaN(clockIn.getTime())) return null;

  const diffMs = clockIn.getTime() - shiftStart.getTime();
  if (diffMs <= 0) return 0;

  return Math.round(diffMs / 60000);
}

export function formatLateDuration(minutes: number | null): string | null {
  if (minutes == null || minutes <= 0) {
    return null;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts: string[] = [];

  if (hours > 0) {
    const label = hours === 1 ? "hour" : "hours";
    parts.push(`${hours} ${label}`);
  }
  if (mins > 0) {
    const label = mins === 1 ? "minute" : "minutes";
    parts.push(`${mins} ${label}`);
  }

  return parts.join(" ");
}
