"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PROGRAMME_MONTHS } from "@/lib/utils";

type Member = { id: string; full_name: string };

function buildHref(id: string, monthKey: string) {
  return `/admin/member-logs?id=${encodeURIComponent(id)}&month=${encodeURIComponent(monthKey)}`;
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900"
      aria-hidden
    />
  );
}

export default function MemberLogsToolbar({
  members,
  selectedId,
  monthKey
}: {
  members: Member[];
  selectedId: string;
  monthKey: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localId, setLocalId] = useState(selectedId);
  const [localMonth, setLocalMonth] = useState(monthKey);

  useEffect(() => {
    setLocalId(selectedId);
    setLocalMonth(monthKey);
  }, [selectedId, monthKey]);

  const navigate = (id: string, mKey: string) => {
    setLocalId(id);
    setLocalMonth(mKey);
    startTransition(() => {
      router.push(buildHref(id, mKey));
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {pending ? <Spinner /> : null}
      <select
        aria-label="Select member"
        value={localId}
        onChange={(e) => navigate(e.target.value, localMonth)}
        className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm"
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name}
          </option>
        ))}
      </select>
      <select
        aria-label="Select month"
        value={localMonth}
        onChange={(e) => navigate(localId, e.target.value)}
        className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm"
      >
        {PROGRAMME_MONTHS.map((m) => {
          const value = `${m.year}-${String(m.month).padStart(2, "0")}`;
          return (
            <option key={value} value={value}>
              {m.label} {m.year}
            </option>
          );
        })}
      </select>
    </div>
  );
}
