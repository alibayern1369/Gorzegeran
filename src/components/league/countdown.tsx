"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";

/**
 * شمارش معکوس تا شروع مسابقه — پس از صفر شدن هیچ تغییری در وضعیت مسابقه ایجاد نمی‌شود؛
 * فقط مدیر می‌تواند نتیجه را ثبت کند.
 */
export function Countdown({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (now === null) {
    return <span className="num text-sm text-[var(--text-faint)]">…</span>;
  }

  const diff = target - now;
  if (diff <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--table-header)] px-3 py-1.5 text-xs font-bold text-gold">
        <Clock className="size-3.5" aria-hidden />
        زمان مسابقه فرا رسیده است
      </span>
    );
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  const parts: string[] = [];
  if (days > 0) parts.push(`${toPersianDigits(days)} روز`);
  parts.push(`${toPersianDigits(hours)} ساعت`);
  parts.push(`${toPersianDigits(minutes)} دقیقه`);
  if (days === 0) parts.push(`${toPersianDigits(seconds)} ثانیه`);

  return (
    <span
      className="clay-sm num inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--text-muted)]"
      aria-label={`شمارش معکوس تا شروع: ${parts.join(" و ")}`}
    >
      <Clock className="size-3.5 text-royal-light" aria-hidden />
      {parts.join(" و ")}
    </span>
  );
}
