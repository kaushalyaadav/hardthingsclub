"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/home",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 3l9 9" />
        <path d="M9 21V12h6v9" />
        <path d="M3 12v9h18v-9" />
      </svg>
    )
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="9" rx="1" fill={active ? "currentColor" : "none"} />
        <rect x="10" y="7" width="4" height="14" rx="1" fill={active ? "currentColor" : "none"} />
        <rect x="17" y="3" width="4" height="18" rx="1" fill={active ? "currentColor" : "none"} />
      </svg>
    )
  },
  {
    href: "/journal",
    label: "Journal",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" fill={active ? "currentColor" : "none"} />
        <line x1="8" y1="9" x2="16" y2="9" stroke={active ? "white" : "currentColor"} />
        <line x1="8" y1="13" x2="16" y2="13" stroke={active ? "white" : "currentColor"} />
        <line x1="8" y1="17" x2="12" y2="17" stroke={active ? "white" : "currentColor"} />
      </svg>
    )
  },
  {
    href: "/community",
    label: "Community",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="3" fill={active ? "currentColor" : "none"} />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
      </svg>
    )
  }
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-neutral-100 bg-white">
      <div className="mx-auto max-w-[420px] grid grid-cols-4">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 transition-colors ${active ? "text-blue-600" : "text-neutral-400"}`}
            >
              {item.icon(active)}
              <span className={`text-[10px] font-medium tracking-wide ${active ? "text-blue-600" : "text-neutral-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
