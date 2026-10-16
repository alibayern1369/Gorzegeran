"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Crown, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { NAV_LINKS, TOURNAMENT_NAME, TOURNAMENT_SUBTITLE } from "@/lib/constants";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="clay-sm flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#2563eb,#8b5cf6)] shadow-[0_6px_18px_rgba(37,99,235,0.4)]">
            <Crown className="size-5 text-gold-light" aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-extrabold text-[var(--text)]">
              {TOURNAMENT_NAME}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              {TOURNAMENT_SUBTITLE}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="ناوبری اصلی">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-bold transition-colors",
                  active
                    ? "clay-btn text-royal-light"
                    : "text-[var(--text-muted)] hover:bg-[var(--row-hover)] hover:text-[var(--text)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="clay-btn flex size-10 items-center justify-center rounded-2xl text-[var(--text-muted)]"
            aria-label={theme === "dark" ? "تغییر به تم روشن" : "تغییر به تم تیره"}
          >
            {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="clay-btn flex size-10 items-center justify-center rounded-2xl text-[var(--text-muted)] md:hidden"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-[var(--border)] px-4 pb-4 pt-2 md:hidden"
          aria-label="ناوبری موبایل"
        >
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-xl px-4 py-3 text-sm font-bold",
                  active
                    ? "bg-[var(--row-hover)] text-royal-light"
                    : "text-[var(--text-muted)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
