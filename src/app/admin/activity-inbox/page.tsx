import ActivityInboxDateSelect from "@/components/admin/ActivityInboxDateSelect";
import { listCohortMembers } from "@/lib/adminCohort";
import { createClient } from "@/lib/supabaseServer";
import { getISTDateString, getInitials } from "@/lib/utils";

export default async function ActivityInboxPage({ searchParams }: { searchParams: { date?: string; tab?: string } }) {
  const supabase = createClient();
  const selectedDate = searchParams.date || getISTDateString();
  const tab = searchParams.tab || "all";

  const members = await listCohortMembers(supabase);
  const { data: entries } = await supabase
    .from("log_entries")
    .select("id,user_id,session_types,session_duration_minutes,breathwork_minutes,notes,entry_date")
    .eq("entry_date", selectedDate);
  const loggedSet = new Set((entries ?? []).map((e) => e.user_id));
  const notLogged = members.filter((m) => !loggedSet.has(m.id));

  const past30Dates = Array.from({ length: 31 }, (_, i) => {
    const d = new Date(`${getISTDateString()}T00:00:00+05:30`);
    d.setDate(d.getDate() - i);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(d);
  });

  const shownLogged = tab === "notlogged" ? [] : entries ?? [];
  const showNotLogged = tab === "all" || tab === "notlogged";

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between border-b border-neutral-100 p-5">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Activity inbox</h1>
          <p className="mt-1 text-sm text-neutral-500">All member activity in one feed · day-level view across the cohort</p>
        </div>
        <ActivityInboxDateSelect
          dates={past30Dates}
          selectedDate={selectedDate}
          today={getISTDateString()}
          tab={tab}
        />
      </div>

      <div className="border-b border-neutral-100 bg-white px-5">
        <div className="flex gap-2">
          {[
            { key: "all", label: `All (${members.length})` },
            { key: "logged", label: `Logged today (${(entries ?? []).length})` },
            { key: "notlogged", label: `Not logged (${notLogged.length})` }
          ].map((item) => {
            const active = tab === item.key;
            return (
              <a
                key={item.key}
                href={`/admin/activity-inbox?date=${selectedDate}&tab=${item.key}`}
                className={`-mb-px border-b-2 px-4 py-3 text-sm ${
                  active
                    ? "border-black text-neutral-900"
                    : "border-transparent text-neutral-400"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
      <div className="p-5">
        <div className="space-y-3">
          {shownLogged.map((entry) => {
            const member = members.find((m) => m.id === entry.user_id);
            return (
              <div key={entry.id} className="overflow-hidden rounded-xl border border-neutral-200">
                <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-black text-[9px] font-bold text-white">{getInitials(member?.full_name || "NA")}</span>
                  <span className="text-sm font-semibold text-neutral-900">{member?.full_name}</span>
                  {entry.session_types?.map((session: string) => (
                    <span key={`${entry.id}-${session}`} className="rounded-full bg-black px-2 py-1 text-xs text-white">
                      {session}
                    </span>
                  ))}
                  {entry.breathwork_minutes > 0 && (
                    <span className="rounded-full bg-[#EEEDFE] px-2 py-1 text-xs text-[#534AB7]">{entry.breathwork_minutes}m breathwork</span>
                  )}
                  {entry.session_duration_minutes > 0 && <span className="ml-auto text-xs text-neutral-500">{entry.session_duration_minutes} min</span>}
                </div>
                <div className="px-4 py-3">
                  {entry.notes && <p className="text-sm leading-relaxed text-neutral-700">{entry.notes}</p>}
                </div>
              </div>
            );
          })}
          {showNotLogged && tab === "all" && notLogged.length > 0 && (
            <div className="mt-2 mb-1 flex items-center gap-3 text-xs uppercase tracking-[0.07em] text-neutral-400">
              <span>Not logged</span>
              <span className="h-px flex-1 bg-neutral-100" />
            </div>
          )}
          {showNotLogged && notLogged.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-xl border border-dashed border-neutral-300 px-4 py-3">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-red-600 text-[9px] font-bold text-white">{getInitials(member.full_name)}</span>
              <span className="text-sm text-neutral-500">{member.full_name} — no activity logged today</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
