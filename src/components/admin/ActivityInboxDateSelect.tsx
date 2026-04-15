"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900"
      aria-hidden
    />
  );
}

export default function ActivityInboxDateSelect({
  dates,
  selectedDate,
  today,
  tab
}: {
  dates: string[];
  selectedDate: string;
  today: string;
  tab: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(selectedDate);

  useEffect(() => {
    setValue(selectedDate);
  }, [selectedDate]);

  return (
    <div className="flex items-center gap-2">
      {pending ? <Spinner /> : null}
      <select
        aria-label="Activity date"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          startTransition(() => {
            router.push(`/admin/activity-inbox?date=${encodeURIComponent(v)}&tab=${encodeURIComponent(tab)}`);
          });
        }}
        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm"
      >
        {dates.map((date) => (
          <option key={date} value={date}>
            {date === today ? `Today, ${date}` : date}
          </option>
        ))}
      </select>
    </div>
  );
}
