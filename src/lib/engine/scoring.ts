/**
 * قوانین امتیازدهی و اعتبارسنجی نتایج — لیگ گرز گران
 * Scoring rules & score validation.
 */
import { z } from "zod";
import { LOSS_POINTS, MAX_TOWERS, WIN_POINTS } from "./types";

/** امتیاز برج باید عدد صحیح بین ۰ تا ۳ باشد */
export function isValidTowerScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_TOWERS
  );
}

/**
 * نتایج معتبر کلش رویال:
 * ۱–۰، ۲–۰، ۲–۱، ۳–۰ و حالت‌های قرینهٔ آن‌ها.
 * تساوی مجاز نیست و پیروزی ۳تاجی فقط با صفر بودن تاج حریف معتبر است.
 */
export function isValidScorePair(a: number, b: number): boolean {
  if (!isValidTowerScore(a) || !isValidTowerScore(b)) return false;
  if (a === b) return false;
  if (a === MAX_TOWERS && b !== 0) return false;
  if (b === MAX_TOWERS && a !== 0) return false;
  return true;
}

export interface ScorePair {
  towersA: number;
  towersB: number;
}

/** برنده را تعیین می‌کند؛ در صورت نامعتبر بودن نتیجه خطا برمی‌گرداند */
export function determineWinner(
  a: number,
  b: number,
):
  | { ok: true; winnerIsA: boolean; winnerTowers: number; loserTowers: number }
  | { ok: false; error: string } {
  if (!isValidTowerScore(a) || !isValidTowerScore(b)) {
    return { ok: false, error: "امتیاز برج باید عدد صحیح بین ۰ تا ۳ باشد." };
  }
  if (a === b) {
    return {
      ok: false,
      error: "نتیجهٔ مساوی پذیرفته نمی‌شود؛ هر مسابقه باید یک برندهٔ مشخص داشته باشد.",
    };
  }
  if ((a === MAX_TOWERS && b !== 0) || (b === MAX_TOWERS && a !== 0)) {
    return {
      ok: false,
      error: "پیروزی سه‌تاجی فقط زمانی معتبر است که حریف صفر تاج داشته باشد.",
    };
  }
  const winnerIsA = a > b;
  return {
    ok: true,
    winnerIsA,
    winnerTowers: Math.max(a, b),
    loserTowers: Math.min(a, b),
  };
}

/** امتیاز لیگ برندهٔ مسابقهٔ انفرادی (همیشه ۲) */
export function pointsForWin(): number {
  return WIN_POINTS;
}

/** امتیاز لیگ بازندهٔ مسابقهٔ انفرادی (همیشه ۰) */
export function pointsForLoss(): number {
  return LOSS_POINTS;
}

/** امتیاز کسب‌شده توسط یک بازیکن در مسابقه‌ای با این امتیاز برج‌ها */
export function leaguePointsFor(playerTowers: number, opponentTowers: number): number {
  return playerTowers > opponentTowers ? WIN_POINTS : LOSS_POINTS;
}

/** تفاضل برج برای یک مسابقه: برج زده منهای برج خورده */
export function towerDifferential(towersFor: number, towersAgainst: number): number {
  return towersFor - towersAgainst;
}

/** آیا پیروزی سه‌تاجی بوده است؟ */
export function isThreeCrownWin(playerTowers: number, opponentTowers: number): boolean {
  return playerTowers === MAX_TOWERS && opponentTowers === 0;
}

/** همهٔ نتایج مجاز به‌صورت جفت (a, b) */
export function allValidScorePairs(): ScorePair[] {
  const pairs: ScorePair[] = [];
  for (let a = 0; a <= MAX_TOWERS; a++) {
    for (let b = 0; b <= MAX_TOWERS; b++) {
      if (isValidScorePair(a, b)) pairs.push({ towersA: a, towersB: b });
    }
  }
  return pairs;
}

/** اسکیمای Zod برای ثبت نتیجه (سمت کلاینت و سرور) */
export const scorePairSchema = z
  .object({
    towersA: z
      .number({ error: "امتیاز برج بازیکن اول الزامی است." })
      .int("امتیاز برج باید عدد صحیح باشد.")
      .min(0, "امتیاز برج نمی‌تواند منفی باشد.")
      .max(MAX_TOWERS, "امتیاز برج نمی‌تواند بیشتر از ۳ باشد."),
    towersB: z
      .number({ error: "امتیاز برج بازیکن دوم الزامی است." })
      .int("امتیاز برج باید عدد صحیح باشد.")
      .min(0, "امتیاز برج نمی‌تواند منفی باشد.")
      .max(MAX_TOWERS, "امتیاز برج نمی‌تواند بیشتر از ۳ باشد."),
  })
  .refine((v) => v.towersA !== v.towersB, {
    message: "نتیجهٔ مساوی پذیرفته نمی‌شود؛ هر مسابقه باید یک برندهٔ مشخص داشته باشد.",
  })
  .refine((v) => !(v.towersA === MAX_TOWERS && v.towersB !== 0), {
    message: "پیروزی سه‌تاجی فقط زمانی معتبر است که حریف صفر تاج داشته باشد.",
  })
  .refine((v) => !(v.towersB === MAX_TOWERS && v.towersA !== 0), {
    message: "پیروزی سه‌تاجی فقط زمانی معتبر است که حریف صفر تاج داشته باشد.",
  });

export type ScorePairInput = z.infer<typeof scorePairSchema>;
