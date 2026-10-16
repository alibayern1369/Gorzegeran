"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import {
  setSessionCookie,
  clearSessionCookie,
  getSessionUserId,
  isTrustedOrigin,
} from "@/lib/auth/session";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { logAuthEvent } from "@/lib/services/results";
import { headers } from "next/headers";

export interface LoginState {
  error?: string;
  success?: boolean;
}

/** ورود مدیر با محدودیت نرخ و ثبت در گزارش تغییرات */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const db = getDb();

  if (!email || !password) {
    return { error: "ایمیل و رمز عبور الزامی است." };
  }

  const headerList = await headers();
  const origin = headerList.get("origin");
  if (!isTrustedOrigin(origin)) {
    return { error: "درخواست از مبدأ نامعتبر ارسال شده است." };
  }

  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`login:${ip}`);
  if (!limit.allowed) {
    return {
      error: "تعداد تلاش‌های ورود بیش از حد مجاز است؛ لطفاً کمی بعد دوباره تلاش کنید.",
    };
  }

  const users = await db.select().from(s.users).where(eq(s.users.email, email)).limit(1);
  const user = users[0];

  if (!user || !user.isActive) {
    await logAuthEvent(db, "login_failed", email, user?.id ?? null);
    return { error: "ایمیل یا رمز عبور نادرست است." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await logAuthEvent(db, "login_failed", email, user.id);
    return { error: "ایمیل یا رمز عبور نادرست است." };
  }

  await setSessionCookie(user.id);
  await db
    .update(s.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(s.users.id, user.id));
  await logAuthEvent(db, "login_success", email, user.id);
  resetRateLimit(`login:${ip}`);

  return { success: true };
}

/** خروج امن مدیر */
export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/admin/login");
}

/** هدایت پس از ورود موفق */
export async function redirectToAdmin(): Promise<void> {
  const uid = await getSessionUserId();
  if (uid) redirect("/admin");
}
