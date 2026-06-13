import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/member/BottomNav";
import ProfileMenu from "@/components/member/ProfileMenu";
import PushSetup from "@/components/member/PushSetup";
import { createClient } from "@/lib/supabaseServer";
import { getISTDateString, getInitials, getLoggingStreak, getProgrammeDaysElapsed, PROGRAMME_TOTAL_DAYS } from "@/lib/utils";
import { isMovementDay } from "@/lib/utils";
import { computeGoalProgress } from "@/lib/goalProgress";
import { GOAL_META } from "@/lib/types";
import type { MemberGoal, GoalProgress } from "@/lib/types";

function paceLabel(gp: GoalProgress): string {
  if (gp.pct >= 100) return "Goal Hit! 🎉";
  if (gp.pace === "on_track") return "On Track";
  if (gp.pace === "at_risk") return "Keep Going";
  return "Push Harder";
}

function paceColors(gp: GoalProgress): { badge: string; bar: string; pct: string } {
  if (gp.pct >= 100) return { badge: "bg-green-50 text-green-600", bar: "bg-green-500", pct: "text-green-600" };
  if (gp.pace === "on_track") return { badge: "bg-green-50 text-green-600", bar: "bg-green-500", pct: "text-green-600" };
  if (gp.pace === "at_risk") return { badge: "bg-amber-50 text-amber-600", bar: "bg-amber-400", pct: "text-amber-600" };
  return { badge: "bg-red-50 text-red-600", bar: "bg-red-400", pct: "text-red-600" };
}

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const today = getISTDateString();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [
    { data: profile },
    { data: entries },
    { data: goalsData },
    { data: monthEntries },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("log_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false }),
    supabase.from("member_goals").select("*").eq("member_id", user.id).eq("month", monthStart),
    supabase.from("log_entries")
      .select("entry_date,session_types,breathwork_minutes,km,nutrition,sleep_goal")
      .eq("user_id", user.id)
      .gte("entry_date", monthStart),
  ]);

  const allEntries = entries ?? [];
  const loggedDateSet = new Set(allEntries.map((e) => e.entry_date));
  const loggingStreak = getLoggingStreak(loggedDateSet, today, "relaxed");
  const todayEntry = allEntries.find((e) => e.entry_date === today);
  const totalDays = getProgrammeDaysElapsed(today);

  // Monthly consistency
  const dayOfMonth = Number(today.split("-")[2]);
  const loggedDaysThisMonth = allEntries.filter((e) => e.entry_date.startsWith(today.slice(0, 7))).length;
  const monthlyConsistency = dayOfMonth > 0 ? Math.round((loggedDaysThisMonth / dayOfMonth) * 100) : 0;

  const movementDays = allEntries.filter((e) => isMovementDay(e.session_types)).length;
  const stillDays = allEntries.filter((e) => e.breathwork_minutes > 0).length;
  const initials = getInitials(profile?.full_name || user.email?.split("@")[0] || "HTC");
  const firstName = (profile?.full_name || user.email?.split("@")[0] || "Member").split(" ")[0];

  const goals = (goalsData ?? []) as MemberGoal[];
  const goalProgress = computeGoalProgress(goals, monthEntries ?? [], today);

  const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = istNow.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const longDate = new Date(`${today}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "short", timeZone: "Asia/Kolkata",
  });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekday = new Date(`${today}T00:00:00+05:30`).getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(`${today}T00:00:00+05:30`);
  monday.setDate(monday.getDate() + mondayOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    const entry = allEntries.find((e) => e.entry_date === dateStr);
    const isToday = dateStr === today;
    const movementType = entry?.session_types?.find((t: string) => t !== "Rest");
    const tag = movementType ? movementType.slice(0, 2) : entry ? "R" : "—";
    return { name: dayNames[i], isToday, isFuture: dateStr > today, entry, tag };
  });

  return (
    <main className="mx-auto max-w-[420px] pb-20">
      <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/htc-logo.jpg" alt="" className="h-6 w-6 rounded-md object-cover" />
          <p className="text-xs font-semibold tracking-[0.04em] text-neutral-900">Hard Things Club</p>
        </div>
        <ProfileMenu initials={initials} />
      </header>

      <PushSetup />

      <section className="space-y-3 px-4 pt-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">{greeting}, {firstName}.</h1>
          <p className="text-xs text-neutral-400">{longDate} · Day {totalDays} of {PROGRAMME_TOTAL_DAYS}</p>
        </div>

        {/* Monthly consistency */}
        <section className="rounded-2xl border border-neutral-200 p-4">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">This month</p>
              <p className="text-[40px] font-bold leading-none tracking-tight text-neutral-900">
                {monthlyConsistency}<span className="align-super text-sm font-normal text-neutral-400">%</span>
              </p>
              <p className="text-xs text-neutral-500">
                <span className="font-semibold text-neutral-900">{loggedDaysThisMonth}</span> logged out of <span className="font-semibold text-neutral-900">{dayOfMonth}</span> days
              </p>
            </div>
            <div className="rounded-full bg-neutral-100 px-3 py-1.5 text-center">
              <p className="text-base font-bold leading-none text-neutral-900">{loggingStreak}</p>
              <p className="mt-0.5 text-[9px] leading-tight text-neutral-400">current<br />streak</p>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-black" style={{ width: `${Math.min(monthlyConsistency, 100)}%` }} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="text-2xl font-bold leading-none text-neutral-900">{movementDays}</p>
            <p className="mt-1 text-[10px] leading-tight text-neutral-400">movement<br />days</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="text-2xl font-bold leading-none text-neutral-900">{stillDays}</p>
            <p className="mt-1 text-[10px] leading-tight text-neutral-400">still<br />days</p>
          </div>
        </section>

        {/* Goal cards */}
        {goalProgress.length > 0 && (
          <section className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">This month&apos;s goals</p>
            {goalProgress.map((gp) => {
              const meta = GOAL_META[gp.goal.category];
              const colors = paceColors(gp);
              const description = gp.goal.definition || gp.goal.coach_note || meta.typeDesc;
              return (
                <div key={gp.goal.id} className="rounded-xl border border-neutral-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-900">{meta.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${colors.badge}`}>
                      {paceLabel(gp)}
                    </span>
                  </div>
                  {description && (
                    <p className="text-[11px] text-neutral-500 leading-snug">{description}</p>
                  )}
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div className={`h-full rounded-full transition-all ${colors.bar}`} style={{ width: `${gp.pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">
                      {gp.current} {gp.goal.unit} &nbsp;·&nbsp; target {gp.goal.target} {gp.goal.unit}
                    </span>
                    <span className={`text-xs font-bold ${colors.pct}`}>{gp.pct}%</span>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Today's log */}
        {todayEntry ? (
          <>
            <section className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-3">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-green-500 text-white">✓</div>
                <div>
                  <p className="text-sm font-semibold text-green-700">Logged for today</p>
                  <p className="text-xs text-green-500">Streak is alive</p>
                </div>
              </div>
              <Link
                href={`/log?edit=${todayEntry.id}`}
                className="rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                Edit log
              </Link>
            </section>
            <section className="overflow-hidden rounded-xl border border-neutral-200">
              <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
                <span className="text-xs text-neutral-400">Sessions</span>
                <div className="flex flex-wrap gap-1">
                  {todayEntry.session_types.map((type: string) => (
                    <span key={type} className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">{type}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 text-sm">
                <span className="text-xs text-neutral-400">Duration</span>
                <span>{todayEntry.session_duration_minutes} min</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-xs text-neutral-400">Breathwork</span>
                <span>{todayEntry.breathwork_minutes} min</span>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="rounded-xl border border-neutral-200 p-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Today&apos;s log</p>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                <p className="text-sm font-medium text-neutral-900">Not logged yet</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {["Push", "Pull", "Legs", "Mob.", "Run"].map((label) => (
                  <span key={label} className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] text-neutral-400">{label}</span>
                ))}
              </div>
            </section>
            <Link href="/log" className="block w-full rounded-xl border-2 border-black bg-black py-4 text-center text-sm font-bold text-white">
              + Log today&apos;s activity
            </Link>
            <p className="-mt-1 text-center text-[10px] text-neutral-400">Log everyday — even rest days count</p>
          </>
        )}

        <section>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">This week</p>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => (
              <div key={d.name} className="text-center">
                <p className="mb-1 text-[10px] text-neutral-300">{d.name}</p>
                <div className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold ${d.isFuture ? "bg-neutral-50 text-neutral-300" : d.isToday ? "bg-green-500 text-white" : d.entry ? "bg-black text-white" : "bg-neutral-50 text-neutral-300"}`}>
                  {d.isToday ? (d.entry ? "✓" : "—") : d.entry ? d.tag : "—"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
      <BottomNav />
    </main>
  );
}
