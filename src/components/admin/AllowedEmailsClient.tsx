"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AllowedEmail = {
  id: string;
  email: string;
  full_name: string | null;
  role: "member" | "admin";
  created_at: string;
};

type EditState = { name: string; email: string; password: string };

export default function AllowedEmailsClient({ initial }: { initial: AllowedEmail[] }) {
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]     = useState<"member" | "admin">("member");
  const [errorText, setErrorText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: "", email: "", password: "" });
  const [editError, setEditError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onAdd = async () => {
    if (!email.trim() || !password.trim()) return;
    setErrorText("");
    const res = await fetch("/api/admin/allowed-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, full_name: name || null, password, role }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setErrorText(json?.error || "Could not save user"); return; }
    setName(""); setEmail(""); setPassword("");
    startTransition(() => router.refresh());
  };

  const startEdit = (item: AllowedEmail) => {
    setEditingId(item.id);
    setEditState({ name: item.full_name || "", email: item.email, password: "" });
    setEditError("");
  };

  const onSaveEdit = async (id: string) => {
    setEditError("");
    const body: Record<string, string> = { id };
    if (editState.name.trim()) body.full_name = editState.name.trim();
    if (editState.email.trim()) body.email = editState.email.trim();
    if (editState.password.trim()) body.password = editState.password.trim();

    const res = await fetch("/api/admin/allowed-emails", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setEditError(json?.error || "Could not save"); return; }
    setEditingId(null);
    startTransition(() => router.refresh());
  };

  const onDelete = async (id: string) => {
    await fetch(`/api/admin/allowed-emails?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px]">
          <label className="text-xs font-medium text-neutral-600">Full name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" placeholder="Rahul Sharma" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-neutral-600">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" placeholder="member@example.com" />
        </div>
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-neutral-600">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" placeholder="Min 6 characters" />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as "member" | "admin")}
            className="mt-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="button" onClick={onAdd} disabled={pending}
          className="h-9 rounded-lg bg-black px-4 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "Saving..." : "Add member"}
        </button>
      </div>
      {errorText && <p className="text-xs text-red-600">{errorText}</p>}

      {/* Members table */}
      <div className="rounded-xl border border-neutral-200">
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
          Members ({initial.length})
        </div>
        {initial.length === 0 ? (
          <div className="px-4 py-3 text-sm text-neutral-500">No members yet.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {initial.map((item) => (
              <div key={item.id}>
                {/* Normal row */}
                {editingId !== item.id && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{item.full_name || <span className="italic text-neutral-400">No name</span>}</p>
                      <p className="text-xs text-neutral-500">{item.email} · {item.role}</p>
                    </div>
                    <button onClick={() => startEdit(item)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => onDelete(item.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                )}
                {/* Inline edit form */}
                {editingId === item.id && (
                  <div className="bg-neutral-50 px-4 py-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Full name</label>
                        <input type="text" value={editState.name}
                          onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">Email</label>
                        <input type="email" value={editState.email}
                          onChange={(e) => setEditState((s) => ({ ...s, email: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-[0.07em] text-neutral-400">New password <span className="normal-case font-normal">(leave blank to keep)</span></label>
                        <input type="password" value={editState.password} placeholder="Leave blank to keep"
                          onChange={(e) => setEditState((s) => ({ ...s, password: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
                      </div>
                    </div>
                    {editError && <p className="text-xs text-red-600">{editError}</p>}
                    <div className="flex items-center gap-2">
                      <button onClick={() => onSaveEdit(item.id)}
                        className="rounded-lg bg-black px-4 py-1.5 text-xs font-medium text-white">Save</button>
                      <button onClick={() => setEditingId(null)}
                        className="rounded-lg border border-neutral-200 px-4 py-1.5 text-xs text-neutral-500">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
