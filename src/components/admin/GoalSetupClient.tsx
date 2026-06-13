"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabaseBrowser";
import { GOAL_CATEGORIES, GOAL_META, type GoalCategory, type MemberGoal } from "@/lib/types";
import { getInitials } from "@/lib/utils";

type Member = { id: string; full_name: string };

type DraftGoal = {
  _key: string;
  category: GoalCategory;
  target: number;
  unit: string;
  definition: string;
  is_primary: boolean;
  open: boolean;
};

function uid() { return Math.random().toString(36).slice(2); }

function goalFromDb(g: MemberGoal): DraftGoal {
  return {
    _key: uid(),
    category: g.category,
    target: g.target,
    unit: g.unit,
    definition: g.definition ?? "",
    is_primary: g.is_primary,
    open: false,
  };
}

function goalsSignature(drafts: DraftGoal[]) {
  return JSON.stringify(drafts.map((g) => ({
    category: g.category, target: g.target, definition: g.definition, is_primary: g.is_primary,
  })));
}

export default function GoalSetupClient({
  members,
  goalsByMember,
  month,
  currentMonth,
}: {
  members: Member[];
  goalsByMember: Record<string, MemberGoal[]>;
  metricsByMember: Record<string, unknown[]>;
  month: string;
  currentMonth: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(members[0]?.id ?? null);
  const [goalDrafts, setGoalDrafts] = useState<Record<string, DraftGoal[]>>(() => {
    const init: Record<string, DraftGoal[]> = {};
    for (const m of members) init[m.id] = (goalsByMember[m.id] ?? []).map(goalFromDb);
    return init;
  });
  // Track saved signatures per member to detect dirty state
  const [savedSigs, setSavedSigs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const m of members) {
      const drafts = (goalsByMember[m.id] ?? []).map(goalFromDb);
      init[m.id] = goalsSignature(drafts);
    }
    return init;
  });
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const filtered = useMemo(
    () => members.filter((m) => m.full_name.toLowerCase().includes(search.toLowerCase())),
    [members, search]
  );

  const selected = members.find((m) => m.id === selectedId);
  const goals = selectedId ? (goalDrafts[selectedId] ?? []) : [];
  const isPastMonth = month < currentMonth;
  const isDirty = selectedId
    ? goalsSignature(goalDrafts[selectedId] ?? []) !== (savedSigs[selectedId] ?? "")
    : false;

  function setGoals(fn: (prev: DraftGoal[]) => DraftGoal[]) {
    if (!selectedId) return;
    setGoalDrafts((prev) => ({ ...prev, [selectedId]: fn(prev[selectedId] ?? []) }));
  }

  function addGoal() {
    const usedCategories = new Set(goals.map((g) => g.category));
    const next = GOAL_CATEGORIES.find((c) => !usedCategories.has(c)) ?? GOAL_CATEGORIES[0];
    const meta = GOAL_META[next];
    setGoals((prev) => [
      ...prev,
      { _key: uid(), category: next, target: meta.defaultTarget, unit: meta.unit, definition: "", is_primary: prev.length === 0, open: true },
    ]);
  }

  function updateGoal(_key: string, patch: Partial<DraftGoal>) {
    setGoals((prev) =>
      prev.map((g) => {
        if (g._key !== _key) return g;
        const updated = { ...g, ...patch };
        if (patch.category) {
          const meta = GOAL_META[patch.category];
          updated.unit = meta.unit;
          if (!patch.target) updated.target = meta.defaultTarget;
        }
        return updated;
      })
    );
  }

  function removeGoal(_key: string) {
    setGoals((prev) => prev.filter((g) => g._key !== _key));
  }

  function makePrimary(_key: string) {
    setGoals((prev) => prev.map((g) => ({ ...g, is_primary: g._key === _key })));
  }

  async function suggestGoals() {
    if (!selectedId) return;
    setSuggesting(true);
    setSuggestError("");
    try {
      const res = await fetch("/api/admin/suggest-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedId, month }),
      });
      const json = await res.json();
      if (!res.ok) { setSuggestError(json.error || "Failed to generate suggestions"); return; }

      const suggested: DraftGoal[] = json.goals.map((g: any) => ({
        _key: uid(),
        category: g.category as GoalCategory,
        target: g.target,
        unit: g.unit,
        definition: g.definition,
        is_primary: g.is_primary,
        open: true,
      }));
      // Ensure exactly one primary
      const hasPrimary = suggested.some((g) => g.is_primary);
      if (!hasPrimary && suggested.length > 0) suggested[0].is_primary = true;
      setGoalDrafts((prev) => ({ ...prev, [selectedId]: suggested }));
    } catch (e: any) {
      setSuggestError(e.message || "Request failed");
    } finally {
      setSuggesting(false);
    }
  }

  async function save() {
    if (!selectedId || !isDirty) return;
    setSaving(true);
    const supabase = createClient();
    const monthDate = `${month}-01`;

    await supabase.from("member_goals").delete().eq("member_id", selectedId).eq("month", monthDate);
    if (goals.length > 0) {
      await supabase.from("member_goals").insert(
        goals.map((g) => ({
          member_id: selectedId,
          month: monthDate,
          category: g.category,
          goal_type: GOAL_META[g.category].type,
          target: g.target,
          unit: g.unit,
          definition: g.definition || null,
          coach_note: null,
          is_primary: g.is_primary,
        }))
      );
    }

    // Mark as saved
    setSavedSigs((prev) => ({ ...prev, [selectedId]: goalsSignature(goalDrafts[selectedId] ?? []) }));
    setSaving(false);
    setToast(`Saved goals for ${selected?.full_name}`);
    setTimeout(() => setToast(""), 3000);
  }

  const firstName = (name: string) => name.split(" ")[0];

  return (
    <div className="flex gap-0 h-full min-h-[600px]">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm text-white shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Left panel */}
      <div className="w-64 shrink-0 border-r border-neutral-200 bg-white flex flex-col">
        <div className="p-3 border-b border-neutral-100">
          <input type="text" placeholder="Search members…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map((m) => {
            const gCount = (goalDrafts[m.id] ?? []).length;
            const active = m.id === selectedId;
            const memberDirty = goalsSignature(goalDrafts[m.id] ?? []) !== (savedSigs[m.id] ?? "");
            return (
              <button key={m.id} onClick={() => setSelectedId(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${active ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"}`}>
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${active ? "bg-white text-neutral-900" : "bg-neutral-100 text-neutral-700"}`}>
                  {getInitials(m.full_name)}
                </div>
                <span className="text-sm font-medium truncate flex-1">{m.full_name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {memberDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Unsaved changes" />}
                  {gCount > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-amber-400 text-neutral-900" : "bg-amber-100 text-amber-700"}`}>
                      {gCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">Select a member</div>
        ) : (
          <div className="p-6 space-y-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">{selected.full_name}</h2>
                <p className="text-xs text-neutral-400">
                  {month}{isPastMonth && <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">Past month · read only</span>}
                </p>
              </div>
              {!isPastMonth && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={suggestGoals}
                    disabled={suggesting}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    {suggesting ? "Loading…" : "✦ Suggest goals"}
                  </button>
                  <button
                    onClick={save}
                    disabled={saving || !isDirty}
                    className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
                      isDirty
                        ? "bg-black text-white hover:bg-neutral-800"
                        : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    {saving ? "Saving…" : isDirty ? "Save goals" : "Saved"}
                  </button>
                </div>
              )}
            </div>

            {suggestError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {suggestError}
              </div>
            )}

            {/* Goals */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">Goals</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400 inline-block" /> running total</span>
                    <span className="ml-3 inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400 inline-block" /> days counter</span>
                  </p>
                </div>
                <span className="text-xs text-neutral-400">{goals.length}/3</span>
              </div>

              {goals.map((g, idx) => {
                const meta = GOAL_META[g.category];
                const typeColor = meta.type === "cumulative" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700";

                // ── Read-only card for past months ──
                if (isPastMonth) {
                  return (
                    <div key={g._key} className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${g.is_primary ? "bg-amber-400 text-white" : "bg-neutral-200 text-neutral-500"}`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-neutral-900 flex-1">{meta.label}</span>
                        {g.is_primary && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">Primary</span>}
                        <span className="text-[11px] text-neutral-500">{g.target} {g.unit}</span>
                      </div>
                      {g.definition && (
                        <p className="text-[11px] text-neutral-500 pl-8">{g.definition}</p>
                      )}
                    </div>
                  );
                }

                // ── Editable card for current month ──
                return (
                  <div key={g._key} className="rounded-xl border border-neutral-200 overflow-hidden">
                    <button type="button" onClick={() => updateGoal(g._key, { open: !g.open })}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50">
                      <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${g.is_primary ? "bg-amber-400 text-white" : "bg-neutral-100 text-neutral-500"}`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-neutral-900 flex-1">{meta.label}</span>
                      {g.is_primary && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">Primary</span>}
                      <span className="text-[11px] text-neutral-400">{g.target} {g.unit}</span>
                      <span className="text-neutral-400">{g.open ? "∧" : "∨"}</span>
                    </button>

                    {g.open && (
                      <div className="border-t border-neutral-100 px-4 py-4 space-y-4">
                        <div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${typeColor}`}>
                            {meta.type === "cumulative" ? "Running total" : "Days counter"} — {meta.typeDesc}
                          </span>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Category</label>
                          <select value={g.category} onChange={(e) => updateGoal(g._key, { category: e.target.value as GoalCategory })}
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                            {GOAL_CATEGORIES.map((c) => (
                              <option key={c} value={c} disabled={goals.some((gg) => gg._key !== g._key && gg.category === c)}>
                                {GOAL_META[c].label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Target</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min={1} value={g.target}
                              onChange={(e) => updateGoal(g._key, { target: Number(e.target.value) })}
                              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                            <span className="text-sm text-neutral-400 whitespace-nowrap">{g.unit}</span>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">
                            Definition <span className="normal-case font-normal tracking-normal text-neutral-300">— shown to {firstName(selected.full_name)}</span>
                          </label>
                          <textarea rows={2} value={g.definition}
                            onChange={(e) => updateGoal(g._key, { definition: e.target.value })}
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                            placeholder={`e.g. "Protein > 120g. All sources count."`} />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button type="button" onClick={() => removeGoal(g._key)}
                            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:border-red-200 hover:text-red-500">
                            Remove
                          </button>
                          {!g.is_primary && (
                            <button type="button" onClick={() => makePrimary(g._key)}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-600">
                              Make primary
                            </button>
                          )}
                          <button type="button" onClick={() => updateGoal(g._key, { open: false })}
                            className="ml-auto rounded-lg bg-black px-3 py-1.5 text-xs text-white">
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isPastMonth && goals.length < 3 && (
                <button type="button" onClick={addGoal}
                  className="w-full rounded-xl border-2 border-dashed border-neutral-200 py-3 text-sm text-neutral-400 hover:border-neutral-300 hover:text-neutral-600">
                  + Add a goal
                </button>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
