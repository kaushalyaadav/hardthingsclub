"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";

const links = [
  { href: "/admin", label: "Logging habit" },
  { href: "/admin/goals", label: "Goal setup ✦" },
  { href: "/admin/activity-summary", label: "Activity summary" },
  { href: "/admin/members", label: "All members" },
  { href: "/admin/member-logs", label: "Member logs" },
  { href: "/admin/activity-inbox", label: "Activity inbox" },
  { href: "/admin/allowed-emails", label: "Access control" }
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await createClient().auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <img src="/htc-logo.jpg" alt="" className="h-7 w-7 rounded-lg object-cover" />
          <h2 className="font-semibold">Hard Things Club</h2>
        </div>
        <div className="space-y-2 flex-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-2 py-2 text-sm ${
                pathname === link.href ? "bg-black text-white font-medium" : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="pt-4 border-t border-neutral-100 space-y-2">
          <p className="text-xs text-neutral-500">Kaushal - Coach</p>
          <button
            onClick={logout}
            className="w-full rounded-md px-2 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-100"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="p-6 bg-neutral-50">{children}</main>
    </div>
  );
}
