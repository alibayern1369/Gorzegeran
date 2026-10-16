import { describe, it, expect } from "vitest";
import {
  isValidTowerScore,
  isValidScorePair,
  determineWinner,
  leaguePointsFor,
  towerDifferential,
  isThreeCrownWin,
  allValidScorePairs,
  scorePairSchema,
} from "@/lib/engine/scoring";

describe("امتیازدهی مسابقه", () => {
  it("۱۰) پیروزی دقیقاً ۲ امتیاز می‌دهد", () => {
    expect(leaguePointsFor(3, 0)).toBe(2);
    expect(leaguePointsFor(2, 1)).toBe(2);
    expect(leaguePointsFor(1, 0)).toBe(2);
  });

  it("۱۱) باخت دقیقاً ۰ امتیاز می‌دهد", () => {
    expect(leaguePointsFor(0, 3)).toBe(0);
    expect(leaguePointsFor(1, 2)).toBe(0);
    expect(leaguePointsFor(0, 1)).toBe(0);
  });

  it("۱۲) نتیجهٔ مساوی رد می‌شود", () => {
    expect(isValidScorePair(0, 0)).toBe(false);
    expect(isValidScorePair(1, 1)).toBe(false);
    expect(isValidScorePair(2, 2)).toBe(false);
    expect(isValidScorePair(3, 3)).toBe(false);
    const r = determineWinner(1, 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("مساوی");
    const parsed = scorePairSchema.safeParse({ towersA: 1, towersB: 1 });
    expect(parsed.success).toBe(false);
  });

  it("۱۳) امتیاز برج نامعتبر رد می‌شود", () => {
    expect(isValidTowerScore(-1)).toBe(false);
    expect(isValidTowerScore(4)).toBe(false);
    expect(isValidTowerScore(1.5)).toBe(false);
    expect(isValidTowerScore("2")).toBe(false);
    expect(isValidTowerScore(0)).toBe(true);
    expect(isValidTowerScore(3)).toBe(true);

    expect(isValidScorePair(-1, 2)).toBe(false);
    expect(isValidScorePair(2, 4)).toBe(false);
    // پیروزی ۳تاجی با تاج حریف غیرصفر نامعتبر است
    expect(isValidScorePair(3, 1)).toBe(false);
    expect(isValidScorePair(3, 2)).toBe(false);
    expect(isValidScorePair(1, 3)).toBe(false);
    expect(isValidScorePair(2, 3)).toBe(false);
  });

  it("نتایج معتبر کلش رویال می‌پذیرد", () => {
    expect(isValidScorePair(1, 0)).toBe(true);
    expect(isValidScorePair(2, 0)).toBe(true);
    expect(isValidScorePair(2, 1)).toBe(true);
    expect(isValidScorePair(3, 0)).toBe(true);
    expect(isValidScorePair(0, 1)).toBe(true);
    expect(isValidScorePair(0, 2)).toBe(true);
    expect(isValidScorePair(1, 2)).toBe(true);
    expect(isValidScorePair(0, 3)).toBe(true);
    expect(allValidScorePairs()).toHaveLength(8);
  });

  it("تعیین برنده درست کار می‌کند", () => {
    const r = determineWinner(3, 0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.winnerIsA).toBe(true);
      expect(r.winnerTowers).toBe(3);
      expect(r.loserTowers).toBe(0);
    }
    const r2 = determineWinner(1, 2);
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.winnerIsA).toBe(false);
  });

  it("۱۴) تفاضل برج درست محاسبه می‌شود", () => {
    expect(towerDifferential(3, 0)).toBe(3);
    expect(towerDifferential(2, 1)).toBe(1);
    expect(towerDifferential(1, 0)).toBe(1);
    expect(towerDifferential(1, 2)).toBe(-1);
    expect(towerDifferential(0, 3)).toBe(-3);
  });

  it("تشخیص پیروزی سه‌تاجی", () => {
    expect(isThreeCrownWin(3, 0)).toBe(true);
    expect(isThreeCrownWin(2, 0)).toBe(false);
    expect(isThreeCrownWin(3, 1)).toBe(false);
  });

  it("اسکیمای Zod پیام‌های فارسی می‌دهد", () => {
    const bad = scorePairSchema.safeParse({ towersA: 5, towersB: 1 });
    expect(bad.success).toBe(false);
    const neg = scorePairSchema.safeParse({ towersA: -1, towersB: 1 });
    expect(neg.success).toBe(false);
    const good = scorePairSchema.safeParse({ towersA: 2, towersB: 1 });
    expect(good.success).toBe(true);
  });
});
