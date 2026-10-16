"use client";
import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { Button } from "./ui/button";
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function InstallPrompt({ name, icon }: { name: string; icon: string }) {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    if (installed) return;
    let dismissed = false;
    try {
      dismissed =
        Date.now() - Number(localStorage.getItem("pwa-dismissed")) <
        7 * 86400000;
    } catch {}
    const apple =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIos(apple);
    const timer = setTimeout(() => {
      if (!dismissed) setVisible(true);
    }, 4000);
    const before = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      if (!dismissed) setVisible(true);
    };
    const done = () => {
      setVisible(false);
      setEvent(null);
    };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", done);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  if (!visible) return null;
  return (
    <aside
      aria-label="نصب نرم‌افزار"
      className="install-prompt clay fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md p-4 sm:inset-x-auto sm:end-5 sm:bottom-5"
    >
      <div className="flex items-start gap-3">
        <img
          src={icon}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">{name} را روی گوشی نصب کنید</p>
          <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">
            با افزودن به صفحهٔ اصلی، سریع‌تر به لیگ دسترسی داشته باشید.
          </p>
        </div>
        <button
          aria-label="بستن پیام نصب"
          className="shrink-0 p-1"
          onClick={() => {
            setVisible(false);
            try {
              localStorage.setItem("pwa-dismissed", String(Date.now()));
            } catch {}
          }}
        >
          <X className="size-4" />
        </button>
      </div>
      {help && (
        <p role="status" className="my-3 text-sm leading-7">
          {ios ? (
            <>
              از منوی اشتراک‌گذاری <Share2 className="inline size-4" />، گزینهٔ
              «Add to Home Screen / افزودن به صفحهٔ اصلی» را انتخاب کنید.
            </>
          ) : (
            "در منوی مرورگر گزینهٔ «Install app / نصب برنامه» یا «Add to Home screen / افزودن به صفحهٔ اصلی» را انتخاب کنید."
          )}
        </p>
      )}
      <Button
        type="button"
        className="mt-3 w-full"
        onClick={async () => {
          if (!event) {
            setHelp(true);
            return;
          }
          await event.prompt();
          const choice = await event.userChoice;
          setEvent(null);
          if (choice.outcome === "accepted") setVisible(false);
        }}
      >
        <Download className="size-4" />
        {event ? "نصب برنامه" : "افزودن به صفحهٔ اصلی"}
      </Button>
    </aside>
  );
}
