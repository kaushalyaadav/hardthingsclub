import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/member/BottomNav";
import { createClient } from "@/lib/supabaseServer";
import { formatDate, getInitials, isMovementDay } from "@/lib/utils";

function monthLabel(dateStr: string) {
  return new Date(`${dateStr}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  });
}

function sessionChipClass(type: string) {
  if (type === "Mobility") return "bg-[#534AB7] text-white";
  if (type === "Run") return "bg-[#0F6E56] text-white";
  if (type === "Pull") return "bg-[#333] text-white";
  if (type === "Legs") return "bg-[#444] text-white";
  return "bg-black text-white";
}

export default async function JournalPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const { data: logs } = await supabase.from("log_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false });
  const entries = logs ?? [];
  const initials = getInitials(profile?.full_name || user.email?.split("@")[0] || "HTC");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const entriesThisMonth = entries.filter((e) => {
    const [y, m] = e.entry_date.split("-").map(Number);
    return y === currentYear && m === currentMonth;
  }).length;
  const movementDays = entries.filter((e) => isMovementDay(e.session_types)).length;
  const stillDays = entries.filter((e) => e.breathwork_minutes > 0).length;

  let lastMonth = "";

  return (
    <main className="mx-auto max-w-[420px] pb-20">
      <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <p className="text-xs font-semibold tracking-[0.04em] text-neutral-900">Hard Things Club</p>
        <div className="grid h-7 w-7 place-items-center rounded-full bg-black text-[10px] font-semibold text-white">{initials}</div>
      </header>

      <section className="space-y-4 px-4 pt-4">
        <div>
          <h1 className="text-xl font-semibold">Your journal</h1>
          <p className="text-xs text-neutral-400">Every log, in one place</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <p className="text-lg font-bold leading-none text-neutral-900">{entriesThisMonth}</p>
            <p className="mt-1 text-[10px] leading-tight text-neutral-400">Entries this month</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <p className="text-lg font-bold leading-none text-neutral-900">{movementDays}</p>
            <p className="mt-1 text-[10px] leading-tight text-neutral-400">Movement days</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <p className="text-lg font-bold leading-none text-neutral-900">{stillDays}</p>
            <p className="mt-1 text-[10px] leading-tight text-neutral-400">Still days</p>
          </div>
        </div>

        {entries.length === 0 ? (
          <>
            <div className="rounded-2xl border border-dashed border-neutral-200 px-6 py-8 text-center">
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-neutral-100 text-neutral-400">≡</div>
              <p className="text-sm font-semibold text-neutral-900">No entries yet</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">Your journal builds as you log. Every entry you write lives here.</p>
            </div>
            <Link href="/log" className="block w-full rounded-xl bg-black py-3 text-center text-sm font-semibold text-white">
              + Log today&apos;s activity
            </Link>
          </>
        ) : (
          entries.map((e) => {
            const month = monthLabel(e.entry_date);
            const showMonthLabel = month !== lastMonth;
            lastMonth = month;

            if (e.session_types.includes("Rest")) {
              return (
                <div key={e.id}>
                  {showMonthLabel && (
                    <div className="mb-2 mt-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.08em] text-neutral-400">
                      <span>{month}</span>
                      <span className="h-px flex-1 bg-neutral-100" />
                    </div>
                  )}
                  <div className="mb-2 flex items-center gap-2 rounded-xl border border-dashed border-neutral-200 px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                    <p className="text-xs text-neutral-400">{formatDate(e.entry_date)} — Rest day logged</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={e.id}>
                {showMonthLabel && (
                  <div className="mb-2 mt-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.08em] text-neutral-400">
                    <span>{month}</span>
                    <span className="h-px flex-1 bg-neutral-100" />
                  </div>
                )}
                <article className="mb-2 overflow-hidden rounded-xl border border-neutral-200">
                  <div className="flex flex-wrap items-center gap-1.5 bg-white px-3 py-2">
                    <span className="text-xs font-semibold text-neutral-900">{formatDate(e.entry_date)}</span>
                    {e.session_types.map((type: string) => (
                      <span key={`${e.id}-${type}`} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sessionChipClass(type)}`}>
                        {type}
                      </span>
                    ))}
                    {e.breathwork_minutes > 0 && (
                      <span className="rounded-full bg-[#EEEDFE] px-2 py-0.5 text-[10px] font-medium text-[#534AB7]">{e.breathwork_minutes} min</span>
                    )}
                    {e.session_duration_minutes > 0 && <span className="ml-auto text-[10px] text-neutral-400">{e.session_duration_minutes} min</span>}
                  </div>
                  {e.notes && <div className="border-t border-neutral-100 bg-neutral-50 px-3 py-2 text-sm leading-relaxed text-neutral-600 whitespace-pre-line">{e.notes}</div>}
                </article>
              </div>
            );
          })
        )}
      </section>

      <div className="px-0">
        <BottomNav />
      </div>
    </main>
  );
}
