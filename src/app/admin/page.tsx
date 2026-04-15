import AdminProgrammeMonthSelect from "@/components/admin/AdminProgrammeMonthSelect";
import { listCohortMembers } from "@/lib/adminCohort";
import { createClient } from "@/lib/supabaseServer";
import { PROGRAMME_MONTHS, getDaysElapsedInMonth, getFirstOfNextMonthIso } from "@/lib/utils";

type SearchParams = {
  month?: string;
};

function pctColor(pct: number) {
  if (pct >= 80) return "#16a34a";
  if (pct >= 50) return "#d97706";
  return "#dc2626";
}

export default async function AdminLoggingHabitPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const selectedMonth = searchParams.month ?? `${PROGRAMME_MONTHS[0].year}-${String(PROGRAMME_MONTHS[0].month).padStart(2, "0")}`;
  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const monthMeta = PROGRAMME_MONTHS.find((m) => m.year === year && m.month === month) ?? PROGRAMME_MONTHS[0];
  const totalDays = getDaysElapsedInMonth(year, month);

  const members = await listCohortMembers(supabase);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndExclusive = getFirstOfNextMonthIso(year, month);
  const { data: logs } = await supabase
    .from("log_entries")
    .select("user_id,entry_date")
    .gte("entry_date", monthStart)
    .lt("entry_date", monthEndExclusive);

  const rows = members.map((member) => {
    const loggedDays = (logs ?? []).filter((l) => l.user_id === member.id).length;
    const pct = totalDays > 0 ? Math.round((loggedDays / totalDays) * 100) : 0;
    return { id: member.id, name: member.full_name, loggedDays, pct };
  });
  rows.sort((a, b) => b.pct - a.pct || b.loggedDays - a.loggedDays || a.name.localeCompare(b.name));

  const avgLogged = rows.length ? rows.reduce((sum, row) => sum + row.loggedDays, 0) / rows.length : 0;
  const avgPct = totalDays > 0 ? Math.round((avgLogged / totalDays) * 100) : 0;
  const csv = [
    "Member_name,Month,Total_Days,Logged_Days,Pct_Logged",
    ...rows.map((r) => `"${r.name.replace(/"/g, '""')}",${monthMeta.label} ${monthMeta.year},${totalDays},${r.loggedDays},${r.pct}`)
  ].join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between border-b border-neutral-100 p-5">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Logging habit</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {monthMeta.label} {monthMeta.year} · {totalDays} days elapsed · who is showing up to log every day
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminProgrammeMonthSelect basePath="/admin" selectedMonth={selectedMonth} />
          <a
            href={csvHref}
            download={`logging-habit-${selectedMonth}.csv`}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm text-neutral-700"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-2 text-xs text-neutral-500">
        CSV columns: <code className="rounded bg-neutral-200 px-1 py-0.5">Member_name</code>{" "}
        <code className="rounded bg-neutral-200 px-1 py-0.5">Month</code>{" "}
        <code className="rounded bg-neutral-200 px-1 py-0.5">Total_Days</code>{" "}
        <code className="rounded bg-neutral-200 px-1 py-0.5">Logged_Days</code>{" "}
        <code className="rounded bg-neutral-200 px-1 py-0.5">Pct_Logged</code>
      </div>

      <div className="p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Member name</th>
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 font-medium">Total days</th>
              <th className="px-4 py-3 font-medium">Logged days</th>
              <th className="px-4 py-3 font-medium">% logged</th>
              <th className="px-4 py-3 font-medium">Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const color = pctColor(row.pct);
              return (
                <tr key={row.id} className="border-b border-neutral-100">
                  <td className="px-4 py-4 text-base font-semibold text-neutral-900">{row.name}</td>
                  <td className="px-4 py-4 text-base text-neutral-500">{monthMeta.label} {monthMeta.year}</td>
                  <td className="px-4 py-4 text-base text-neutral-700">{totalDays}</td>
                  <td className="px-4 py-4 text-base text-neutral-900">{row.loggedDays}</td>
                  <td className="px-4 py-4 text-base font-semibold" style={{ color }}>
                    {row.pct}%
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-2 w-[180px] overflow-hidden rounded-full bg-neutral-200">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(row.pct, 100)}%`, backgroundColor: color }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="px-4 py-4 text-sm font-semibold text-neutral-900">Cohort average</td>
              <td className="px-4 py-4 text-base text-neutral-500">{monthMeta.label} {monthMeta.year}</td>
              <td className="px-4 py-4 text-base text-neutral-700">{totalDays}</td>
              <td className="px-4 py-4 text-base text-neutral-900">{avgLogged.toFixed(1)}</td>
              <td className="px-4 py-4 text-base font-semibold text-neutral-700">{avgPct}%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
