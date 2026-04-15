import Link from "next/link";
import { listCohortMembers } from "@/lib/adminCohort";
import { createClient } from "@/lib/supabaseServer";
import { getISTDateString, getLoggingStreak, getProgrammeDaysElapsed, isMovementDay, getInitials } from "@/lib/utils";

function getISTDate(date = new Date()) {
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
  return new Date(`${dateStr}T00:00:00+05:30`);
}

function getWeekStartMonday(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const d = new Date(date);
  d.setDate(d.getDate() + diff);
  return d;
}

function dateToISTString(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function daysBetweenIST(fromStr: string, toStr: string) {
  const from = new Date(`${fromStr}T00:00:00+05:30`).getTime();
  const to = new Date(`${toStr}T00:00:00+05:30`).getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export default async function MembersPage() {
  const supabase = createClient();
  const members = await listCohortMembers(supabase);
  const { data: logs } = await supabase
    .from("log_entries")
    .select("user_id,entry_date,session_types,breathwork_minutes")
    .order("entry_date", { ascending: false });
  const totalDays = getProgrammeDaysElapsed();
  const today = getISTDateString();
  const weekStart = getWeekStartMonday(getISTDate());
  const weekDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return dateToISTString(d);
  });

  const rows = members.map((member) => {
    const my = (logs ?? []).filter((l) => l.user_id === member.id);
    const dateSet = new Set(my.map((x) => x.entry_date));
    const logged = my.length;
    const consistency = totalDays ? Math.round((logged / totalDays) * 100) : 0;
    const movement = my.filter((x) => isMovementDay(x.session_types)).length;
    const still = my.filter((x) => x.breathwork_minutes > 0).length;
    const streak = getLoggingStreak(dateSet, today, "relaxed");
    const lastDate = my[0]?.entry_date;
    const daysSince = lastDate ? daysBetweenIST(lastDate, today) : null;
    const lastLoggedLabel =
      daysSince === null ? "Never" :
      daysSince === 0 ? "Today" :
      daysSince === 1 ? "Yesterday" :
      `${daysSince} days ago`;
    const weekDone = weekDates.filter((d) => dateSet.has(d)).length;
    return {
      id: member.id,
      name: member.full_name,
      initials: getInitials(member.full_name),
      logged,
      consistency,
      movement,
      still,
      streak,
      lastLoggedLabel,
      daysSince,
      weekDone
    };
  });

  const csv = [
    "Member,Days_since_Apr_1,Logged_days,Consistency,Movement_days,Still_days,Streak,Last_logged,This_week",
    ...rows.map((r) => `"${r.name.replace(/"/g, '""')}",${totalDays},${r.logged},${r.consistency}%,${r.movement},${r.still},${r.streak},${r.lastLoggedLabel},${r.weekDone}`)
  ].join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between border-b border-neutral-100 p-5">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">All members</h1>
          <p className="mt-1 text-sm text-neutral-500">Cumulative data · 1 Apr 2026 to today · click any row to open their full log</p>
        </div>
        <a href={csvHref} download="all-members.csv" className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700">
          Export all data
        </a>
      </div>
      <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-5 py-2 text-xs text-neutral-500">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        All numbers are cumulative from 1 April 2026. As the programme progresses, these totals grow each day.
      </div>
      <div className="p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Days since Apr 1</th>
              <th className="px-4 py-3 font-medium">Logged days</th>
              <th className="px-4 py-3 font-medium">Consistency</th>
              <th className="px-4 py-3 font-medium">Movement days</th>
              <th className="px-4 py-3 font-medium">Still days</th>
              <th className="px-4 py-3 font-medium">Streak</th>
              <th className="px-4 py-3 font-medium">Last logged</th>
              <th className="px-4 py-3 font-medium">This week</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pctColor = row.consistency >= 80 ? "#16a34a" : row.consistency >= 50 ? "#d97706" : "#dc2626";
              const lastColor = row.daysSince === 0 ? "#16a34a" : (row.daysSince ?? 9) >= 3 ? "#dc2626" : "#888888";
              return (
                <tr key={row.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/member-logs?id=${row.id}`} className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-black text-[10px] font-bold text-white">{row.initials}</span>
                      <span className="font-semibold text-neutral-900">{row.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{totalDays}</td>
                  <td className="px-4 py-3">{row.logged}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color: pctColor }}>{row.consistency}%</span>
                  </td>
                  <td className="px-4 py-3"><span className="font-semibold">{row.movement}</span> days</td>
                  <td className="px-4 py-3"><span className="font-semibold">{row.still}</span> days</td>
                  <td className="px-4 py-3">{row.streak > 0 ? <><span className="font-semibold">{row.streak}</span> days</> : <span className="text-neutral-300">—</span>}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: lastColor }}>{row.lastLoggedLabel}</td>
                  <td className="px-4 py-3">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: i < row.weekDone ? "#111111" : "#ebebeb" }} />
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
