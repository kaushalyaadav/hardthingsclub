import AdminProgrammeMonthSelect from "@/components/admin/AdminProgrammeMonthSelect";
import { listCohortMembers } from "@/lib/adminCohort";
import { createClient } from "@/lib/supabaseServer";
import { PROGRAMME_MONTHS, PROGRAMME_START, getDaysElapsedInMonth, getFirstOfNextMonthIso, getISTDateString, getProgrammeDaysElapsed, isMovementDay } from "@/lib/utils";

type SearchParams = { month?: string; view?: string };

export default async function ActivitySummaryPage({ searchParams }: { searchParams: SearchParams }) {
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
  let logs: { user_id: string; session_types: string[]; breathwork_minutes: number; entry_date: string }[] | null;

  if (view === "tilldate") {
    totalDays = getProgrammeDaysElapsed(today);
    const { data } = await supabase
      .from("log_entries")
      .select("user_id,session_types,breathwork_minutes,entry_date")
      .gte("entry_date", PROGRAMME_START)
      .lte("entry_date", today);
    logs = data;
  } else {
    totalDays = getDaysElapsedInMonth(year, month);
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const monthEndExclusive = getFirstOfNextMonthIso(year, month);
    const { data } = await supabase
      .from("log_entries")
      .select("user_id,session_types,breathwork_minutes,entry_date")
      .gte("entry_date", monthStart)
      .lt("entry_date", monthEndExclusive);
    logs = data;
  }

  const rows = members.map((member) => {
    const my = (logs ?? []).filter((l) => l.user_id === member.id);
    const movement = my.filter((x) => isMovementDay(x.session_types as any)).length;
    const still = my.filter((x) => x.breathwork_minutes > 0).length;
    const movementPct = totalDays > 0 ? Math.round((movement / totalDays) * 100) : 0;
    const stillPct = totalDays > 0 ? Math.round((still / totalDays) * 100) : 0;
    return { id: member.id, name: member.full_name, movement, still, movementPct, stillPct };
  });

  rows.sort((a, b) => b.movement - a.movement || b.still - a.still || a.name.localeCompare(b.name));
  const avgMovement = rows.length ? rows.reduce((sum, row) => sum + row.movement, 0) / rows.length : 0;
  const avgStill = rows.length ? rows.reduce((sum, row) => sum + row.still, 0) / rows.length : 0;

  const periodLabel = view === "tilldate"
    ? `Programme to date · ${totalDays} days elapsed`
    : `${monthMeta.label} ${monthMeta.year} · ${totalDays} days elapsed`;

  const periodCell = view === "tilldate" ? "Till date" : `${monthMeta.label} ${monthMeta.year}`;

  const csv = [
    "Member_name,Period,Total_Days,Movement_Days,Still_Days",
    ...rows.map((r) => `"${r.name.replace(/"/g, '""')}",${periodCell},${totalDays},${r.movement},${r.still}`)
  ].join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between border-b border-neutral-100 p-5">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Activity summary</h1>
          <p className="mt-1 text-sm text-neutral-500">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Till date / Month toggle */}
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden text-sm">
            <a
              href={`/admin/activity-summary?view=month&month=${selectedMonth}`}
              className={`px-3 py-2 ${view === "month" ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-50"}`}
            >
              Monthly
            </a>
            <a
              href="/admin/activity-summary?view=tilldate"
              className={`px-3 py-2 border-l border-neutral-200 ${view === "tilldate" ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-50"}`}
            >
              Till date
            </a>
          </div>

          {view === "month" && (
            <AdminProgrammeMonthSelect basePath="/admin/activity-summary" selectedMonth={selectedMonth} />
          )}

          <a href={csvHref} download={`activity-summary-${view === "tilldate" ? "tilldate" : selectedMonth}.csv`}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm text-neutral-700">
            Export CSV
          </a>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center gap-6 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#1D9E75]" />
            <span>Movement days (any session logged)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#7F77DD]" />
            <span>Still days (breathwork &gt; 0 min)</span>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Member name</th>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Total days</th>
              <th className="px-4 py-3 font-medium">Movement days</th>
              <th className="px-4 py-3 font-medium">Still days</th>
              <th className="px-4 py-3 font-medium">Visual</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-neutral-100">
                <td className="px-4 py-4 text-base font-semibold text-neutral-900">{row.name}</td>
                <td className="px-4 py-4 text-base text-neutral-500">{periodCell}</td>
                <td className="px-4 py-4 text-base text-neutral-700">{totalDays}</td>
                <td className="px-4 py-4 text-base text-neutral-900">
                  <span className="font-semibold">{row.movement}</span> <span className="text-neutral-500">({row.movementPct}%)</span>
                </td>
                <td className="px-4 py-4 text-base text-neutral-900">
                  <span className="font-semibold">{row.still}</span> <span className="text-neutral-500">({row.stillPct}%)</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex h-2 items-center gap-1">
                    <div className="h-2 rounded-sm bg-[#1D9E75]" style={{ width: `${Math.round(row.movementPct * 0.85)}px` }} />
                    <div className="h-2 rounded-sm bg-[#7F77DD]" style={{ width: `${Math.round(row.stillPct * 0.85)}px` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="px-4 py-4 text-base font-semibold text-neutral-900">Cohort average</td>
              <td className="px-4 py-4 text-base text-neutral-500">{periodCell}</td>
              <td className="px-4 py-4 text-base text-neutral-700">{totalDays}</td>
              <td className="px-4 py-4 text-base text-neutral-900">{avgMovement.toFixed(1)}</td>
              <td className="px-4 py-4 text-base text-neutral-900">{avgStill.toFixed(1)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
