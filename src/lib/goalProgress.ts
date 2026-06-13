import { getDaysInMonth, getISTDateString } from "@/lib/utils";
import type { GoalProgress, LogEntry, MemberGoal } from "@/lib/types";

type RawEntry = Pick<LogEntry, "entry_date" | "session_types" | "breathwork_minutes" | "km" | "nutrition" | "sleep_goal">;

function computeCurrent(goal: MemberGoal, entries: RawEntry[]): number {
  const month = goal.month.slice(0, 7); // "YYYY-MM"
  const monthEntries = entries.filter((e) => e.entry_date.startsWith(month));

  switch (goal.category) {
    case "monthly_mileage":
      return monthEntries
        .filter((e) => e.session_types.includes("Run"))
        .reduce((sum, e) => sum + (e.km ?? 0), 0);

    case "running_days":
      return new Set(
        monthEntries.filter((e) => e.session_types.includes("Run")).map((e) => e.entry_date)
      ).size;

    case "workout_days":
      return new Set(
        monthEntries
          .filter((e) => e.session_types.some((t) => ["Push", "Pull", "Legs"].includes(t)))
          .map((e) => e.entry_date)
      ).size;

    case "strength_sessions":
      return monthEntries.filter((e) =>
        e.session_types.some((t) => ["Push", "Pull", "Legs"].includes(t))
      ).length;

    case "mobility_sessions":
      return monthEntries.filter((e) => e.session_types.includes("Mobility")).length;

    case "recovery_days":
      return new Set(
        monthEntries.filter((e) => e.session_types.includes("Mobility")).map((e) => e.entry_date)
      ).size;

    case "nutrition_days":
      return monthEntries.filter((e) => e.nutrition === true).length;

    case "sleep_days":
      return monthEntries.filter((e) => e.sleep_goal === true).length;

    case "mindfulness_days":
      return new Set(
        monthEntries.filter((e) => (e.breathwork_minutes ?? 0) > 0).map((e) => e.entry_date)
      ).size;

    case "logging_days":
      return new Set(monthEntries.map((e) => e.entry_date)).size;

    default:
      return 0;
  }
}

export function computeGoalProgress(
  goals: MemberGoal[],
  entries: RawEntry[],
  today = getISTDateString()
): GoalProgress[] {
  return goals.map((goal) => {
    const [yearStr, monthStr] = goal.month.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const daysInMonth = getDaysInMonth(year, month);

    const [ty, tm, td] = today.split("-").map(Number);
    const isCurrentMonth = year === ty && month === tm;
    const dayOfMonth = isCurrentMonth ? td : daysInMonth;
    const daysRemaining = isCurrentMonth ? Math.max(0, daysInMonth - td) : 0;

    const current = computeCurrent(goal, entries);
    const pct = goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0;

    let pace: GoalProgress["pace"] = "on_track";
    if (pct < 100 && daysRemaining > 0) {
      const remaining = goal.target - current;
      const daysLeft = daysRemaining;
      const requiredPerDay = remaining / daysLeft;
      const actualPerDay = dayOfMonth > 0 ? current / dayOfMonth : 0;

      if (requiredPerDay <= actualPerDay * 1.1) {
        pace = "on_track";
      } else if (requiredPerDay <= actualPerDay * 1.4) {
        pace = "at_risk";
      } else {
        pace = "behind";
      }
    } else if (pct >= 100) {
      pace = "on_track";
    }

    return { goal, current, pct, daysRemaining, pace };
  });
}
