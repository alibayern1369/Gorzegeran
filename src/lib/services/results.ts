/**
 * سرویس‌های مدیریت نتایج — منطق تراکنشی ثبت/ویرایش/حذف نتیجه
 * آمارها هرگز تجمعی افزایش نمی‌یابند؛ همیشه از رکورد مسابقات بازمحاسبه می‌شوند.
 */
import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { determineWinner, scorePairSchema } from "@/lib/engine/scoring";
import { bumpDataVersion } from "@/lib/queries";
import type { MatchStatus } from "@/lib/engine/types";

export interface ResultInput {
  matchId: number;
  towersA: number;
  towersB: number;
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export class ServiceError extends Error {}

async function getMatchForUpdate(db: AppDatabase, matchId: number): Promise<s.Match> {
  const rows = await db.select().from(s.matches).where(eq(s.matches.id, matchId)).limit(1);
  const match = rows[0];
  if (!match) throw new ServiceError("مسابقه یافت نشد.");
  return match;
}

function validateScores(input: ResultInput): { winnerIsA: boolean } {
  const parsed = scorePairSchema.safeParse({
    towersA: input.towersA,
    towersB: input.towersB,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ServiceError(issue?.message ?? "نتیجهٔ واردشده نامعتبر است.");
  }
  const winner = determineWinner(input.towersA, input.towersB);
  if (!winner.ok) throw new ServiceError(winner.error);
  return { winnerIsA: winner.winnerIsA };
}

/**
 * ثبت نتیجهٔ مسابقهٔ زمان‌بندی‌شده — رد کردن ثبت تکراری
 */
export async function recordResult(
  db: AppDatabase,
  userId: number | null,
  input: ResultInput,
): Promise<ServiceResult<{ matchId: number; winnerId: number }>> {
  try {
    const { winnerIsA } = validateScores(input);

    return await db.transaction(async (tx) => {
      const match = await getMatchForUpdate(tx, input.matchId);
      if (match.status === "cancelled") {
        throw new ServiceError("برای مسابقهٔ لغوشده نمی‌توان نتیجه ثبت کرد.");
      }
      if (match.status === "completed" || match.towersA !== null) {
        throw new ServiceError(
          "نتیجهٔ این مسابقه قبلاً ثبت شده است؛ برای تغییر از ویرایش نتیجه استفاده کنید.",
        );
      }

      const winnerId = winnerIsA ? match.playerAId : match.playerBId;

      await tx
        .update(s.matches)
        .set({
          towersA: input.towersA,
          towersB: input.towersB,
          winnerId,
          status: "completed",
          resultRecordedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(s.matches.id, match.id));

      await tx.insert(s.matchResults).values({
        matchId: match.id,
        towersA: input.towersA,
        towersB: input.towersB,
        winnerId,
        recordedBy: userId,
      });

      await tx.insert(s.auditLogs).values({
        userId,
        action: "result_recorded",
        entityType: "match",
        entityId: match.id,
        previousValue: null,
        newValue: { towersA: input.towersA, towersB: input.towersB, winnerId },
      });

      await bumpDataVersion(tx);
      return { ok: true, data: { matchId: match.id, winnerId } };
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof ServiceError ? err.message : "خطا در ثبت نتیجه.",
    };
  }
}

/**
 * ویرایش نتیجهٔ ثبت‌شده — بازمحاسبهٔ کامل آمار از رکورد مسابقات انجام می‌شود
 */
export async function updateResult(
  db: AppDatabase,
  userId: number | null,
  input: ResultInput,
): Promise<ServiceResult<{ matchId: number; winnerId: number }>> {
  try {
    const { winnerIsA } = validateScores(input);

    return await db.transaction(async (tx) => {
      const match = await getMatchForUpdate(tx, input.matchId);
      if (match.status !== "completed" || match.towersA === null) {
        throw new ServiceError("برای این مسابقه هنوز نتیجه‌ای ثبت نشده است.");
      }

      const winnerId = winnerIsA ? match.playerAId : match.playerBId;
      const previous = {
        towersA: match.towersA,
        towersB: match.towersB,
        winnerId: match.winnerId,
      };

      await tx
        .update(s.matches)
        .set({
          towersA: input.towersA,
          towersB: input.towersB,
          winnerId,
          updatedAt: new Date(),
        })
        .where(eq(s.matches.id, match.id));

      await tx
        .update(s.matchResults)
        .set({
          towersA: input.towersA,
          towersB: input.towersB,
          winnerId,
          recordedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(s.matchResults.matchId, match.id));

      await tx.insert(s.auditLogs).values({
        userId,
        action: "result_updated",
        entityType: "match",
        entityId: match.id,
        previousValue: previous,
        newValue: { towersA: input.towersA, towersB: input.towersB, winnerId },
      });

      await bumpDataVersion(tx);
      return { ok: true, data: { matchId: match.id, winnerId } };
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof ServiceError ? err.message : "خطا در ویرایش نتیجه.",
    };
  }
}

/** حذف نتیجه (بازگشت به حالت زمان‌بندی‌شده) */
export async function clearResult(
  db: AppDatabase,
  userId: number | null,
  matchId: number,
): Promise<ServiceResult<{ matchId: number }>> {
  try {
    return await db.transaction(async (tx) => {
      const match = await getMatchForUpdate(tx, matchId);
      if (match.towersA === null) {
        throw new ServiceError("برای این مسابقه نتیجه‌ای ثبت نشده است.");
      }
      const previous = {
        towersA: match.towersA,
        towersB: match.towersB,
        winnerId: match.winnerId,
      };

      await tx
        .update(s.matches)
        .set({
          towersA: null,
          towersB: null,
          winnerId: null,
          status: "scheduled",
          resultRecordedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(s.matches.id, match.id));

      await tx.delete(s.matchResults).where(eq(s.matchResults.matchId, match.id));

      await tx.insert(s.auditLogs).values({
        userId,
        action: "result_cleared",
        entityType: "match",
        entityId: match.id,
        previousValue: previous,
        newValue: null,
      });

      await bumpDataVersion(tx);
      return { ok: true as const, data: { matchId } };
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof ServiceError ? err.message : "خطا در حذف نتیجه.",
    };
  }
}

const ALLOWED_STATUSES: MatchStatus[] = [
  "scheduled",
  "live",
  "postponed",
  "cancelled",
];

/** تغییر وضعیت مسابقه (برای مسابقهٔ تکمیل‌شده فقط از مسیر حذف نتیجه) */
export async function setMatchStatus(
  db: AppDatabase,
  userId: number | null,
  matchId: number,
  status: MatchStatus,
): Promise<ServiceResult<{ matchId: number; status: MatchStatus }>> {
  try {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new ServiceError(
        "وضعیت نامعتبر است؛ ثبت وضعیت «برگزار شده» فقط با ثبت نتیجه ممکن است.",
      );
    }
    return await db.transaction(async (tx) => {
      const match = await getMatchForUpdate(tx, matchId);
      if (match.status === "completed" && status !== "scheduled") {
        throw new ServiceError(
          "مسابقهٔ تکمیل‌شده فقط پس از حذف نتیجه قابل تغییر وضعیت است.",
        );
      }
      await tx
        .update(s.matches)
        .set({ status, updatedAt: new Date() })
        .where(eq(s.matches.id, match.id));
      await tx.insert(s.auditLogs).values({
        userId,
        action: "match_status_changed",
        entityType: "match",
        entityId: match.id,
        previousValue: { status: match.status },
        newValue: { status },
      });
      await bumpDataVersion(tx);
      return { ok: true as const, data: { matchId, status } };
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof ServiceError ? err.message : "خطا در تغییر وضعیت.",
    };
  }
}

/** ثبت گزارش ورود (موفق/ناموفق) */
export async function logAuthEvent(
  db: AppDatabase,
  action: "login_success" | "login_failed",
  email: string,
  userId: number | null = null,
): Promise<void> {
  await db.insert(s.auditLogs).values({
    userId,
    action,
    entityType: "user",
    entityId: userId,
    note: email,
  });
}

export { and as sqlAnd };
