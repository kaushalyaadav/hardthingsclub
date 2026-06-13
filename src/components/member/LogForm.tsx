"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";
import { SESSION_TYPES, SessionType, MemberGoal, GoalProgress, GOAL_META } from "@/lib/types";

type Props = {
  userId: string;
  entryDate: string;
  goals: MemberGoal[];
  goalProgress: GoalProgress[];
  initial?: {
    id?: string;
    session_types: SessionType[];
    session_duration_minutes: number;
    breathwork_minutes: number;
    notes: string;
    km: number | null;
    nutrition: boolean | null;
    sleep_goal: boolean | null;
  };
};

const STRENGTH_TYPES = ["Push", "Pull", "Legs"] as const;

export default function LogForm({ userId, entryDate, goals, goalProgress, initial }: Props) {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>(initial?.session_types ?? []);
  const [duration, setDuration] = useState<number | "">(initial?.session_duration_minutes ?? "");
  const [breathwork, setBreathwork] = useState<number | "">(initial?.breathwork_minutes ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [km, setKm] = useState<number | "">(initial?.km ?? "");
  const [nutrition, setNutrition] = useState<boolean | null>(initial?.nutrition ?? null);
  const [sleepGoal, setSleepGoal] = useState<boolean | null>(initial?.sleep_goal ?? null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const isRest = useMemo(() => sessionTypes.includes("Rest"), [sessionTypes]);
  const hasRun = sessionTypes.includes("Run");
  const hasStrength = sessionTypes.some((t) => STRENGTH_TYPES.includes(t as typeof STRENGTH_TYPES[number]));
  const hasMobility = sessionTypes.includes("Mobility");

  const hasMileageGoal = goals.some((g) => g.category === "monthly_mileage");
  const hasNutritionGoal = goals.some((g) => g.category === "nutrition_days");
  const hasSleepGoal = goals.some((g) => g.category === "sleep_days");
  const hasMindfulnessGoal = goals.some((g) => g.category === "mindfulness_days");

  const nutritionGoal = goals.find((g) => g.category === "nutrition_days");
  const sleepGoalMeta = goals.find((g) => g.category === "sleep_days");

  const mileageProgress = goalProgress.find((gp) => gp.goal.category === "monthly_mileage");

  const toggleType = (type: SessionType) => {
    if (type === "Rest") {
      setSessionTypes((prev) => (prev.includes("Rest") ? [] : ["Rest"]));
      setDuration("");
      return;
    }
    setSessionTypes((prev) => {
      const withoutRest = prev.filter((t) => t !== "Rest");
      return withoutRest.includes(type) ? withoutRest.filter((t) => t !== type) : [...withoutRest, type];
    });
  };

  // Auto-feed pills: what selected sessions will count toward
  const autoPills = useMemo(() => {
    const pills: { label: string; color: string }[] = [];
    if (hasRun) {
      pills.push({ label: "Running days +1", color: "bg-green-100 text-green-700" });
      if (hasMileageGoal) pills.push({ label: "Monthly mileage +km", color: "bg-amber-100 text-amber-700" });
    }
    if (hasStrength) {
      pills.push({ label: "Workout days +1", color: "bg-blue-100 text-blue-700" });
      pills.push({ label: "Strength sessions +1", color: "bg-blue-100 text-blue-700" });
    }
    if (hasMobility) {
      pills.push({ label: "Mobility sessions +1", color: "bg-purple-100 text-purple-700" });
      pills.push({ label: "Recovery days +1", color: "bg-purple-100 text-purple-700" });
    }
    return pills;
  }, [hasRun, hasStrength, hasMobility, hasMileageGoal]);

  const top3Goals = goalProgress.slice(0, 3);
  const extraGoalCount = Math.max(0, goalProgress.length - 3);

  const onSave = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("log_entries").upsert(
      {
        id: initial?.id,
        user_id: userId,
        entry_date: entryDate,
        session_types: sessionTypes,
        session_duration_minutes: isRest ? 0 : (duration === "" ? 0 : duration),
        breathwork_minutes: breathwork === "" ? 0 : breathwork,
        notes,
        km: (hasRun && hasMileageGoal && km !== "") ? Number(km) : null,
        nutrition: hasNutritionGoal ? nutrition : null,
        sleep_goal: hasSleepGoal ? sleepGoal : null,
      },
      { onConflict: "user_id,entry_date" }
    );
    setSaving(false);
    router.push("/home");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Goal progress banner */}
      {top3Goals.length > 0 && (
        <div className="rounded-xl bg-neutral-900 p-4 space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">This month&apos;s goals</p>
          {top3Goals.map((gp) => {
            const pctColor = gp.pace === "on_track" ? "#22c55e" : gp.pace === "at_risk" ? "#f59e0b" : "#ef4444";
            return (
              <div key={gp.goal.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-neutral-200">{GOAL_META[gp.goal.category].label}</span>
                  <span className="text-xs font-semibold" style={{ color: pctColor }}>{gp.current} / {gp.goal.target} {gp.goal.unit}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-neutral-700">
                  <div className="h-full rounded-full transition-all" style={{ width: `${gp.pct}%`, backgroundColor: pctColor }} />
                </div>
              </div>
            );
          })}
          {extraGoalCount > 0 && (
            <p className="text-[11px] text-neutral-500">+ {extraGoalCount} more goal{extraGoalCount > 1 ? "s" : ""} updating from this log</p>
          )}
        </div>
      )}

      {/* Session type chips */}
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">
          Session type <span className="normal-case tracking-normal text-neutral-300">· select all that apply</span>
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {SESSION_TYPES.map((type) => {
            const active = sessionTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`rounded-lg border py-2 text-[12px] font-medium ${
                  type === "Rest"
                    ? active
                      ? "border-neutral-400 bg-neutral-100 text-neutral-700"
                      : "border-dashed border-neutral-300 text-neutral-400"
                    : active
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 text-neutral-400"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        {/* Auto-feed pills */}
        {autoPills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {autoPills.map((pill, i) => (
              <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${pill.color}`}>
                {pill.label}
              </span>
            ))}
          </div>
        )}

        {isRest && (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-300" />
            <p className="text-[11px] leading-relaxed text-neutral-500">
              Rest day logged. This won&apos;t count as a movement day but your logging streak stays alive.
            </p>
          </div>
        )}
      </div>

      {/* km input — only when Run selected AND mileage goal exists */}
      {hasRun && hasMileageGoal && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-amber-700">How many km did you run?</p>
            <p className="text-[11px] text-amber-600">
              Feeds monthly mileage · currently {mileageProgress?.current ?? 0} of {mileageProgress?.goal.target ?? "?"} km
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={0.1}
              placeholder="0.0"
              value={km}
              onChange={(e) => setKm(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-neutral-900"
            />
            <span className="text-sm text-amber-600">km</span>
          </div>
        </div>
      )}

      {!isRest && (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Session duration</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
            />
            <span className="text-sm text-neutral-400">min</span>
          </div>
        </div>
      )}

      {/* Breathwork */}
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">
          Breathwork
          {hasMindfulnessGoal && (
            <span className="ml-1.5 normal-case tracking-normal font-normal text-purple-400">→ mindfulness days</span>
          )}
        </p>
        <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-neutral-900">Duration today</p>
            <p className="text-[11px] text-neutral-300">Enter 0 if skipped</p>
          </div>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={breathwork}
            onChange={(e) => setBreathwork(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-16 rounded-lg border border-neutral-200 px-2 py-2 text-center text-sm text-neutral-900"
          />
        </div>
      </div>

      {/* Nutrition yes/no */}
      {hasNutritionGoal && (
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Nutrition today</p>
          {nutritionGoal?.definition && (
            <p className="mb-2 text-[11px] text-neutral-500">{nutritionGoal.definition}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNutrition(true)}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                nutrition === true ? "border-green-500 bg-green-500 text-white" : "border-neutral-200 text-neutral-500"
              }`}
            >
              ✓ Yes
            </button>
            <button
              type="button"
              onClick={() => setNutrition(false)}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                nutrition === false ? "border-red-400 bg-red-400 text-white" : "border-neutral-200 text-neutral-500"
              }`}
            >
              ✗ No
            </button>
          </div>
        </div>
      )}

      {/* Sleep yes/no */}
      {hasSleepGoal && (
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Sleep goal today</p>
          {sleepGoalMeta?.definition && (
            <p className="mb-2 text-[11px] text-neutral-500">{sleepGoalMeta.definition}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSleepGoal(true)}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                sleepGoal === true ? "border-green-500 bg-green-500 text-white" : "border-neutral-200 text-neutral-500"
              }`}
            >
              ✓ Yes
            </button>
            <button
              type="button"
              onClick={() => setSleepGoal(false)}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                sleepGoal === false ? "border-red-400 bg-red-400 text-white" : "border-neutral-200 text-neutral-500"
              }`}
            >
              ✗ No
            </button>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Notes & message to Kaushal</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm leading-relaxed text-neutral-900"
          placeholder={
            isRest
              ? "How are you feeling?\nWhy the rest day?\nAnything Kaushal should know?"
              : "How was the workout?\nAny struggles today?\nAny highlights or wins?\nAnything you need help with?"
          }
        />
      </div>

      <button disabled={saving} onClick={onSave} className="w-full rounded-xl bg-black py-3 text-sm font-bold text-white">
        {saving ? "Saving..." : "Save log"}
      </button>
      <p className="text-center text-[11px] text-neutral-300">Private — only visible to you and Kaushal</p>
    </div>
  );
}
