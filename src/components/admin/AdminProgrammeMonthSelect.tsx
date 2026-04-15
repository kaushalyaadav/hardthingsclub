"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PROGRAMME_MONTHS } from "@/lib/utils";

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900"
      aria-hidden
    />
  );
}

/** Instant month change + background navigation (route `loading.tsx` shows progress). */
export default function AdminProgrammeMonthSelect({ basePath, selectedMonth }: { basePath: string; selectedMonth: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(selectedMonth);

  useEffect(() => {
    setValue(selectedMonth);
  }, [selectedMonth]);

  const href = (m: string) => {
    const sep = basePath.includes("?") ? "&" : "?";
    return `${basePath}${sep}month=${encodeURIComponent(m)}`;
  };

  return (
    <div className="flex items-center gap-2">
      {pending ? <Spinner /> : null}
      <select
        aria-label="Programme month"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          startTransition(() => {
            router.push(href(v));
          });
        }}
        className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm"
      >
        {PROGRAMME_MONTHS.map((m) => {
          const opt = `${m.year}-${String(m.month).padStart(2, "0")}`;
          return (
            <option key={opt} value={opt}>
              {m.label} {m.year}
            </option>
          );
        })}
      </select>
    </div>
  );
}
