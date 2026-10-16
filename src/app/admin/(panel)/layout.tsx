import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, LogOut, ArrowRight } from "lucide-react";
import { getSessionUserId } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { ensureAdmin } from "@/lib/auth/guard";
import { logoutAction } from "@/lib/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUserId();
  if (session === null) redirect("/admin/login");

  const db = getDb();
  const admin = await ensureAdmin(db, session);
  if (!admin.ok) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="clay mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#2563eb,#8b5cf6)]">
              <ShieldCheck className="size-5 text-white" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-black">داشبورد مدیریت لیگ</h1>
              <p className="text-xs text-[var(--text-muted)]">
                {admin.user.displayName} — دسترسی کامل مدیر
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ArrowRight className="size-4" aria-hidden />
                نمای عمومی
              </Link>
            </Button>
            <form action={logoutAction}>
              <Button type="submit" variant="danger" size="sm">
                <LogOut className="size-4" aria-hidden />
                خروج
              </Button>
            </form>
          </div>
        </div>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
