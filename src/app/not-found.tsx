import Link from "next/link";
import { SearchX, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-16 text-center">
      <span className="clay flex size-24 items-center justify-center rounded-[2rem] bg-[linear-gradient(145deg,#2563eb,#8b5cf6)]">
        <SearchX className="size-10 text-white" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-black">صفحه یافت نشد</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
        مسیری که دنبال آن هستید وجود ندارد یا جابه‌جا شده است.
      </p>
      <Link
        href="/"
        className="clay-btn mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#3b82f6,#2563eb)] px-7 font-bold text-white"
      >
        <Home className="size-4" aria-hidden />
        بازگشت به خانه
      </Link>
    </div>
  );
}
