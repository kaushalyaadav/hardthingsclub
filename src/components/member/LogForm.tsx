"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";
import { SESSION_TYPES, SessionType } from "@/lib/types";

type Props = {
  userId: string;
  entryDate: string;
  initial?: {
    id?: string;
    session_types: SessionType[];
    session_duration_minutes: number;
    breathwork_minutes: number;
    notes: string;
  };
};

export default function LogForm({ userId, entryDate, initial }: Props) {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>(initial?.session_types ?? []);
  const [duration, setDuration] = useState(initial?.session_duration_minutes ?? 0);
  const [breathwork, setBreathwork] = useState(initial?.breathwork_minutes ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const isRest = useMemo(() => sessionTypes.includes("Rest"), [sessionTypes]);

  const toggleType = (type: SessionType) => {
    if (type === "Rest") {
      setSessionTypes((prev) => (prev.includes("Rest") ? [] : ["Rest"]));
      setDuration(0);
      return;
    }
    setSessionTypes((prev) => {
      const withoutRest = prev.filter((t) => t !== "Rest");
      return withoutRest.includes(type) ? withoutRest.filter((t) => t !== type) : [...withoutRest, type];
    });
  };

  const onSave = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("log_entries").upsert(
      {
        id: initial?.id,
        user_id: userId,
        entry_date: entryDate,
        session_types: sessionTypes,
        session_duration_minutes: isRest ? 0 : duration,
        breathwork_minutes: breathwork,
        notes
      },
      { onConflict: "user_id,entry_date" }
    );
    setSaving(false);
    router.push("/home");
    router.refresh();
  };

  return (
    <div className="space-y-4">
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
        {isRest && (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-300" />
            <p className="text-[11px] leading-relaxed text-neutral-500">
              Rest day logged. This won&apos;t count as a movement day but your logging streak stays alive.
            </p>
          </div>
        )}
      </div>

      {!isRest && (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Session duration</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
            />
            <span className="text-sm text-neutral-400">min</span>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Breathwork</p>
        <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-neutral-900">Duration today</p>
            <p className="text-[11px] text-neutral-300">Enter 0 if skipped</p>
          </div>
          <input
            type="number"
            min={0}
            value={breathwork}
            onChange={(e) => setBreathwork(Number(e.target.value))}
            className="w-16 rounded-lg border border-neutral-200 px-2 py-2 text-center text-sm text-neutral-900"
          />
        </div>
      </div>

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
