import Link from "next/link";
import { Crown, ShieldCheck } from "lucide-react";
import { TOURNAMENT_NAME, TOURNAMENT_SUBTITLE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_55%,transparent)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Crown className="size-4 text-gold" aria-hidden />
          <p className="text-sm font-bold">
            {TOURNAMENT_NAME} — {TOURNAMENT_SUBTITLE}
          </p>
        </div>
        <p className="max-w-md text-xs leading-6 text-[var(--text-faint)]">
          پلتفرم رسمی مسابقات خصوصی کلش رویال؛ تمام نتایج به‌صورت خودکار محاسبه و
          ثبت می‌شود. زمان‌بندی مسابقات بر اساس وقت تهران است.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <Link href="/rules" className="font-bold text-royal-light hover:underline">
            آیین‌نامه رسمی
          </Link>
          <Link href="/admin/login" className="flex items-center gap-1 text-[var(--text-faint)] hover:text-[var(--text-muted)]">
            <ShieldCheck className="size-3.5" aria-hidden />
            ورود مدیر
          </Link>
        </div>
      </div>
    </footer>
  );
}
