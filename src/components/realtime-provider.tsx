"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * به‌روزرسانی بلادرنگ با کسب‌وکار سبک (Polling):
 * نسخهٔ داده از سرور خوانده می‌شود و در صورت تغییر، داده‌های صفحه تازه می‌شوند.
 * مناسب محیط Vercel/Serverless — بدون WebSocket درون‌پردازشی.
 */
const POLL_MS = 12_000;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    let knownVersion: number | null = null;

    const tick = async () => {
      try {
        const res = await fetch("/api/data-version", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { version: number };
        if (knownVersion === null) {
          knownVersion = data.version;
          return;
        }
        if (data.version !== knownVersion) {
          knownVersion = data.version;
          if (!stopped) router.refresh();
        }
      } catch {
        /* آفلاین — در تلاش بعدی */
      }
    };

    const interval = setInterval(tick, POLL_MS);
    tick();
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [router]);

  return <>{children}</>;
}
