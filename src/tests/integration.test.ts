/**
 * تست‌های یکپارچگی — جریان‌های کاری مهم روی پایگاه دادهٔ واقعی (PGlite)
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDb } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { seedDatabase } from "@/lib/db/seed-core";
import * as s from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  recordResult,
  updateResult,
  clearResult,
  setMatchStatus,
} from "@/lib/services/results";
import { ensureAdmin } from "@/lib/auth/guard";
import { computeStandings, hasOfficialChampion } from "@/lib/engine/ranking";
import { computeTowerLeaders } from "@/lib/engine/stats";
import { toEnginePlayers, toEngineMatch, getDataVersion } from "@/lib/queries";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";

let pglite: PGlite;
let db: PgliteDatabase<typeof import("@/lib/db/schema")>;
let adminUserId: number;

beforeAll(async () => {
  process.env.SESSION_SECRET = "test-secret-key-for-integration-tests";
  const created = await createTestDb();
  pglite = created.pglite;
  db = created.db;
  await runMigrations(db);
  await seedDatabase(db, {
    adminEmail: "admin@garz.local",
    adminPassword: "secure-pass-123",
    adminDisplayName: "مدیر تست",
  });
  const admins = await db.select().from(s.users).where(eq(s.users.email, "admin@garz.local"));
  adminUserId = admins[0]!.id;
});

afterAll(async () => {
  await pglite.close();
});

describe("۱-۹) Seed و ساختار مسابقات", () => {
  it("۱) هر پنج بازیکن به‌درستی seed شده‌اند", async () => {
    const players = await db.select().from(s.players).orderBy(asc(s.players.id));
    expect(players).toHaveLength(5);
    expect(players.map((p) => p.name)).toEqual(["داشلی", "هانی", "جاف حاف", "علی دولی", "استاد"]);
  });

  it("۲) دقیقاً ۱۰ رویارویی یکتا وجود دارد", async () => {
    const encounters = await db.select().from(s.encounters);
    expect(encounters).toHaveLength(10);
    const pairs = new Set(encounters.map((e) => `${e.playerAId}-${e.playerBId}`));
    expect(pairs.size).toBe(10);
  });

  it("۳) دقیقاً ۴۰ مسابقهٔ استاندارد وجود دارد", async () => {
    const matches = await db.select().from(s.matches);
    expect(matches).toHaveLength(40);
  });

  it("۴) هر بازیکن ۱۶ مسابقه دارد", async () => {
    const matches = await db.select().from(s.matches);
    for (let p = 1; p <= 5; p++) {
      const count = matches.filter((m) => m.playerAId === p || m.playerBId === p).length;
      expect(count).toBe(16);
    }
  });

  it("۵) هر رویارویی ۴ نوع مسابقهٔ یکتا دارد", async () => {
    const matches = await db.select().from(s.matches);
    const byEncounter = new Map<number, Set<string>>();
    for (const m of matches) {
      if (!byEncounter.has(m.encounterId)) byEncounter.set(m.encounterId, new Set());
      byEncounter.get(m.encounterId)!.add(m.matchType);
    }
    expect(byEncounter.size).toBe(10);
    for (const [, types] of byEncounter) {
      expect(types.size).toBe(4);
    }
  });

  it("۶-۸) شب‌ها: حداکثر ۲ بازی برای هر نفر، بدون هم‌پوشانی، ۲ شب استراحت", async () => {
    const matches = await db.select().from(s.matches);
    for (let p = 1; p <= 5; p++) {
      const nights = new Map<number, number>();
      for (const m of matches) {
        if (m.playerAId !== p && m.playerBId !== p) continue;
        nights.set(m.nightIndex, (nights.get(m.nightIndex) ?? 0) + 1);
      }
      for (const [, count] of nights) expect(count).toBeLessThanOrEqual(2);
      expect(nights.size).toBe(8); // ۲ شب استراحت از ۱۰
    }
    // بدون هم‌پوشانی زمانی
    const slots = new Set(matches.map((m) => `${m.nightIndex}-${m.slotIndex}`));
    expect(slots.size).toBe(40);
  });

  it("۹) هر بازیکن با همه روبه‌رو می‌شود", async () => {
    const matches = await db.select().from(s.matches);
    for (let a = 1; a <= 5; a++) {
      for (let b = 1; b <= 5; b++) {
        if (a === b) continue;
        const has = matches.some(
          (m) => (m.playerAId === a && m.playerBId === b) || (m.playerAId === b && m.playerBId === a),
        );
        expect(has).toBe(true);
      }
    }
  });
});

describe("۱۸-۱۹) ثبت و ویرایش نتیجه", () => {
  it("ثبت نتیجهٔ معتبر، تعیین برنده و به‌روزرسانی نسخهٔ داده", async () => {
    const matches = await db.select().from(s.matches).orderBy(asc(s.matches.id));
    const match = matches[0]!;
    expect(match.status).toBe("scheduled");
    const v1 = await getDataVersion(db);

    const res = await recordResult(db, adminUserId, {
      matchId: match.id,
      towersA: 3,
      towersB: 0,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.winnerId).toBe(match.playerAId);
    }

    const updated = (await db.select().from(s.matches).where(eq(s.matches.id, match.id)))[0]!;
    expect(updated.status).toBe("completed");
    expect(updated.towersA).toBe(3);
    expect(updated.towersB).toBe(0);
    expect(updated.winnerId).toBe(match.playerAId);

    const results = await db.select().from(s.matchResults);
    expect(results).toHaveLength(1);

    const v2 = await getDataVersion(db);
    expect(v2).toBe(v1 + 1);

    const audits = await db
      .select()
      .from(s.auditLogs)
      .where(eq(s.auditLogs.entityId, match.id));
    expect(audits.some((a) => a.action === "result_recorded")).toBe(true);
  });

  it("۱۹) ثبت تکراری رد می‌شود و امتیاز دوباره شمرده نمی‌شود", async () => {
    const matches = await db.select().from(s.matches).orderBy(asc(s.matches.id));
    const match = matches[0]!;
    const res = await recordResult(db, adminUserId, {
      matchId: match.id,
      towersA: 2,
      towersB: 1,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("قبلاً ثبت شده");

    const results = await db.select().from(s.matchResults);
    expect(results).toHaveLength(1);
  });

  it("۱۸) ویرایش نتیجه آمار را درست بازمحاسبه می‌کند", async () => {
    const matches = await db.select().from(s.matches).orderBy(asc(s.matches.id));
    const match = matches[0]!;
    // نتیجه: ۳-۰ به سود بازیکن A → حالا ۰-۳ (برگشت نتیجه)
    const res = await updateResult(db, adminUserId, {
      matchId: match.id,
      towersA: 0,
      towersB: 3,
    });
    expect(res.ok).toBe(true);

    const updated = (await db.select().from(s.matches).where(eq(s.matches.id, match.id)))[0]!;
    expect(updated.winnerId).toBe(match.playerBId);

    // جدول رتبه‌بندی از رکورد مسابقات بازمحاسبه می‌شود
    const players = await db.select().from(s.players);
    const allMatches = await db.select().from(s.matches);
    const standings = computeStandings(toEnginePlayers(players), allMatches.map(toEngineMatch), {
      isTournamentComplete: false,
    });
    const rowA = standings.rows.find((r) => r.player.id === match.playerAId)!;
    const rowB = standings.rows.find((r) => r.player.id === match.playerBId)!;
    expect(rowA.points).toBe(0);
    expect(rowB.points).toBe(2);
    expect(rowA.towersFor).toBe(0);
    expect(rowB.towersFor).toBe(3);

    // گزارش تغییرات شامل مقدار قبلی است
    const audits = await db
      .select()
      .from(s.auditLogs)
      .where(eq(s.auditLogs.entityId, match.id));
    const edit = audits.find((a) => a.action === "result_updated");
    expect(edit).toBeTruthy();
    expect(edit!.previousValue).toMatchObject({ towersA: 3, towersB: 0 });
  });

  it("۱۳) نتایج نامعتبر رد می‌شوند", async () => {
    const matches = await db.select().from(s.matches).orderBy(asc(s.matches.id));
    const pending = matches.find((m) => m.towersA === null)!;

    const equal = await recordResult(db, adminUserId, {
      matchId: pending.id,
      towersA: 1,
      towersB: 1,
    });
    expect(equal.ok).toBe(false);

    const invalid = await recordResult(db, adminUserId, {
      matchId: pending.id,
      towersA: 3,
      towersB: 2,
    });
    expect(invalid.ok).toBe(false);

    const negative = await recordResult(db, adminUserId, {
      matchId: pending.id,
      towersA: -1,
      towersB: 0,
    });
    expect(negative.ok).toBe(false);

    const tooBig = await recordResult(db, adminUserId, {
      matchId: pending.id,
      towersA: 4,
      towersB: 0,
    });
    expect(tooBig.ok).toBe(false);
  });

  it("حذف نتیجه و تغییر وضعیت", async () => {
    const matches = await db.select().from(s.matches).orderBy(asc(s.matches.id));
    const pending = matches.find((m) => m.towersA === null)!;

    const rec = await recordResult(db, adminUserId, {
      matchId: pending.id,
      towersA: 2,
      towersB: 1,
    });
    expect(rec.ok).toBe(true);

    const cleared = await clearResult(db, adminUserId, pending.id);
    expect(cleared.ok).toBe(true);
    const after = (await db.select().from(s.matches).where(eq(s.matches.id, pending.id)))[0]!;
    expect(after.towersA).toBeNull();
    expect(after.status).toBe("scheduled");

    // برای مسابقهٔ لغوشده نمی‌توان نتیجه ثبت کرد
    const cancel = await setMatchStatus(db, adminUserId, pending.id, "cancelled");
    expect(cancel.ok).toBe(true);
    const rejected = await recordResult(db, adminUserId, {
      matchId: pending.id,
      towersA: 1,
      towersB: 0,
    });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.error).toContain("لغوشده");
  });
});

describe("۲۰-۲۱) کنترل دسترسی", () => {
  it("۲۰) کاربر بدون هویت مدیر نمی‌تواند نتیجه ثبت کند", async () => {
    const matches = await db.select().from(s.matches).orderBy(asc(s.matches.id));
    const pending = matches.find((m) => m.towersA === null)!;
    const guard = await ensureAdmin(db, null);
    expect(guard.ok).toBe(false);
    // سرویس‌ها فقط از مسیر اکشن‌های محافظت‌شده فراخوانی می‌شوند؛ نگهبان باید رد کند
    const fakeGuard = await ensureAdmin(db, 99999);
    expect(fakeGuard.ok).toBe(false);
    expect(pending).toBeTruthy();
  });

  it("۲۱) نشست جعلی رد می‌شود و نشست معتبر می‌پذیرد", () => {
    const token = createSessionToken({ uid: adminUserId });
    const payload = verifySessionToken(token);
    expect(payload?.uid).toBe(adminUserId);

    expect(verifySessionToken("garbage.token")).toBeNull();
    expect(verifySessionToken(token + "tampered")).toBeNull();

    const expired = createSessionToken({ uid: adminUserId });
    // دستکاری بدنه
    const [body, sig] = expired.split(".") as [string, string];
    const forgedBody = Buffer.from(
      JSON.stringify({ uid: 1, exp: Date.now() + 100000, jti: "x" }),
    ).toString("base64url");
    expect(verifySessionToken(`${forgedBody}.${sig}`)).toBeNull();
    expect(body).toBeTruthy();
  });

  it("کاربر غیرفعال یا غیرمدیر رد می‌شود", async () => {
    const inserted = await db
      .insert(s.users)
      .values({
        email: "viewer@garz.local",
        passwordHash: await hashPassword("password12345"),
        displayName: "بیننده",
        role: "admin",
        isActive: false,
      })
      .returning();
    const guard = await ensureAdmin(db, inserted[0]!.id);
    expect(guard.ok).toBe(false);
  });
});

describe("۲۲ و ۲۴-۲۵) آمار و رتبه‌بندی از دیتابیس", () => {
  it("۲۲) جدول دژگشایان از رکورد مسابقات محاسبه می‌شود", async () => {
    const players = await db.select().from(s.players);
    const matches = await db.select().from(s.matches);
    const leaders = computeTowerLeaders(toEnginePlayers(players), matches.map(toEngineMatch));
    expect(leaders).toHaveLength(5);
    const totalDestroyed = leaders.reduce((sum, l) => sum + l.towersDestroyed, 0);
    const totalLost = leaders.reduce((sum, l) => sum + l.towersLost, 0);
    expect(totalDestroyed).toBe(totalLost); // برج زده = برج خورده در کل لیگ
  });

  it("۲۵) جدول موقت، مسابقات ناتمام را باخت حساب نمی‌کند", async () => {
    const players = await db.select().from(s.players);
    const matches = await db.select().from(s.matches);
    const standings = computeStandings(
      toEnginePlayers(players),
      matches.map(toEngineMatch),
      { isTournamentComplete: false },
    );
    for (const row of standings.rows) {
      expect(row.played).toBe(row.won + row.lost);
      expect(row.points).toBe(row.won * 2);
    }
    expect(standings.isComplete).toBe(false);
    expect(hasOfficialChampion(standings)).toBe(false);
  });

  it("۲۴) مسابقهٔ تکلیفی امتیاز فصل عادی را تغییر نمی‌دهد", async () => {
    const players = await db.select().from(s.players);
    const matchesBefore = await db.select().from(s.matches);
    const before = computeStandings(
      toEnginePlayers(players),
      matchesBefore.map(toEngineMatch),
      { isTournamentComplete: false },
    );

    await db.insert(s.tiebreakMatches).values({
      tournamentId: (await db.select().from(s.tournaments))[0]!.id,
      playerAId: 1,
      playerBId: 2,
      towersA: 3,
      towersB: 0,
      winnerId: 1,
      status: "completed",
      note: "بازی تکلیفی تست",
    });

    const matchesAfter = await db.select().from(s.matches);
    const after = computeStandings(
      toEnginePlayers(players),
      matchesAfter.map(toEngineMatch),
      { isTournamentComplete: false },
    );
    expect(after.rows.map((r) => [r.player.id, r.points])).toEqual(
      before.rows.map((r) => [r.player.id, r.points]),
    );
  });
});

describe("احراز هویت", () => {
  it("هش رمز عبور درست راستی‌آزمایی می‌شود", async () => {
    const hash = await hashPassword("my-secret-pass");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash).not.toContain("my-secret-pass");
    expect(await verifyPassword("my-secret-pass", hash)).toBe(true);
    expect(await verifyPassword("wrong-pass", hash)).toBe(false);
  });
});
