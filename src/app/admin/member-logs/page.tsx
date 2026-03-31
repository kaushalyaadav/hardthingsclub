import { createClient } from "@/lib/supabaseServer";
import {
  PROGRAMME_MONTHS,
  formatDate,
  getDaysElapsedInMonth,
  getDaysInMonth,
  getISTDateString,
  getInitials,
  getProgrammeDaysElapsed,
  isMovementDay
} from "@/lib/utils";

export default async function MemberLogsPage({ searchParams }: { searchParams: { id?: string } }) {
  const supabase = createClient();
  const { data: members } = await supabase.from("profiles").select("id,full_name").eq("role", "member").order("full_name");
  const selectedId = searchParams.id || members?.[0]?.id;
  const selected = members?.find((m) => m.id === selectedId);
  const { data: logs } = await supabase
    .from("log_entries")
    .select("id,user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,notes")
    .eq("user_id", selectedId)
    .order("entry_date", { ascending: false });
  const rows = logs ?? [];
  const today = getISTDateString();
  const totalDaysElapsed = getProgrammeDaysElapsed(today);
  const totalLogged = rows.length;
  const consistency = totalDaysElapsed > 0 ? Math.round((totalLogged / totalDaysElapsed) * 100) : 0;
  const movementDays = rows.filter((r) => isMovementDay(r.session_types)).length;
  const stillDays = rows.filter((r) => r.breathwork_minutes > 0).length;
  const avgSession = movementDays > 0 ? Math.round(rows.filter((r) => isMovementDay(r.session_types)).reduce((sum, r) => sum + r.session_duration_minutes, 0) / movementDays) : 0;
  const avgBreath = stillDays > 0 ? Math.round(rows.filter((r) => r.breathwork_minutes > 0).reduce((sum, r) => sum + r.breathwork_minutes, 0) / stillDays) : 0;

  const dateSet = new Set(rows.map((r) => r.entry_date));
  let streak = 0;
  let cursor = new Date(`${today}T00:00:00+05:30`);
  while (dateSet.has(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const monthStats = PROGRAMME_MONTHS.map((m) => {
    const monthRows = rows.filter((r) => {
      const [y, mo] = r.entry_date.split("-").map(Number);
      return y === m.year && mo === m.month;
    });
    const mMovement = monthRows.filter((r) => isMovementDay(r.session_types));
    const mStill = monthRows.filter((r) => r.breathwork_minutes > 0);
    return {
      label: m.label,
      totalDays: getDaysInMonth(m.year, m.month),
      loggedDays: monthRows.length,
      movementDays: mMovement.length,
      avgSession: mMovement.length ? Math.round(mMovement.reduce((s, r) => s + r.session_duration_minutes, 0) / mMovement.length) : 0,
      stillDays: mStill.length,
      avgBreath: mStill.length ? Math.round(mStill.reduce((s, r) => s + r.breathwork_minutes, 0) / mStill.length) : 0,
      isFuture: getDaysElapsedInMonth(m.year, m.month, today) === 0
    };
  });

  const logsByDate = new Map(rows.map((r) => [r.entry_date, r]));
  const recentDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(`${today}T00:00:00+05:30`);
    d.setDate(d.getDate() - i);
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(d);
    return dateStr;
  });

  const csv = [
    "Entry_Date,Session_Types,Session_Duration_Minutes,Breathwork_Minutes,Notes",
    ...rows.map((r) => `${r.entry_date},"${(r.session_types || []).join("|")}",${r.session_duration_minutes},${r.breathwork_minutes},"${(r.notes || "").replace(/"/g, '""')}"`)
  ].join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 p-5">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Member logs</h1>
          <p className="mt-1 text-sm text-neutral-500">6-month dashboard + full daily log history</p>
        </div>
        <div className="flex items-center gap-3">
          <form>
            <select
              name="id"
              defaultValue={selectedId}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm"
            >
              {(members ?? []).map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            <button type="submit" className="sr-only">View</button>
          </form>
          <a href={csvHref} download={`member-logs-${selectedId}.csv`} className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm text-neutral-700">
            Export CSV
          </a>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 flex items-center gap-3 border-b border-neutral-100 pb-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-black text-sm font-bold text-white">
            {getInitials(selected?.full_name || "NA")}
          </div>
          <div>
            <p className="text-lg font-semibold text-neutral-900">{selected?.full_name}</p>
            <p className="text-sm text-neutral-500">
              Streak {streak} days · Consistency {consistency}% · {totalLogged}/{totalDaysElapsed} days logged (Apr to date)
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-6 overflow-hidden rounded-xl border border-neutral-200">
          {[
            { label: "Consistency", value: `${consistency}%` },
            { label: "Movement days", value: String(movementDays) },
            { label: "Still days", value: String(stillDays) },
            { label: "Streak", value: `${streak}d` },
            { label: "Avg session", value: `${avgSession}m` },
            { label: "Avg breathwork", value: `${avgBreath}m` }
          ].map((item) => (
            <div key={item.label} className="border-r border-neutral-200 px-2 py-4 text-center last:border-r-0">
              <p className="text-3xl font-bold leading-none text-neutral-900">{item.value}</p>
              <p className="mt-1 text-xs text-neutral-500">{item.label}</p>
            </div>
          ))}
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">6-month overview</p>
        <div className="mb-6 overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-left text-neutral-500">
                <th className="px-3 py-2 font-medium">Metric</th>
                {monthStats.map((m, i) => <th key={m.label} className={`px-3 py-2 text-center font-medium ${i === 0 ? "text-neutral-900" : ""}`}>{m.label}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-neutral-50 text-xs uppercase tracking-[0.06em] text-neutral-500">
                <td className="px-3 py-2">Logging</td>{monthStats.map((m) => <td key={`lg-h-${m.label}`} />)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Total days</td>
                {monthStats.map((m, i) => <td key={`td-${m.label}`} className="px-3 py-2 text-center">{i === 0 ? <span className="rounded bg-black px-2 py-1 text-white">{m.totalDays}</span> : m.totalDays}</td>)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Logged days</td>
                {monthStats.map((m, i) => <td key={`ld-${m.label}`} className="px-3 py-2 text-center">{m.isFuture ? <span className="text-neutral-300">—</span> : i === 0 ? <span className="rounded bg-black px-2 py-1 text-white">{m.loggedDays}</span> : m.loggedDays}</td>)}
              </tr>
              <tr className="bg-neutral-50 text-xs uppercase tracking-[0.06em] text-neutral-500">
                <td className="px-3 py-2">Physical</td>{monthStats.map((m) => <td key={`ph-h-${m.label}`} />)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Movement days</td>
                {monthStats.map((m, i) => <td key={`mv-${m.label}`} className="px-3 py-2 text-center">{m.isFuture ? <span className="text-neutral-300">—</span> : i === 0 ? <span className="rounded bg-black px-2 py-1 text-white">{m.movementDays}</span> : m.movementDays}</td>)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Avg session (min)</td>
                {monthStats.map((m, i) => <td key={`as-${m.label}`} className="px-3 py-2 text-center">{m.isFuture ? <span className="text-neutral-300">—</span> : i === 0 ? <span className="rounded bg-black px-2 py-1 text-white">{m.avgSession}</span> : m.avgSession}</td>)}
              </tr>
              <tr className="bg-neutral-50 text-xs uppercase tracking-[0.06em] text-neutral-500">
                <td className="px-3 py-2">Mental</td>{monthStats.map((m) => <td key={`mn-h-${m.label}`} />)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Still days</td>
                {monthStats.map((m, i) => <td key={`st-${m.label}`} className="px-3 py-2 text-center">{m.isFuture ? <span className="text-neutral-300">—</span> : i === 0 ? <span className="rounded bg-black px-2 py-1 text-white">{m.stillDays}</span> : m.stillDays}</td>)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2">Avg breathwork (min)</td>
                {monthStats.map((m, i) => <td key={`ab-${m.label}`} className="px-3 py-2 text-center">{m.isFuture ? <span className="text-neutral-300">—</span> : i === 0 ? <span className="rounded bg-black px-2 py-1 text-white">{m.avgBreath}</span> : m.avgBreath}</td>)}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Daily log feed</p>
        <div className="space-y-2">
          {recentDays.map((day) => {
            const entry = logsByDate.get(day);
            if (!entry) {
              return <div key={day} className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">{formatDate(day)} — No activity logged</div>;
            }
            if (entry.session_types?.includes("Rest") && !entry.notes) {
              return <div key={day} className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">{formatDate(day)} — Rest day logged</div>;
            }
            return (
              <div key={entry.id} className="overflow-hidden rounded-xl border border-neutral-200">
                <div className="flex flex-wrap items-center gap-2 bg-white px-4 py-3">
                  <span className="font-semibold text-neutral-900">{formatDate(entry.entry_date)}</span>
                  {entry.session_types?.map((t: string) => <span key={`${entry.id}-${t}`} className="rounded-full bg-black px-2 py-1 text-xs text-white">{t}</span>)}
                  {entry.breathwork_minutes > 0 && <span className="rounded-full bg-[#EEEDFE] px-2 py-1 text-xs text-[#534AB7]">{entry.breathwork_minutes}m breathwork</span>}
                  {entry.session_duration_minutes > 0 && <span className="ml-auto text-sm text-neutral-500">{entry.session_duration_minutes} min</span>}
                </div>
                {entry.notes && <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3 text-base leading-relaxed text-neutral-700">{entry.notes}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
