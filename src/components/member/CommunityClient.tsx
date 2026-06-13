"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";

type GoalRow = { label: string; pct: number; pace: string };

type MemberRow = {
  id: string;
  full_name: string;
  streak: number;
  loggedToday: boolean;
  loggedThisMonth: number;
  goals: GoalRow[];
};

function barColor(pace: string, pct: number) {
  if (pct >= 100) return "bg-green-500";
  if (pace === "on_track") return "bg-green-500";
  if (pace === "at_risk") return "bg-amber-400";
  return "bg-red-400";
}

function pctColor(pace: string, pct: number) {
  if (pct >= 100 || pace === "on_track") return "text-green-600";
  if (pace === "at_risk") return "text-amber-600";
  return "text-red-500";
}

export default function CommunityClient({
  rows,
  month,
  monthLabel,
  memberCount,
  isCurrentMonth,
}: {
  rows: MemberRow[];
  month: string;
  monthLabel: string;
  memberCount: number;
  isCurrentMonth: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <header className="border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.04em] text-neutral-900">Community</p>
            <p className="text-xs text-neutral-400 mt-0.5">{memberCount} members</p>
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => router.push(`/community?month=${e.target.value}`)}
            className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs text-neutral-700"
          />
        </div>
        <p className="text-xs text-neutral-500 mt-1">{monthLabel} · sorted by most active</p>
      </header>

      <section className="px-4 pt-3 space-y-2">
        {rows.map((m, idx) => {
          const isOpen = expanded === m.id;
          return (
            <div key={m.id} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              {/* Main row */}
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : m.id)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left"
              >
                <span className="w-4 shrink-0 text-center text-[11px] font-semibold text-neutral-300">{idx + 1}</span>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[11px] font-semibold text-white">
                  {getInitials(m.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{m.full_name}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{m.loggedThisMonth} days logged</p>
                </div>
                {isCurrentMonth && (
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-sm font-semibold text-neutral-800">🔥 {m.streak}</span>
                    {m.loggedToday && (
                      <span className="text-[10px] font-medium text-green-600">✓ today</span>
                    )}
                  </div>
                )}
                <div className={`flex items-center justify-center h-6 w-6 rounded-full shrink-0 transition-colors ${isOpen ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"}`}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d={isOpen ? "M2 7l3-3 3 3" : "M2 3l3 3 3-3"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>

              {/* Expanded goals */}
              {isOpen && (
                <div className="border-t border-neutral-100 px-4 py-3 space-y-2.5">
                  {m.goals.length === 0 ? (
                    <p className="text-xs text-neutral-400">No goals set for this month.</p>
                  ) : (
                    m.goals.map((g, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-neutral-700">{g.label}</span>
                          <span className={`text-xs font-bold ${pctColor(g.pace, g.pct)}`}>{g.pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className={`h-full rounded-full ${barColor(g.pace, g.pct)}`}
                            style={{ width: `${g.pct}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-400">No members yet.</p>
        )}
      </section>
    </>
  );
}
