"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/home", label: "Home" },
  { href: "/progress", label: "Progress" },
  { href: "/journal", label: "Journal" }
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="mx-auto max-w-[420px] grid grid-cols-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={`py-3 text-center text-sm ${pathname === item.href ? "font-semibold" : "text-neutral-500"}`}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
