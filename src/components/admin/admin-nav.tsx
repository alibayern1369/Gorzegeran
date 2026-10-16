"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_LINKS } from "@/lib/constants";

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      className="mt-4 flex gap-1.5 overflow-x-auto pb-1"
      aria-label="ناوبری مدیریت"
    >
      {ADMIN_NAV_LINKS.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors",
              active
                ? "clay-btn text-royal-light"
                : "text-[var(--text-muted)] hover:bg-[var(--row-hover)]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
