"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Logging habit" },
  { href: "/admin/activity-summary", label: "Activity summary" },
  { href: "/admin/members", label: "All members" },
  { href: "/admin/member-logs", label: "Member logs" },
  { href: "/admin/activity-inbox", label: "Activity inbox" },
  { href: "/admin/allowed-emails", label: "Access control" }
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r p-4 space-y-2">
        <h2 className="font-semibold mb-4">Hard Things Club</h2>
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
        <p className="text-xs text-neutral-500 pt-6">Kaushal - Coach</p>
      </aside>
      <main className="p-6 bg-neutral-50">{children}</main>
    </div>
  );
}
