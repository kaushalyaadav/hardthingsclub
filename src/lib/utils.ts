import { ACTIVE_SESSION_TYPES, SessionType } from "@/lib/types";

export const PROGRAMME_START = "2026-04-01";
export const PROGRAMME_END = "2026-09-30";
export const PROGRAMME_TOTAL_DAYS = 183;

export const PROGRAMME_MONTHS = [
  { year: 2026, month: 4, label: "Apr" },
  { year: 2026, month: 5, label: "May" },
  { year: 2026, month: 6, label: "Jun" },
  { year: 2026, month: 7, label: "Jul" },
  { year: 2026, month: 8, label: "Aug" },
  { year: 2026, month: 9, label: "Sep" }
];

export function getISTDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata"
  });
}

export function getProgrammeDaysElapsed(today = getISTDateString()) {
  if (today < PROGRAMME_START) return 0;
  const start = new Date(`${PROGRAMME_START}T00:00:00+05:30`).getTime();
  const current = new Date(`${today}T00:00:00+05:30`).getTime();
  const days = Math.floor((current - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(days, PROGRAMME_TOTAL_DAYS);
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function getDaysElapsedInMonth(year: number, month: number, today = getISTDateString()) {
  const [ty, tm, td] = today.split("-").map(Number);
  if (year > ty || (year === ty && month > tm)) return 0;
  if (year < ty || (year === ty && month < tm)) return getDaysInMonth(year, month);
  return td;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function isMovementDay(sessionTypes: SessionType[]) {
  return sessionTypes.some((type) => ACTIVE_SESSION_TYPES.includes(type as (typeof ACTIVE_SESSION_TYPES)[number]));
}
