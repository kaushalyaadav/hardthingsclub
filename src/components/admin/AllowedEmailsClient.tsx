"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AllowedEmail = {
  id: string;
  email: string;
  role: "member" | "admin";
  created_at: string;
};

export default function AllowedEmailsClient({ initial }: { initial: AllowedEmail[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [errorText, setErrorText] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onAdd = async () => {
    if (!email.trim() || !password.trim()) return;
    setErrorText("");
    const res = await fetch("/api/admin/allowed-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrorText(json?.error || "Could not save user");
      return;
    }
    setEmail("");
    setPassword("");
    startTransition(() => router.refresh());
  };

  const onDelete = async (id: string) => {
    await fetch(`/api/admin/allowed-emails?id=${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-medium text-neutral-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="member@example.com"
          />
        </div>
        <div className="min-w-[180px]">
          <label className="text-xs font-medium text-neutral-600">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Set default password"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "member" | "admin")}
            className="mt-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={pending}
          className="h-9 rounded-lg bg-black px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Add email"}
        </button>
      </div>
      {errorText && <p className="text-xs text-red-600">{errorText}</p>}
      <p className="text-xs text-neutral-400">Admin can create or update user credentials here. Existing user passwords will be overwritten.</p>

      <div className="rounded-xl border border-neutral-200">
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
          Allowed emails
        </div>
        {initial.length === 0 ? (
          <div className="px-4 py-3 text-sm text-neutral-500">No emails added yet. Start by adding the 15 cohort members.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-left text-neutral-500">
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Created</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {initial.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-4 py-2 text-sm text-neutral-900">{item.email}</td>
                  <td className="px-4 py-2 text-sm text-neutral-600">{item.role}</td>
                  <td className="px-4 py-2 text-xs text-neutral-400">
                    {new Date(item.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" })}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

