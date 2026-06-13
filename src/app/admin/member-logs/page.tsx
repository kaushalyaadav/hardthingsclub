import MemberLogsToolbar from "@/components/admin/MemberLogsToolbar";
import { listCohortMembers } from "@/lib/adminCohort";
import { createClient } from "@/lib/supabaseServer";
import { computeGoalProgress } from "@/lib/goalProgress";
import { GOAL_META } from "@/lib/types";
import type { MemberGoal } from "@/lib/types";
import {
  formatDate,
  getDaysElapsedInMonth,
  getDaysInMonth,
  getFirstOfNextMonthIso,
  getISTDateString,
  getInitials,
  getMonthDayStringsDesc,
  getStreakInProgrammeMonth,
  isMovementDay,
  resolveProgrammeMonthKey
} from "@/lib/utils";

export default async function MemberLogsPage({ searchParams }: { searchParams: { id?: string; month?: string } }) {
  const supabase = createClient();
  const members = await listCohortMembers(supabase);

  if (members.length === 0) {
    return (
      <div className="card overflow-hidden p-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Member logs</h1>
        <p className="mt-2 max-w-md text-sm text-neutral-600">
          There are no cohort members yet, or nobody is on the Access control list. Add members under{" "}
          <a className="font-medium text-neutral-900 underline" href="/admin/allowed-emails">
            Access control
          </a>{" "}
          first.
        </p>
      </div>
    );
  }

  const cohortIds = new Set(members.map((m) => m.id));
  const requested = searchParams.id?.trim();
  const selectedId = requested && cohortIds.has(requested) ? requested : members[0].id;
  const selected = members.find((m) => m.id === selectedId) ?? members[0];

  const today = getISTDateString();
  const { year, month, label, key: monthKey } = resolveProgrammeMonthKey(searchParams.month, today);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndExclusive = getFirstOfNextMonthIso(year, month);

  const [{ data: logsData }, { data: goalsData }, { data: goalEntriesData }] = await Promise.all([
    supabase
      .from("log_entries")
      .select("id,user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,notes")
      .eq("user_id", selectedId)
      .gte("entry_date", monthStart)
      .lt("entry_date", monthEndExclusive)
      .order("entry_date", { ascending: false }),
    supabase.from("member_goals").select("*").eq("member_id", selectedId).eq("month", monthStart),
    supabase
      .from("log_entries")
      .select("entry_date,session_types,breathwork_minutes,km,nutrition,sleep_goal")
      .eq("user_id", selectedId)
      .gte("entry_date", monthStart)
      .lt("entry_date", monthEndExclusive),
  ]);

  const rows = logsData ?? [];
  const memberGoals = (goalsData ?? []) as MemberGoal[];
  const goalProgress = computeGoalProgress(memberGoals, goalEntriesData ?? [], today);
  const daysElapsedInMonth = getDaysElapsedInMonth(year, month, today);
  const totalLogged = rows.length;
  const consistency = daysElapsedInMonth > 0 ? Math.round((totalLogged / daysElapsedInMonth) * 100) : 0;
  const movementDays = rows.filter((r) => isMovementDay(r.session_types)).length;
  const stillDays = rows.filter((r) => r.breathwork_minutes > 0).length;
  const avgSession =
    movementDays > 0
      ? Math.round(
          rows.filter((r) => isMovementDay(r.session_types)).reduce((sum, r) => sum + r.session_duration_minutes, 0) /
            movementDays
        )
      : 0;
  const avgBreath =
    stillDays > 0
      ? Math.round(rows.filter((r) => r.breathwork_minutes > 0).reduce((sum, r) => sum + r.breathwork_minutes, 0) / stillDays)
      : 0;

  const dateSet = new Set(rows.map((r) => r.entry_date));
  const streak = getStreakInProgrammeMonth(dateSet, year, month, today);

  const daysInMonth = getDaysInMonth(year, month);
  const mMovement = rows.filter((r) => isMovementDay(r.session_types));
  const mStill = rows.filter((r) => r.breathwork_minutes > 0);
  const monthSummary = {
    totalDays: daysInMonth,
    loggedDays: rows.length,
    movementDays: mMovement.length,
    avgSession: mMovement.length ? Math.round(mMovement.reduce((s, r) => s + r.session_duration_minutes, 0) / mMovement.length) : 0,
    stillDays: mStill.length,
    avgBreath: mStill.length ? Math.round(mStill.reduce((s, r) => s + r.breathwork_minutes, 0) / mStill.length) : 0,
    isFuture: daysElapsedInMonth === 0
  };

  const logsByDate = new Map(rows.map((r) => [r.entry_date, r]));
  const feedDays = getMonthDayStringsDesc(year, month, daysElapsedInMonth);

  const csv = [
    "Entry_Date,Session_Types,Session_Duration_Minutes,Breathwork_Minutes,Notes",
    ...rows.map(
      (r) =>
        `${r.entry_date},"${(r.session_types || []).join("|")}",${r.session_duration_minutes},${r.breathwork_minutes},"${(r.notes || "").replace(/"/g, '""')}"`
    )
  ].join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-neutral-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Member logs</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {label} {year} only · days 1–{daysElapsedInMonth || "—"} of {daysInMonth} elapsed (IST) · pick another month or member anytime
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MemberLogsToolbar members={members} selectedId={selectedId} monthKey={monthKey} />
          <a
            href={csvHref}
            download={`member-logs-${selectedId}-${monthKey}.csv`}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm text-neutral-700"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 flex items-center gap-3 border-b border-neutral-100 pb-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-black text-sm font-bold text-white">
            {getInitials(selected.full_name)}
          </div>
          <div>
            <p className="text-lg font-semibold text-neutral-900">{selected.full_name}</p>
            <p className="text-sm text-neutral-500">
              Streak {streak} days · Consistency {consistency}% · {totalLogged}/{daysElapsedInMonth || 0} days logged in {label}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-6 overflow-hidden rounded-xl border border-neutral-200">
          {[
            { label: "Consistency", value: `${consistency}%` },
            { label: "Movement days", value: String(movementDays) },
            { label: "Still days", value: String(stillDays) },
            { label: "Streak", value: `${streak}d` },
            { label: "Avg session", value: `${avgSession}m` },
            { label: "Avg breathwork", value: `${avgBreath}m` }
          ].map((item) => (
            <div key={item.label} className="border-r border-neutral-200 px-2 py-4 text-center last:border-r-0">
              <p className="text-3xl font-bold leading-none text-neutral-900">{item.value}</p>
              <p className="mt-1 text-xs text-neutral-500">{item.label}</p>
            </div>
          ))}
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
          {label} {year} breakdown
        </p>
        <div className="mb-6 overflow-x-auto">
          <table className="min-w-[360px] w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-left text-neutral-500">
                <th className="px-3 py-2 font-medium">Metric</th>
                <th className="px-3 py-2 text-center font-medium text-neutral-900">
                  {label} {year}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-neutral-50 text-xs uppercase tracking-[0.06em] text-neutral-500">
                <td className="px-3 py-2">Logging</td>
                <td />
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Total days</td>
                <td className="px-3 py-2 text-center">
                  <span className="rounded bg-black px-2 py-1 text-white">{monthSummary.totalDays}</span>
                </td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Logged days</td>
                <td className="px-3 py-2 text-center">
                  {monthSummary.isFuture ? <span className="text-neutral-300">—</span> : monthSummary.loggedDays}
                </td>
              </tr>
              <tr className="bg-neutral-50 text-xs uppercase tracking-[0.06em] text-neutral-500">
                <td className="px-3 py-2">Physical</td>
                <td />
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Movement days</td>
                <td className="px-3 py-2 text-center">
                  {monthSummary.isFuture ? <span className="text-neutral-300">—</span> : monthSummary.movementDays}
                </td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Avg session (min)</td>
                <td className="px-3 py-2 text-center">
                  {monthSummary.isFuture ? <span className="text-neutral-300">—</span> : monthSummary.avgSession}
                </td>
              </tr>
              <tr className="bg-neutral-50 text-xs uppercase tracking-[0.06em] text-neutral-500">
                <td className="px-3 py-2">Mental</td>
                <td />
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Still days</td>
                <td className="px-3 py-2 text-center">
                  {monthSummary.isFuture ? <span className="text-neutral-300">—</span> : monthSummary.stillDays}
                </td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Avg breathwork (min)</td>
                <td className="px-3 py-2 text-center">
                  {monthSummary.isFuture ? <span className="text-neutral-300">—</span> : monthSummary.avgBreath}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Goal progress — same cards as member home page */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Goals · {label} {year}</p>
          {goalProgress.length === 0 ? (
            <p className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-4 text-sm text-neutral-400">
              No goals set for {label} {year}.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {goalProgress.map((gp) => {
                const pct = gp.pct;
                const isHit = pct >= 100;
                const badgeClass = isHit || gp.pace === "on_track"
                  ? "bg-green-50 text-green-600"
                  : gp.pace === "at_risk"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-red-50 text-red-600";
                const barClass = isHit || gp.pace === "on_track"
                  ? "bg-green-500"
                  : gp.pace === "at_risk"
                  ? "bg-amber-400"
                  : "bg-red-400";
                const pctClass = isHit || gp.pace === "on_track"
                  ? "text-green-600"
                  : gp.pace === "at_risk"
                  ? "text-amber-600"
                  : "text-red-600";
                const paceLabel = isHit ? "Goal Hit! 🎉"
                  : gp.pace === "on_track" ? "On Track"
                  : gp.pace === "at_risk" ? "Keep Going"
                  : "Push Harder";
                const description = gp.goal.definition || null;

                return (
                  <div key={gp.goal.id} className="rounded-xl border border-neutral-200 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-900">{GOAL_META[gp.goal.category].label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>{paceLabel}</span>
                    </div>
                    {description && <p className="text-[11px] text-neutral-500 leading-snug">{description}</p>}
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500">
                        {gp.current} {gp.goal.unit} · target {gp.goal.target} {gp.goal.unit}
                      </span>
                      <span className={`text-xs font-bold ${pctClass}`}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Daily log · {label} {year}</p>
        <div className="space-y-2">
          {feedDays.length === 0 ? (
            <p className="text-sm text-neutral-500">No days to show for this month yet (future month).</p>
          ) : (
            feedDays.map((day) => {
              const entry = logsByDate.get(day);
              if (!entry) {
                return (
                  <div key={day} className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">
                    {formatDate(day)} — No activity logged
                  </div>
                );
              }
              if (entry.session_types?.includes("Rest") && !entry.notes) {
                return (
                  <div key={day} className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">
                    {formatDate(day)} — Rest day logged
                  </div>
                );
              }
              return (
                <div key={entry.id} className="overflow-hidden rounded-xl border border-neutral-200">
                  <div className="flex flex-wrap items-center gap-2 bg-white px-4 py-3">
                    <span className="font-semibold text-neutral-900">{formatDate(entry.entry_date)}</span>
                    {entry.session_types?.map((t: string) => (
                      <span key={`${entry.id}-${t}`} className="rounded-full bg-black px-2 py-1 text-xs text-white">
                        {t}
                      </span>
                    ))}
                    {entry.breathwork_minutes > 0 && (
                      <span className="rounded-full bg-[#EEEDFE] px-2 py-1 text-xs text-[#534AB7]">{entry.breathwork_minutes}m breathwork</span>
                    )}
                    {entry.session_duration_minutes > 0 && (
                      <span className="ml-auto text-sm text-neutral-500">{entry.session_duration_minutes} min</span>
                    )}
                  </div>
                  {entry.notes && (
                    <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3 text-base leading-relaxed text-neutral-700">{entry.notes}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
