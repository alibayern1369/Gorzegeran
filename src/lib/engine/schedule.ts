/**
 * موتور زمان‌بندی قطعی لیگ — روش چرخشی (Circle Method)
 * Deterministic round-robin scheduling for 5 players / 10 nights.
 *
 * ساختار:
 *  - ۵ دور (شب‌های مرحله یک) با ۲ رویارویی و ۱ استراحت در هر دور
 *  - همان ۵ دور برای مرحله دو تکرار می‌شود
 *  - هر شب دقیقاً ۴ مسابقه در اسلات‌های ۰۰:۰۰، ۰۰:۱۵، ۰۰:۳۰، ۰۰:۴۵ به وقت تهران
 */
import {
  MATCHES_PER_ENCOUNTER,
  MATCH_TYPES,
  NIGHT_SLOTS_MINUTES,
  TOTAL_NIGHTS,
  type MatchType,
} from "./types";

export interface RoundPairing {
  /** جفت بازیکنان (هرگز تکراری نیست) */
  playerAId: number;
  playerBId: number;
  byePlayerId: number;
}

export interface RoundSchedule {
  round: number;
  pairings: Array<{ playerAId: number; playerBId: number }>;
  byePlayerId: number;
}

export interface ScheduledMatchSlot {
  playerAId: number;
  playerBId: number;
  matchType: MatchType;
  nightIndex: number;
  slotIndex: number;
  /** ISO timestamp به وقت تهران (با آفست +03:30) */
  scheduledAt: string;
  stage: 1 | 2;
  round: number;
}

const BYE = -1;

/**
 * تولید دورهای رفت‌وبرگشتی برای n بازیکن (n فرد) با روش چرخشی.
 * برای ۵ بازیکن: ۵ دور × ۲ جفت = ۱۰ رویارویی یکتا.
 */
export function generateRounds(playerIds: number[]): RoundSchedule[] {
  const n = playerIds.length;
  if (n < 3 || n % 2 === 0) {
    throw new Error("تولید برنامه به تعداد فرد و حداقل ۳ بازیکن نیاز دارد.");
  }
  const m = n + 1; // افزودن صندلی «استراحت» برای روش چرخشی
  let rotation = [...playerIds, BYE];
  const rounds: RoundSchedule[] = [];

  for (let r = 0; r < n; r++) {
    const pairings: Array<{ playerAId: number; playerBId: number }> = [];
    let byePlayerId = -1;
    for (let i = 0; i < m / 2; i++) {
      const a = rotation[i]!;
      const b = rotation[m - 1 - i]!;
      if (a === BYE) {
        byePlayerId = b;
      } else if (b === BYE) {
        byePlayerId = a;
      } else {
        // نرمال‌سازی ترتیب برای قطعیت: شناسهٔ کوچک‌تر در جایگاه اول
        pairings.push(
          a < b ? { playerAId: a, playerBId: b } : { playerAId: b, playerBId: a },
        );
      }
    }
    pairings.sort((x, y) => x.playerAId - y.playerAId);
    rounds.push({ round: r, pairings, byePlayerId });
    // چرخش: صندلی اول ثابت، بقیه یک‌جا به راست می‌چرخند
    rotation = [rotation[0]!, ...rotation.slice(2), rotation[1]!];
  }
  return rounds;
}

export interface ScheduleOptions {
  /** تاریخ شروع شب اول (میلادی، سال/ماه/روز) به وقت تهران */
  startYear: number;
  startMonth: number; // 1-12
  startDay: number;
  /** فاصلهٔ بین شب‌ها به روز */
  nightIntervalDays?: number;
}

/**
 * ساخت برنامهٔ کامل ۱۰ شبته.
 * مرحله یک: شب‌های ۰..۴ با انواع custom_deck و draft_type_1
 * مرحله دو: شب‌های ۵..۹ با انواع draft_type_2 و infinite_elixir
 */
export function generateTournamentSchedule(
  playerIds: number[],
  options: ScheduleOptions,
): ScheduledMatchSlot[] {
  const rounds = generateRounds(playerIds);
  const interval = options.nightIntervalDays ?? 2;
  const slots: ScheduledMatchSlot[] = [];

  for (let night = 0; night < TOTAL_NIGHTS; night++) {
    const stage: 1 | 2 = night < 5 ? 1 : 2;
    const roundIndex = night % 5;
    const round = rounds[roundIndex]!;
    const stageTypes: [MatchType, MatchType] =
      stage === 1
        ? ["custom_deck", "draft_type_1"]
        : ["draft_type_2", "infinite_elixir"];

    const nightDate = new Date(
      Date.UTC(options.startYear, options.startMonth - 1, options.startDay + night * interval),
    );

    // دو جفت رویارویی این شب → هر جفت دو مسابقه پیاپی
    round.pairings.forEach((pairing, pairingIndex) => {
      stageTypes.forEach((matchType, typeIndex) => {
        const slotIndex = pairingIndex * 2 + typeIndex;
        const minutes = NIGHT_SLOTS_MINUTES[slotIndex]!;
        slots.push({
          playerAId: pairing.playerAId,
          playerBId: pairing.playerBId,
          matchType,
          nightIndex: night,
          slotIndex,
          scheduledAt: isoTehran(
            nightDate.getUTCFullYear(),
            nightDate.getUTCMonth() + 1,
            nightDate.getUTCDate(),
            0,
            minutes,
          ),
          stage,
          round: roundIndex,
        });
      });
    });
  }
  return slots;
}

/** ساخت timestamp با آفست ثابت تهران (+03:30) */
export function isoTehran(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mi = String(minute).padStart(2, "0");
  // ایران هیچ‌گاه ساعت تابستانی ندارد؛ آفست ثابت است
  return `${year}-${mm}-${dd}T${hh}:${mi}:00+03:30`;
}

/**
 * تاریخ شروع رسمی لیگ: شنبه ۲۵ مهر ۱۴۰۵ = ۲۰۲۶-۱۰-۱۷ (به وقت تهران)
 * این تاریخ با تبدیل تقویم جلالی-میلادی راستی‌آزمایی شده است.
 */
export const TOURNAMENT_START = {
  year: 2026,
  month: 10,
  day: 17,
} as const;

export const DEFAULT_NIGHT_INTERVAL_DAYS = 2;

/** بازیکن استراحت‌کنندهٔ یک شب مشخص */
export function byePlayerForNight(
  playerIds: number[],
  nightIndex: number,
): number {
  const rounds = generateRounds(playerIds);
  return rounds[nightIndex % 5]!.byePlayerId;
}

/** بررسی صحت ساختار برنامه (استفاده در تست‌ها) */
export function validateScheduleStructure(
  playerIds: number[],
  slots: ScheduledMatchSlot[],
): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const n = playerIds.length;
  const expectedTotal = ((n * (n - 1)) / 2) * MATCHES_PER_ENCOUNTER;
  if (slots.length !== expectedTotal) {
    problems.push(`تعداد مسابقات باید ${expectedTotal} باشد، ${slots.length} شد.`);
  }

  // هر جفت بازیکن دقیقاً ۴ مسابقه با ۴ نوع یکتا
  const pairKey = (a: number, b: number) => [Math.min(a, b), Math.max(a, b)].join("-");
  const pairMap = new Map<string, Set<MatchType>>();
  // هر بازیکن هر شب حداکثر ۲ مسابقه و هیچ دو مسابقه‌ای هم‌زمان نیست
  const nightPlayerCount = new Map<string, number>();
  const nightSlotKeys = new Set<string>();

  for (const s of slots) {
    const key = pairKey(s.playerAId, s.playerBId);
    if (!pairMap.has(key)) pairMap.set(key, new Set());
    const types = pairMap.get(key)!;
    if (types.has(s.matchType)) problems.push(`نوع مسابقهٔ تکراری برای جفت ${key}`);
    types.add(s.matchType);

    for (const p of [s.playerAId, s.playerBId]) {
      const npKey = `${s.nightIndex}-${p}`;
      nightPlayerCount.set(npKey, (nightPlayerCount.get(npKey) ?? 0) + 1);
    }
    const slotKey = `${s.nightIndex}-${s.slotIndex}`;
    if (nightSlotKeys.has(slotKey)) problems.push(`اسلات هم‌زمان ${slotKey}`);
    nightSlotKeys.add(slotKey);
  }

  for (const [key, count] of nightPlayerCount) {
    if (count > 2) problems.push(`بازیکن ${key} بیش از ۲ مسابقه در یک شب دارد.`);
  }
  for (const [key, types] of pairMap) {
    if (types.size !== MATCHES_PER_ENCOUNTER) {
      problems.push(`جفت ${key} باید ۴ نوع مسابقهٔ یکتا داشته باشد.`);
    }
  }

  // هر بازیکن دقیقاً ۲ شب استراحت
  for (const p of playerIds) {
    const playedNights = new Set<number>();
    for (const s of slots) {
      if (s.playerAId === p || s.playerBId === p) playedNights.add(s.nightIndex);
    }
    if (playedNights.size !== TOTAL_NIGHTS - 2) {
      problems.push(`بازیکن ${p} باید دقیقاً در ۸ شب بازی کند (۲ شب استراحت).`);
    }
  }

  // هر شب دقیقاً ۴ مسابقه، ۲ جفت، ۴ بازیکن، ۱ استراحت
  for (let night = 0; night < TOTAL_NIGHTS; night++) {
    const nightSlots = slots.filter((s) => s.nightIndex === night);
    if (nightSlots.length !== 4) problems.push(`شب ${night} باید ۴ مسابقه داشته باشد.`);
    const players = new Set<number>();
    const pairs = new Set<string>();
    for (const s of nightSlots) {
      players.add(s.playerAId);
      players.add(s.playerBId);
      pairs.add(pairKey(s.playerAId, s.playerBId));
    }
    if (players.size !== 4) problems.push(`شب ${night} باید ۴ بازیکن فعال داشته باشد.`);
    if (pairs.size !== 2) problems.push(`شب ${night} باید ۲ رویارویی مجزا داشته باشد.`);
    const resting = playerIds.filter((p) => !players.has(p));
    if (resting.length !== 1) problems.push(`شب ${night} باید دقیقاً ۱ بازیکن استراحت داشته باشد.`);
  }

  return { ok: problems.length === 0, problems };
}
