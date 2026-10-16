"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  CalendarDays,
  Swords,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/standings", label: "جدول", icon: Trophy },
  { href: "/schedule", label: "برنامه", icon: CalendarDays },
  { href: "/tower-leaders", label: "دژگشا", icon: Swords },
  { href: "/rules", label: "آیین‌نامه", icon: ScrollText },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="bottom-nav fixed inset-x-0 bottom-0 z-40 md:hidden"
      aria-label="ناوبری پایین"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold transition-colors",
                  active
                    ? "text-royal-light"
                    : "text-[var(--text-faint)] active:bg-[var(--row-hover)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-2xl transition-all",
                    active
                      ? "clay-btn bg-[linear-gradient(180deg,var(--surface-2),var(--surface))] text-royal-light"
                      : "",
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
