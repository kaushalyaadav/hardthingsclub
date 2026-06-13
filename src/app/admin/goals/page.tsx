import { createClient } from "@/lib/supabaseServer";
import { getISTDateString } from "@/lib/utils";
import GoalSetupClient from "@/components/admin/GoalSetupClient";
import AdminProgrammeMonthSelect from "@/components/admin/AdminProgrammeMonthSelect";
import type { MemberGoal } from "@/lib/types";

type SearchParams = { month?: string };

export default async function AdminGoalsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  const today = getISTDateString();
  const defaultMonth = today.slice(0, 7);
  const month = searchParams.month ?? defaultMonth;
  const monthDate = `${month}-01`;

  const [{ data: profileRows }, { data: goalsRows }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,role,is_active").order("full_name"),
    supabase.from("member_goals").select("*").eq("month", monthDate),
  ]);

  const members = (profileRows ?? []).filter((p: any) => p.role === "member" && p.is_active) as { id: string; full_name: string }[];
  const allGoals = (goalsRows ?? []) as MemberGoal[];

  const goalsByMember: Record<string, MemberGoal[]> = {};
  for (const m of members) {
    goalsByMember[m.id] = allGoals.filter((g) => g.member_id === m.id);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 bg-white">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Goal setup</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Configure monthly goals per member</p>
        </div>
        <AdminProgrammeMonthSelect basePath="/admin/goals" selectedMonth={month} />
      </div>
      <div className="flex-1 flex overflow-hidden">
        <GoalSetupClient
          members={members}
          goalsByMember={goalsByMember}
          metricsByMember={{}}
          month={month}
          currentMonth={defaultMonth}
        />
      </div>
    </div>
  );
}
