"use client";

import { useRouter } from "next/navigation";

export default function MonthPicker({ value }: { value: string }) {
  const router = useRouter();
  return (
    <input
      type="month"
      defaultValue={value}
      className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
      onChange={(e) => router.push(`?month=${e.target.value}`)}
    />
  );
}
