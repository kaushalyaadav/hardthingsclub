import { redirect } from "next/navigation";
import BottomNav from "@/components/member/BottomNav";
import { createClient } from "@/lib/supabaseServer";
import { PROGRAMME_MONTHS, getDaysElapsedInMonth, getDaysInMonth, getISTDateString, getInitials, isMovementDay } from "@/lib/utils";

export default async function ProgressPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const { data: logs } = await supabase
    .from("log_entries")
    .select("entry_date,session_types,session_duration_minutes,breathwork_minutes")
    .eq("user_id", user.id);
  const entries = logs ?? [];
  const today = getISTDateString();
  const [todayYear, todayMonth] = today.split("-").map(Number);

  const rowFor = (year: number, month: number) => entries.filter((l) => {
    const d = new Date(`${l.entry_date}T00:00:00+05:30`);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  });

  const monthIndex = PROGRAMME_MONTHS.findIndex((m) => m.year === todayYear && m.month === todayMonth);
  const programmeMonthNumber = monthIndex >= 0 ? monthIndex + 1 : 1;

  const cell = (value: string | number, isCurrent: boolean, isFuture: boolean) => {
    if (isFuture) return <span className="text-neutral-300">—</span>;
    if (!isCurrent) return <span className="text-neutral-500">{value}</span>;
    return <span className="rounded-md bg-black px-2 py-0.5 text-white">{value}</span>;
  };

  return (
    <main className="mx-auto max-w-[420px] pb-20">
      <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <p className="text-xs font-semibold tracking-[0.04em] text-neutral-900">Hard Things Club</p>
        <div className="grid h-7 w-7 place-items-center rounded-full bg-black text-[10px] font-semibold text-white">
          {getInitials(profile?.full_name || user.email?.split("@")[0] || "HTC")}
        </div>
      </header>

      <section className="px-4 pt-4">
        <h1 className="text-[34px] leading-none font-semibold text-neutral-900">{profile?.full_name || "Member"}</h1>
        <p className="mt-1 text-sm text-neutral-400">Apr – Sep 2026 · Programme month {programmeMonthNumber}</p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[460px] w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-left text-neutral-500">
                <th className="px-3 py-2 font-medium">Metric</th>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  return (
                    <th key={m.label} className={`px-2 py-2 text-center font-medium ${isCurrent ? "text-neutral-900" : "text-neutral-400"}`}>
                      {m.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-neutral-50">
                <td className="px-3 py-1 text-xs uppercase tracking-[0.07em] text-neutral-400">Logging</td>
                {PROGRAMME_MONTHS.map((m) => <td key={`h-l-${m.label}`} />)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Total days</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  return <td key={`td-${m.label}`} className="px-2 py-2 text-center">{cell(getDaysInMonth(m.year, m.month), isCurrent, isFuture)}</td>;
                })}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Logged days</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  return <td key={`ld-${m.label}`} className="px-2 py-2 text-center">{cell(rowFor(m.year, m.month).length, isCurrent, isFuture)}</td>;
                })}
              </tr>

              <tr className="bg-neutral-50">
                <td className="px-3 py-1 text-xs uppercase tracking-[0.07em] text-neutral-400">Physical</td>
                {PROGRAMME_MONTHS.map((m) => <td key={`h-p-${m.label}`} />)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Active days</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  const value = rowFor(m.year, m.month).filter((r) => isMovementDay(r.session_types)).length;
                  return <td key={`ad-${m.label}`} className="px-2 py-2 text-center">{cell(value, isCurrent, isFuture)}</td>;
                })}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Avg duration</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  const monthRows = rowFor(m.year, m.month).filter((r) => isMovementDay(r.session_types));
                  const avg = monthRows.length ? Math.round(monthRows.reduce((s, r) => s + r.session_duration_minutes, 0) / monthRows.length) : 0;
                  return <td key={`avgd-${m.label}`} className="px-2 py-2 text-center">{cell(`${avg}m`, isCurrent, isFuture)}</td>;
                })}
              </tr>

              <tr className="bg-neutral-50">
                <td className="px-3 py-1 text-xs uppercase tracking-[0.07em] text-neutral-400">Mental</td>
                {PROGRAMME_MONTHS.map((m) => <td key={`h-m-${m.label}`} />)}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Active days</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  const value = rowFor(m.year, m.month).filter((r) => r.breathwork_minutes > 0).length;
                  return <td key={`std-${m.label}`} className="px-2 py-2 text-center">{cell(value, isCurrent, isFuture)}</td>;
                })}
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">Avg breathwork</td>
                {PROGRAMME_MONTHS.map((m) => {
                  const isCurrent = m.year === todayYear && m.month === todayMonth;
                  const isFuture = getDaysElapsedInMonth(m.year, m.month, today) === 0;
                  const monthRows = rowFor(m.year, m.month).filter((r) => r.breathwork_minutes > 0);
                  const avg = monthRows.length ? Math.round(monthRows.reduce((s, r) => s + r.breathwork_minutes, 0) / monthRows.length) : 0;
                  return <td key={`avgb-${m.label}`} className="px-2 py-2 text-center">{cell(`${avg}m`, isCurrent, isFuture)}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <BottomNav />
    </main>
  );
}
