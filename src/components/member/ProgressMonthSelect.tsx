"use client";

import { useRouter } from "next/navigation";
import { PROGRAMME_MONTHS } from "@/lib/utils";

export default function ProgressMonthSelect({ value, currentMonth }: { value: string; currentMonth: string }) {
  const router = useRouter();
  const pastAndCurrent = PROGRAMME_MONTHS.filter((m) => {
    const key = `${m.year}-${String(m.month).padStart(2, "0")}`;
    return key <= currentMonth;
  });

  return (
    <select
      value={value}
      onChange={(e) => router.push(`/progress?month=${e.target.value}`)}
      className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700"
    >
      {pastAndCurrent.map((m) => {
        const key = `${m.year}-${String(m.month).padStart(2, "0")}`;
        return <option key={key} value={key}>{m.label} {m.year}</option>;
      })}
    </select>
  );
}
