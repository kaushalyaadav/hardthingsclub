import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { formatDate, getISTDateString } from "@/lib/utils";
import LogForm from "@/components/member/LogForm";
import { computeGoalProgress } from "@/lib/goalProgress";
import type { MemberGoal } from "@/lib/types";

export default async function LogPage({ searchParams }: { searchParams: { edit?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const today = getISTDateString();
  const monthStart = `${today.slice(0, 7)}-01`;

  let existing = null as any;
  if (searchParams.edit) {
    const { data } = await supabase.from("log_entries").select("*").eq("id", searchParams.edit).single();
    existing = data;
  } else {
    const { data } = await supabase.from("log_entries").select("*").eq("user_id", user.id).eq("entry_date", today).maybeSingle();
    existing = data;
  }

  const [{ data: goalsData }, { data: entriesData }] = await Promise.all([
    supabase.from("member_goals").select("*").eq("member_id", user.id).eq("month", monthStart),
    supabase.from("log_entries").select("entry_date,session_types,breathwork_minutes,km,nutrition,sleep_goal").eq("user_id", user.id).gte("entry_date", monthStart),
  ]);

  const goals = (goalsData ?? []) as MemberGoal[];
  const goalProgress = computeGoalProgress(goals, entriesData ?? [], today);

  return (
    <main className="mx-auto max-w-[420px] pb-6">
      <header className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
        <Link href="/home" className="grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-sm text-neutral-900">
          ←
        </Link>
        <h1 className="text-base font-semibold text-neutral-900">Log today</h1>
        <p className="ml-auto text-xs text-neutral-400">{formatDate(today)}</p>
      </header>
      <div className="px-4 pt-4">
        <LogForm
          userId={user.id}
          entryDate={today}
          goals={goals}
          goalProgress={goalProgress}
          initial={
            existing
              ? {
                  id: existing.id,
                  session_types: existing.session_types,
                  session_duration_minutes: existing.session_duration_minutes,
                  breathwork_minutes: existing.breathwork_minutes,
                  notes: existing.notes || "",
                  km: existing.km ?? null,
                  nutrition: existing.nutrition ?? null,
                  sleep_goal: existing.sleep_goal ?? null,
                }
              : undefined
          }
        />
      </div>
    </main>
  );
}
