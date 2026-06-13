import { redirect } from "next/navigation";
import BottomNav from "@/components/member/BottomNav";
import ProgressMonthSelect from "@/components/member/ProgressMonthSelect";
import { createClient } from "@/lib/supabaseServer";
import { PROGRAMME_MONTHS, getDaysElapsedInMonth, getDaysInMonth, getISTDateString, getInitials, isMovementDay } from "@/lib/utils";
import { computeGoalProgress } from "@/lib/goalProgress";
import { GOAL_META } from "@/lib/types";
import type { MemberGoal, GoalProgress } from "@/lib/types";

function paceLabel(gp: GoalProgress): string {
  if (gp.pct >= 100) return "Goal Hit! 🎉";
  if (gp.pace === "on_track") return "On Track";
  if (gp.pace === "at_risk") return "Keep Going";
  return "Push Harder";
}

function paceColors(gp: GoalProgress) {
  if (gp.pct >= 100) return { badge: "bg-green-50 text-green-600", bar: "bg-green-500", pct: "text-green-600" };
  if (gp.pace === "on_track") return { badge: "bg-green-50 text-green-600", bar: "bg-green-500", pct: "text-green-600" };
  if (gp.pace === "at_risk") return { badge: "bg-amber-50 text-amber-600", bar: "bg-amber-400", pct: "text-amber-600" };
  return { badge: "bg-red-50 text-red-600", bar: "bg-red-400", pct: "text-red-600" };
}

function pastBarColor(pct: number) {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function pastPctColor(pct: number) {
  if (pct >= 80) return "text-green-600";
  if (pct >= 50) return "text-amber-600";
  return "text-red-500";
}

export default async function ProgressPage({ searchParams }: { searchParams: { month?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const today = getISTDateString();
  const [todayYear, todayMonth] = today.split("-").map(Number);
  const defaultMonth = `${todayYear}-${String(todayMonth).padStart(2, "0")}`;
  const selectedMonth = searchParams.month ?? defaultMonth;
  const isCurrentMonth = selectedMonth === defaultMonth;
  const monthStart = `${selectedMonth}-01`;
  const [sy, sm] = selectedMonth.split("-").map(Number);
  const nextMonthDate = sm === 12 ? `${sy + 1}-01-01` : `${sy}-${String(sm + 1).padStart(2, "0")}-01`;

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  // Fetch all logs for the metrics table (existing behaviour)
  const { data: logs } = await supabase
    .from("log_entries")
    .select("entry_date,session_types,session_duration_minutes,breathwork_minutes")
    .eq("user_id", user.id);
  const entries = logs ?? [];

  // Fetch goals + full month entries for the goals section
  const [{ data: goalsData }, { data: monthEntriesData }] = await Promise.all([
    supabase.from("member_goals").select("*").eq("member_id", user.id).eq("month", monthStart),
    supabase
      .from("log_entries")
      .select("entry_date,session_types,breathwork_minutes,km,nutrition,sleep_goal")
      .eq("user_id", user.id)
      .gte("entry_date", monthStart)
      .lt("entry_date", nextMonthDate),
  ]);

  const goals = (goalsData ?? []) as MemberGoal[];
  const goalProgress = computeGoalProgress(goals, monthEntriesData ?? [], today);

  const monthIndex = PROGRAMME_MONTHS.findIndex((m) => m.year === todayYear && m.month === todayMonth);
  const programmeMonthNumber = monthIndex >= 0 ? monthIndex + 1 : 1;

  const rowFor = (year: number, month: number) => entries.filter((l) => {
    const d = new Date(`${l.entry_date}T00:00:00+05:30`);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  });

  const cell = (value: string | number, isCurrent: boolean, isFuture: boolean) => {
    if (isFuture) return <span className="text-neutral-300">—</span>;
    if (!isCurrent) return <span className="text-neutral-500">{value}</span>;
    return <span className="rounded-md bg-black px-2 py-0.5 text-white">{value}</span>;
  };

  const selectedMonthMeta = PROGRAMME_MONTHS.find((m) => m.year === sy && m.month === sm);
  const selectedLabel = selectedMonthMeta ? `${selectedMonthMeta.label} ${selectedMonthMeta.year}` : selectedMonth;

  return (
    <main className="mx-auto max-w-[420px] pb-24">
      <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <p className="text-xs font-semibold tracking-[0.04em] text-neutral-900">Hard Things Club</p>
        <div className="grid h-7 w-7 place-items-center rounded-full bg-black text-[10px] font-semibold text-white">
          {getInitials(profile?.full_name || user.email?.split("@")[0] || "HTC")}
        </div>
      </header>

      <section className="px-4 pt-4">
        <h1 className="text-[34px] leading-none font-semibold text-neutral-900">{profile?.full_name || "Member"}</h1>
        <p className="mt-1 text-sm text-neutral-400">Apr – Sep 2026 · Programme month {programmeMonthNumber}</p>

        {/* Metrics table — all months */}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[460px] w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-left text-neutral-500">
                <th className="px-3 py-2 font-medium">Metric</th>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  return (
                    <th key={m.label} className={`px-2 py-2 text-center font-medium ${isCurrent ? "text-neutral-900" : "text-neutral-400"}`}>
                      {m.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-neutral-50">
                <td className="px-3 py-1 text-xs uppercase tracking-[0.07em] text-neutral-400">Logging</td>
                {PROGRAMME_MONTHS.map((m) => <td key={`h-l-${m.label}`} />)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Total days</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  return <td key={`td-${m.label}`} className="px-2 py-2 text-center">{cell(getDaysInMonth(m.year, m.month), isCurrent, isFuture)}</td>;
                })}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Logged days</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  return <td key={`ld-${m.label}`} className="px-2 py-2 text-center">{cell(rowFor(m.year, m.month).length, isCurrent, isFuture)}</td>;
                })}
              </tr>

              <tr className="bg-neutral-50">
                <td className="px-3 py-1 text-xs uppercase tracking-[0.07em] text-neutral-400">Physical</td>
                {PROGRAMME_MONTHS.map((m) => <td key={`h-p-${m.label}`} />)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Active days</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  const value = rowFor(m.year, m.month).filter((r) => isMovementDay(r.session_types)).length;
                  return <td key={`ad-${m.label}`} className="px-2 py-2 text-center">{cell(value, isCurrent, isFuture)}</td>;
                })}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Avg duration</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  const monthRows = rowFor(m.year, m.month).filter((r) => isMovementDay(r.session_types));
                  const avg = monthRows.length ? Math.round(monthRows.reduce((s, r) => s + r.session_duration_minutes, 0) / monthRows.length) : 0;
                  return <td key={`avgd-${m.label}`} className="px-2 py-2 text-center">{cell(`${avg}m`, isCurrent, isFuture)}</td>;
                })}
              </tr>

              <tr className="bg-neutral-50">
                <td className="px-3 py-1 text-xs uppercase tracking-[0.07em] text-neutral-400">Mental</td>
                {PROGRAMME_MONTHS.map((m) => <td key={`h-m-${m.label}`} />)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Active days</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  const value = rowFor(m.year, m.month).filter((r) => r.breathwork_minutes > 0).length;
                  return <td key={`std-${m.label}`} className="px-2 py-2 text-center">{cell(value, isCurrent, isFuture)}</td>;
                })}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Avg breathwork</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  const monthRows = rowFor(m.year, m.month).filter((r) => r.breathwork_minutes > 0);
                  const avg = monthRows.length ? Math.round(monthRows.reduce((s, r) => s + r.breathwork_minutes, 0) / monthRows.length) : 0;
                  return <td key={`avgb-${m.label}`} className="px-2 py-2 text-center">{cell(`${avg}m`, isCurrent, isFuture)}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Goals section */}
        <div className="mt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Goals</p>
            <ProgressMonthSelect value={selectedMonth} currentMonth={defaultMonth} />
          </div>

          {goalProgress.length === 0 ? (
            <p className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-400">
              No goals set for {selectedLabel}.
            </p>
          ) : (
            <div className="space-y-2">
              {goalProgress.map((gp) => {
                const meta = GOAL_META[gp.goal.category];
                const description = gp.goal.definition || gp.goal.coach_note || null;

                if (isCurrentMonth) {
                  const colors = paceColors(gp);
                  return (
                    <div key={gp.goal.id} className="rounded-xl border border-neutral-200 bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-neutral-900">{meta.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${colors.badge}`}>
                          {paceLabel(gp)}
                        </span>
                      </div>
                      {description && <p className="text-[11px] text-neutral-500 leading-snug">{description}</p>}
                      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                        <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${gp.pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-neutral-500">
                          {gp.current} {gp.goal.unit} · target {gp.goal.target} {gp.goal.unit}
                        </span>
                        <span className={`text-xs font-bold ${colors.pct}`}>{gp.pct}%</span>
                      </div>
                    </div>
                  );
                }

                // Past month — no status badge, just result
                return (
                  <div key={gp.goal.id} className="rounded-xl border border-neutral-200 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-900">{meta.label}</span>
                      <span className={`text-xs font-bold ${pastPctColor(gp.pct)}`}>{gp.pct}%</span>
                    </div>
                    {description && <p className="text-[11px] text-neutral-500 leading-snug">{description}</p>}
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div className={`h-full rounded-full ${pastBarColor(gp.pct)}`} style={{ width: `${gp.pct}%` }} />
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {gp.current} / {gp.goal.target} {gp.goal.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <BottomNav />
    </main>
  );
}
