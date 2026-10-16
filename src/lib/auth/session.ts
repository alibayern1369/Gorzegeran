/**
 * مدیریت نشست مدیر — توکن امضاشدهٔ HMAC در کوکی HttpOnly
 * بدون وابستگی خارجی؛ مناسب Vercel و سرورهای بدون حالت.
 */
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "garz_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // ۱۲ ساعت

export interface SessionPayload {
  /** شناسهٔ کاربر */
  uid: number;
  /** زمان انقضا (میلی‌ثانیه) */
  exp: number;
  /** جلوگیری از بازاستفاده */
  jti: string;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET باید در محیط تولید تنظیم شود (حداقل ۱۶ کاراکتر).");
    }
    return "dev-only-session-secret-change-me";
  }
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createSessionToken(payload: Omit<SessionPayload, "exp" | "jti">): string {
  const full: SessionPayload = {
    ...payload,
    exp: Date.now() + SESSION_TTL_MS,
    jti: randomBytes(8).toString("base64url"),
  };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(body);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (typeof payload.uid !== "number" || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: number): Promise<void> {
  const token = createSessionToken({ uid: userId });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<number | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  return payload?.uid ?? null;
}

/**
 * بررسی هویت مدیر با اطلاعات کامل کاربر.
 * درخواست‌های داده‌ای را فقط برای کاربر فعال می‌پذیرد.
 */
export async function requireAdmin(): Promise<
  { ok: true; userId: number } | { ok: false; userId: null }
> {
  const uid = await getSessionUserId();
  if (uid === null) return { ok: false, userId: null };
  return { ok: true, userId: uid };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

/** بررسی مبدأ درخواست برای محافظت CSRF روی اکشن‌های حساس */
export function isTrustedOrigin(origin: string | null): boolean {
  if (!origin) return true; // درخواست‌های هم‌مبدأ در Server Actions با SameSite=Lax محافظت می‌شوند
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  try {
    const o = new URL(origin);
    if (appUrl) {
      const a = new URL(appUrl);
      return o.host === a.host;
    }
    return true;
  } catch {
    return false;
  }
}
