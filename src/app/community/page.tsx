import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getISTDateString, getInitials, getLoggingStreak, getDaysInMonth, PROGRAMME_START } from "@/lib/utils";
import { computeGoalProgress } from "@/lib/goalProgress";
import { GOAL_META } from "@/lib/types";
import type { MemberGoal } from "@/lib/types";
import BottomNav from "@/components/member/BottomNav";
import CommunityClient from "@/components/member/CommunityClient";

export default async function CommunityPage({ searchParams }: { searchParams: { month?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const today = getISTDateString();
  const defaultMonth = today.slice(0, 7);
  const month = searchParams.month ?? defaultMonth;
  const monthStart = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const admin = createAdminClient();

  const [{ data: allProfiles }, { data: allowedData }, { data: streakLogs }, { data: monthLogs }, { data: allGoals }] = await Promise.all([
    admin.from("profiles").select("id,full_name,email,role,is_active").order("full_name"),
    admin.from("allowed_emails").select("email"),
    admin.from("log_entries").select("user_id,entry_date").gte("entry_date", PROGRAMME_START),
    admin.from("log_entries")
      .select("user_id,entry_date,session_types,breathwork_minutes,km,nutrition,sleep_goal")
      .gte("entry_date", monthStart)
      .lt("entry_date", nextMonth),
    admin.from("member_goals").select("*").eq("month", monthStart),
  ]);

  // Only show members who are in allowed_emails (same as admin views)
  const allowedSet = new Set((allowedData ?? []).map((a: any) => a.email?.toLowerCase()));
  const members = (allProfiles ?? []).filter((p: any) =>
    p.role === "member" && p.is_active && p.email && allowedSet.has(p.email.toLowerCase())
  );

  type MemberRow = {
    id: string;
    full_name: string;
    streak: number;
    loggedToday: boolean;
    loggedThisMonth: number;
    goals: { label: string; pct: number; pace: string }[];
  };

  const rows: MemberRow[] = members.map((m: any) => {
    const mStreakLogs = (streakLogs ?? []).filter((l: any) => l.user_id === m.id);
    const dateSet = new Set(mStreakLogs.map((l: any) => l.entry_date as string));
    const streak = getLoggingStreak(dateSet, today, "relaxed");
    const loggedToday = dateSet.has(today);

    const mMonthLogs = (monthLogs ?? []).filter((l: any) => l.user_id === m.id);
    const loggedThisMonth = mMonthLogs.length;

    const memberGoals = ((allGoals ?? []) as MemberGoal[]).filter((g) => g.member_id === m.id);
    const progress = computeGoalProgress(memberGoals, mMonthLogs, today);
    const goals = progress.map((gp) => ({
      label: GOAL_META[gp.goal.category].label,
      pct: gp.pct,
      pace: gp.pace,
    }));

    return { id: m.id, full_name: m.full_name, streak, loggedToday, loggedThisMonth, goals };
  });

  // Sort by most logged days this month desc, then by streak desc
  rows.sort((a, b) => b.loggedThisMonth - a.loggedThisMonth || b.streak - a.streak);

  const monthLabel = new Date(`${monthStart}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    month: "long", year: "numeric", timeZone: "Asia/Kolkata",
  });

  return (
    <main className="mx-auto max-w-[420px] pb-20">
      <CommunityClient rows={rows} month={month} monthLabel={monthLabel} memberCount={members.length} isCurrentMonth={month === defaultMonth} />
      <BottomNav />
    </main>
  );
}
