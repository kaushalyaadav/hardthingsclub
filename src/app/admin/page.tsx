import AdminProgrammeMonthSelect from "@/components/admin/AdminProgrammeMonthSelect";
import { listCohortMembers } from "@/lib/adminCohort";
import { createClient } from "@/lib/supabaseServer";
import { PROGRAMME_MONTHS, PROGRAMME_START, getDaysElapsedInMonth, getFirstOfNextMonthIso, getISTDateString, getProgrammeDaysElapsed } from "@/lib/utils";

type SearchParams = { month?: string; view?: string };

function pctColor(pct: number) {
  if (pct >= 80) return "#16a34a";
  if (pct >= 50) return "#d97706";
  return "#dc2626";
}

export default async function AdminLoggingHabitPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const view = searchParams.view === "tilldate" ? "tilldate" : "month";

  const today = getISTDateString();
  const selectedMonth = searchParams.month ?? `${PROGRAMME_MONTHS[0].year}-${String(PROGRAMME_MONTHS[0].month).padStart(2, "0")}`;
  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const monthMeta = PROGRAMME_MONTHS.find((m) => m.year === year && m.month === month) ?? PROGRAMME_MONTHS[0];

  const members = await listCohortMembers(supabase);

  let totalDays: number;
  let logs: { user_id: string; entry_date: string }[] | null;

  if (view === "tilldate") {
    totalDays = getProgrammeDaysElapsed(today);
    const { data } = await supabase
      .from("log_entries")
      .select("user_id,entry_date")
      .gte("entry_date", PROGRAMME_START)
      .lte("entry_date", today);
    logs = data;
  } else {
    totalDays = getDaysElapsedInMonth(year, month);
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const monthEndExclusive = getFirstOfNextMonthIso(year, month);
    const { data } = await supabase
      .from("log_entries")
      .select("user_id,entry_date")
      .gte("entry_date", monthStart)
      .lt("entry_date", monthEndExclusive);
    logs = data;
  }

  const rows = members.map((member) => {
    const loggedDays = (logs ?? []).filter((l) => l.user_id === member.id).length;
    const pct = totalDays > 0 ? Math.round((loggedDays / totalDays) * 100) : 0;
    return { id: member.id, name: member.full_name, loggedDays, pct };
  });
  rows.sort((a, b) => b.pct - a.pct || b.loggedDays - a.loggedDays || a.name.localeCompare(b.name));

  const avgLogged = rows.length ? rows.reduce((sum, row) => sum + row.loggedDays, 0) / rows.length : 0;
  const avgPct = totalDays > 0 ? Math.round((avgLogged / totalDays) * 100) : 0;

  const periodLabel = view === "tilldate"
    ? `Programme to date · ${totalDays} days elapsed`
    : `${monthMeta.label} ${monthMeta.year} · ${totalDays} days elapsed`;

  const csv = [
    "Member_name,Period,Total_Days,Logged_Days,Pct_Logged",
    ...rows.map((r) => `"${r.name.replace(/"/g, '""')}",${view === "tilldate" ? "Till date" : `${monthMeta.label} ${monthMeta.year}`},${totalDays},${r.loggedDays},${r.pct}`)
  ].join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between border-b border-neutral-100 p-5">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Logging habit</h1>
          <p className="mt-1 text-sm text-neutral-500">{periodLabel} · who is showing up to log every day</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Till date / Month toggle */}
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden text-sm">
            <a
              href={`/admin?view=month&month=${selectedMonth}`}
              className={`px-3 py-2 ${view === "month" ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-50"}`}
            >
              Monthly
            </a>
            <a
              href={`/admin?view=tilldate`}
              className={`px-3 py-2 border-l border-neutral-200 ${view === "tilldate" ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-50"}`}
            >
              Till date
            </a>
          </div>

          {view === "month" && (
            <AdminProgrammeMonthSelect basePath="/admin" selectedMonth={selectedMonth} />
          )}

          <a
            href={csvHref}
            download={`logging-habit-${view === "tilldate" ? "tilldate" : selectedMonth}.csv`}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm text-neutral-700"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Member name</th>
              <th className="px-4 py-3 font-medium">Period</th>
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
                  <td className="px-4 py-4 text-base text-neutral-500">
                    {view === "tilldate" ? "Till date" : `${monthMeta.label} ${monthMeta.year}`}
                  </td>
                  <td className="px-4 py-4 text-base text-neutral-700">{totalDays}</td>
                  <td className="px-4 py-4 text-base text-neutral-900">{row.loggedDays}</td>
                  <td className="px-4 py-4 text-base font-semibold" style={{ color }}>{row.pct}%</td>
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
              <td className="px-4 py-4 text-base text-neutral-500">
                {view === "tilldate" ? "Till date" : `${monthMeta.label} ${monthMeta.year}`}
              </td>
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
