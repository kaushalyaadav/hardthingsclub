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
] as const;

export type ProgrammeMonth = (typeof PROGRAMME_MONTHS)[number];

/** Resolve `YYYY-MM` from the URL to a valid programme month (defaults to current IST month in programme, else Apr). */
export function resolveProgrammeMonthKey(monthParam: string | undefined, today = getISTDateString()) {
  const fromToday = PROGRAMME_MONTHS.find((m) => {
    const [y, mo] = today.split("-").map(Number);
    return m.year === y && m.month === mo;
  });
  const fallback = fromToday ?? PROGRAMME_MONTHS[0];
  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return {
      year: fallback.year,
      month: fallback.month,
      label: fallback.label,
      key: `${fallback.year}-${String(fallback.month).padStart(2, "0")}`
    };
  }
  const [ys, ms] = monthParam.split("-");
  const y = Number(ys);
  const mo = Number(ms);
  const meta = PROGRAMME_MONTHS.find((m) => m.year === y && m.month === mo);
  if (!meta) {
    const f = PROGRAMME_MONTHS[0];
    return { year: f.year, month: f.month, label: f.label, key: `${f.year}-${String(f.month).padStart(2, "0")}` };
  }
  return { year: meta.year, month: meta.month, label: meta.label, key: `${meta.year}-${String(meta.month).padStart(2, "0")}` };
}

/** IST `YYYY-MM-DD` strings for days 1…endDay in that month, newest first (for activity lists). */
export function getMonthDayStringsDesc(year: number, month: number, endDay: number) {
  if (endDay < 1) return [];
  const out: string[] = [];
  for (let d = endDay; d >= 1; d--) {
    out.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return out;
}

/**
 * Add days to a calendar date `YYYY-MM-DD` using UTC Gregorian math (same civil day sequence as IST for this app; India has no DST).
 */
export function addCalendarDaysIso(dateStr: string, deltaDays: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return dateStr;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const x = new Date(Date.UTC(y, mo - 1, d + deltaDays));
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}-${String(x.getUTCDate()).padStart(2, "0")}`;
}

export type LoggingStreakMode = "relaxed" | "strict";

/**
 * Consecutive calendar days with a log entry, counting backward from `today` within [PROGRAMME_START, today].
 * - **relaxed**: if today has no log yet, start from yesterday (same calendar day streak before you log today).
 * - **strict**: today must be logged for a non-zero streak.
 */
export function getLoggingStreak(dateSet: Set<string>, today: string, mode: LoggingStreakMode = "relaxed"): number {
  if (today < PROGRAMME_START) return 0;

  if (mode === "strict" && !dateSet.has(today)) {
    return 0;
  }

  let cur = today;
  if (mode === "relaxed" && !dateSet.has(today)) {
    cur = addCalendarDaysIso(today, -1);
  }
  if (cur < PROGRAMME_START) return 0;

  let streak = 0;
  while (cur >= PROGRAMME_START && dateSet.has(cur)) {
    streak += 1;
    cur = addCalendarDaysIso(cur, -1);
  }
  return streak;
}

/**
 * Streak within one programme month only: consecutive logged days ending at the last day of the window
 * (today if current month, else last day of month). Uses calendar-safe stepping (no `Date.setDate` in local TZ).
 */
export function getStreakInProgrammeMonth(
  dateSet: Set<string>,
  year: number,
  month: number,
  today = getISTDateString(),
  mode: LoggingStreakMode = "relaxed"
): number {
  const elapsed = getDaysElapsedInMonth(year, month, today);
  if (elapsed === 0) return 0;

  const [ty, tm, td] = today.split("-").map(Number);
  if (year > ty || (year === ty && month > tm)) return 0;

  const dim = getDaysInMonth(year, month);
  const monthStartStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const endD = year === ty && month === tm ? Math.min(td, dim) : dim;
  let cur = `${year}-${String(month).padStart(2, "0")}-${String(endD).padStart(2, "0")}`;

  if (mode === "strict" && !dateSet.has(cur)) {
    return 0;
  }
  if (mode === "relaxed" && !dateSet.has(cur)) {
    cur = addCalendarDaysIso(cur, -1);
  }
  if (cur < monthStartStr) return 0;

  let streak = 0;
  while (cur >= monthStartStr && dateSet.has(cur)) {
    streak += 1;
    cur = addCalendarDaysIso(cur, -1);
  }
  return streak;
}

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

/** First day of the following calendar month as `YYYY-MM-DD` (exclusive upper bound for `entry_date < …`). */
export function getFirstOfNextMonthIso(year: number, month: number) {
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return `${next.y}-${String(next.m).padStart(2, "0")}-01`;
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

export function isMovementDay(sessionTypes: SessionType[] | null | undefined) {
  return (sessionTypes ?? []).some((type) => ACTIVE_SESSION_TYPES.includes(type as (typeof ACTIVE_SESSION_TYPES)[number]));
}
