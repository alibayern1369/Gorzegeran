/**
 * نگهبان مجوز مدیر — بررسی نقش و فعال بودن کاربر در پایگاه داده
 * (لایهٔ دوم؛ پس از بررسی نشست)
 */
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, type AppDatabase } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth/session";

export async function ensureAdmin(
  db: AppDatabase,
  userId: number | null | undefined,
): Promise<{ ok: true; user: s.User } | { ok: false; error: string }> {
  if (userId === null || userId === undefined) {
    return { ok: false, error: "برای انجام این عملیات باید وارد شوید." };
  }
  const rows = await db.select().from(s.users).where(eq(s.users.id, userId)).limit(1);
  const user = rows[0];
  if (!user || user.role !== "admin" || !user.isActive) {
    return { ok: false, error: "دسترسی غیرمجاز؛ فقط مدیر لیگ می‌تواند این عملیات را انجام دهد." };
  }
  return { ok: true, user };
}

/**
 * محافظت صفحهٔ مدیر — باید در ابتدای «هر» صفحهٔ مدیریتی فراخوانی شود.
 * (فقط اتکا به layout کافی نیست؛ صفحات موازی با layout رندر می‌شوند)
 */
export async function requireAdminPage(): Promise<{ userId: number; user: s.User }> {
  const uid = await getSessionUserId();
  if (uid === null) redirect("/admin/login");
  const db = getDb();
  const admin = await ensureAdmin(db, uid);
  if (!admin.ok) redirect("/admin/login");
  return { userId: uid, user: admin.user };
}
