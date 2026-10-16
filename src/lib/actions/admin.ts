"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { requireAdmin, isTrustedOrigin } from "@/lib/auth/session";
import { ensureAdmin } from "@/lib/auth/guard";
import {
  recordResult,
  updateResult,
  clearResult,
  setMatchStatus,
  ServiceError,
} from "@/lib/services/results";
import type { MatchStatus } from "@/lib/engine/types";

export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  /** مقدار فرم برای حفظ وضعیت */
  matchId?: number;
}

async function guard(): Promise<
  { ok: true; userId: number } | { ok: false; state: ActionState }
> {
  const session = await requireAdmin();
  if (!session.ok) {
    return {
      ok: false,
      state: { ok: false, error: "برای انجام این عملیات باید وارد شوید." },
    };
  }
  const db = getDb();
  const admin = await ensureAdmin(db, session.userId);
  if (!admin.ok) {
    return { ok: false, state: { ok: false, error: admin.error } };
  }
  return { ok: true, userId: session.userId };
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

/** ثبت نتیجهٔ مسابقه */
export async function submitResultAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const g = await guard();
  if (!g.ok) return g.state;

  const matchId = Number(formData.get("matchId"));
  const towersA = Number(formData.get("towersA"));
  const towersB = Number(formData.get("towersB"));

  if (!Number.isInteger(matchId) || matchId <= 0) {
    return { ok: false, error: "مسابقهٔ نامعتبر انتخاب شده است.", matchId };
  }
  if (!Number.isInteger(towersA) || !Number.isInteger(towersB)) {
    return {
      ok: false,
      error: "امتیاز برج‌ها باید عدد صحیح باشد.",
      matchId,
    };
  }

  const db = getDb();
  const result = await recordResult(db, g.userId, { matchId, towersA, towersB });
  if (!result.ok) {
    return { ok: false, error: result.error, matchId };
  }

  revalidateAll();
  return {
    ok: true,
    message: "نتیجه با موفقیت ثبت شد و جدول لیگ به‌روزرسانی شد. ✓",
    matchId,
  };
}

/** ویرایش نتیجهٔ ثبت‌شده */
export async function editResultAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const g = await guard();
  if (!g.ok) return g.state;

  const matchId = Number(formData.get("matchId"));
  const towersA = Number(formData.get("towersA"));
  const towersB = Number(formData.get("towersB"));

  if (!Number.isInteger(matchId) || matchId <= 0) {
    return { ok: false, error: "مسابقهٔ نامعتبر انتخاب شده است." };
  }
  if (!Number.isInteger(towersA) || !Number.isInteger(towersB)) {
    return { ok: false, error: "امتیاز برج‌ها باید عدد صحیح باشد.", matchId };
  }

  const db = getDb();
  const result = await updateResult(db, g.userId, { matchId, towersA, towersB });
  if (!result.ok) {
    return { ok: false, error: result.error, matchId };
  }

  revalidateAll();
  return {
    ok: true,
    message: "نتیجه با موفقیت ویرایش شد و تمام آمارها بازمحاسبه شد. ✓",
    matchId,
  };
}

/** حذف نتیجه */
export async function deleteResultAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const g = await guard();
  if (!g.ok) return g.state;

  const matchId = Number(formData.get("matchId"));
  if (!Number.isInteger(matchId) || matchId <= 0) {
    return { ok: false, error: "مسابقهٔ نامعتبر انتخاب شده است." };
  }

  const db = getDb();
  const result = await clearResult(db, g.userId, matchId);
  if (!result.ok) {
    return { ok: false, error: result.error, matchId };
  }

  revalidateAll();
  return {
    ok: true,
    message: "نتیجه حذف شد و مسابقه به حالت زمان‌بندی‌شده بازگشت.",
    matchId,
  };
}

/** تغییر وضعیت مسابقه */
export async function changeMatchStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const g = await guard();
  if (!g.ok) return g.state;

  const matchId = Number(formData.get("matchId"));
  const status = String(formData.get("status")) as MatchStatus;
  if (!Number.isInteger(matchId) || matchId <= 0) {
    return { ok: false, error: "مسابقهٔ نامعتبر انتخاب شده است." };
  }

  const db = getDb();
  const result = await setMatchStatus(db, g.userId, matchId, status);
  if (!result.ok) {
    return { ok: false, error: result.error, matchId };
  }

  revalidateAll();
  return { ok: true, message: "وضعیت مسابقه به‌روزرسانی شد.", matchId };
}

export { ServiceError };
