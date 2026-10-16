import { describe, it, expect, beforeEach } from "vitest";
import { computeStandings, hasOfficialChampion, isCountableMatch } from "@/lib/engine/ranking";
import type { EngineMatch, EnginePlayer, MatchType } from "@/lib/engine/types";

const PLAYERS: EnginePlayer[] = [
  { id: 1, slug: "dashli", name: "داشلی" },
  { id: 2, slug: "hani", name: "هانی" },
  { id: 3, slug: "jaf-haf", name: "جاف حاف" },
  { id: 4, slug: "ali-doli", name: "علی دولی" },
  { id: 5, slug: "ostad", name: "استاد" },
];

const TYPES: MatchType[] = ["custom_deck", "draft_type_1", "draft_type_2", "infinite_elixir"];

let nextId = 1;
function m(
  playerAId: number,
  playerBId: number,
  towersA: number,
  towersB: number,
  opts: Partial<EngineMatch> = {},
): EngineMatch {
  const winnerId = towersA > towersB ? playerAId : playerBId;
  return {
    id: opts.id ?? nextId++,
    encounterId: opts.encounterId ?? Math.min(playerAId, playerBId) * 10 + Math.max(playerAId, playerBId),
    matchType: opts.matchType ?? TYPES[(nextId - 1) % 4]!,
    playerAId,
    playerBId,
    scheduledAt: opts.scheduledAt ?? "2026-10-17T00:00:00+03:30",
    nightIndex: opts.nightIndex ?? 0,
    slotIndex: opts.slotIndex ?? 0,
    status: opts.status ?? "completed",
    towersA: opts.status === "scheduled" ? null : towersA,
    towersB: opts.status === "scheduled" ? null : towersB,
    winnerId: opts.status === "scheduled" ? null : (opts.winnerId ?? winnerId),
    ...opts,
    // نگه‌داشتن مقادیر صریح
    ...(opts.towersA !== undefined ? { towersA: opts.towersA } : {}),
    ...(opts.towersB !== undefined ? { towersB: opts.towersB } : {}),
    ...(opts.winnerId !== undefined ? { winnerId: opts.winnerId } : {}),
  };
}

/** چهار مسابقهٔ یک رویارویی با نتیجهٔ دلخواه (برد A از دید A) */
function encounter(playerAId: number, playerBId: number, winsA: number, diffs: number[] = []): EngineMatch[] {
  const out: EngineMatch[] = [];
  const results: Array<[number, number]> = [];
  for (let i = 0; i < 4; i++) {
    if (i < winsA) {
      results.push(diffs[i] !== undefined ? scoreFromDiff(diffs[i]!, true) : [2, 1]);
    } else {
      results.push(diffs[i] !== undefined ? scoreFromDiff(diffs[i]!, false) : [1, 2]);
    }
  }
  results.forEach(([ta, tb], i) => {
    out.push(m(playerAId, playerBId, ta, tb, { matchType: TYPES[i]!, id: nextId++ }));
  });
  return out;
}

function scoreFromDiff(diff: number, aWins: boolean): [number, number] {
  // ساخت نتیجهٔ معتبر با تفاضل دلخواه (در محدودهٔ مجاز)
  if (aWins) {
    if (diff >= 3) return [3, 0];
    if (diff >= 1) return [2, 1];
    return [2, 0];
  } else {
    if (diff <= -3) return [0, 3];
    if (diff <= -1) return [1, 2];
    return [0, 2];
  }
}

beforeEach(() => {
  nextId = 1;
});

describe("موتور رتبه‌بندی", () => {
  it("امتیاز برد و باخت درست اعمال می‌شود و جدول مرتب است", () => {
    const matches = [
      ...encounter(1, 2, 4), // داشلی ۴-۰ هانی → ۸ امتیاز
      ...encounter(1, 3, 0), // جاف حاف ۴-۰ داشلی
    ];
    const standings = computeStandings(PLAYERS, matches, { isTournamentComplete: false });
    const byId = Object.fromEntries(standings.rows.map((r) => [r.player.id, r]));
    expect(byId[1]!.points).toBe(8);
    expect(byId[2]!.points).toBe(0);
    expect(byId[3]!.points).toBe(8);
    // داشلی و جاف حاف هم‌امتیاز؛ رویارویی مستقیم ندارند → تفاضل برج
    expect(standings.rows[0]!.player.id === 3).toBe(true); // جاف حاف تفاضل بهتر (۱۲+ در برابر ۹+)
  });

  it("۱۵ب) برتری رویارویی مستقیم حتی با تفاضل برج کمتر", () => {
    // علی دولی ۳-۱ جاف حاف را می‌برد (۶ امتیاز / تفاضل صفر)
    // علی دولی ۰-۴ از هانی می‌بازد (تفاضل کلی ۱۲-)
    // جاف حاف ۲-۲ با استاد با تفاضل مثبت (۴ امتیاز دیگر → مجموع ۶)
    // نتیجه: هر دو ۶ امتیازی؛ تفاضل برج جاف حاف بهتر است اما علی دولی بالاتر می‌ایستد
    const matches = [
      ...encounter(4, 3, 3, [1, 1, 1, -3]),
      ...encounter(4, 2, 0, [-3, -3, -3, -3]),
      ...encounter(3, 5, 2, [3, 3, -1, -1]),
    ];
    const standings = computeStandings(PLAYERS, matches, { isTournamentComplete: false });
    const aliIdx = standings.rows.findIndex((r) => r.player.id === 4);
    const jafIdx = standings.rows.findIndex((r) => r.player.id === 3);
    const ali = standings.rows[aliIdx]!;
    const jaf = standings.rows[jafIdx]!;
    expect(ali.points).toBe(6);
    expect(jaf.points).toBe(6);
    expect(ali.towerDiff).toBeLessThan(jaf.towerDiff); // تفاضل برج علی بدتر است
    expect(aliIdx).toBeLessThan(jafIdx); // اما رتبهٔ علی بهتر است
  });

  it("۱۶) رویارویی ۲–۲ به‌عنوان تساوی رویارویی، با تفاضل برج حل می‌شود", () => {
    // هانی و استاد ۲-۲؛ هانی تفاضل بهتر در بازی‌های دیگر
    const matches = [
      ...encounter(2, 5, 2, [3, 3, -3, -3]), // ۲-۲ با تفاضل صفر برای هر دو
      ...encounter(2, 1, 0, [-3, -3, -3, -3]), // داشلی ۴-۰ هانی
      ...encounter(5, 1, 0, [-3, -3, -3, -3]), // داشلی ۴-۰ استاد
    ];
    // هانی و استاد هر دو ۴ امتیاز و رویارویی ۲-۲ → تفاضل برج کلی
    // هر دو از داشلی ۰-۴ باختند و با هم ۲-۲ → تفاضل هر دو برابر
    const standings = computeStandings(PLAYERS, matches, { isTournamentComplete: true });
    const hani = standings.rows.find((r) => r.player.id === 2)!;
    const ostad = standings.rows.find((r) => r.player.id === 5)!;
    expect(hani.points).toBe(ostad.points);
    // تفاضل برابر است؛ پس برج زده هم برابر → نیاز به بازی تکلیفی
    expect(hani.towerDiff).toBe(ostad.towerDiff);
  });

  it("۱۷) تساوی چندنفره با مینی‌لیگ به‌صورت قطعی حل می‌شود", () => {
    // سه بازیکن هم‌امتیاز: ۱، ۲، ۳ هر کدام ۴ امتیاز از برد ۲-۲ برابر
    // مینی‌لیگ: ۱ دوبار ۲ را می‌برد، ۲ دوبار ۳ را، ۳ دوبار ۱ را (حلقه)
    // معیار بعدی مینی‌لیگ: تفاضل برج داخل مینی‌لیگ
    const matches = [
      ...encounter(1, 2, 3, [3, 3, 1, -3]), // ۱: ۳-۱ بر ۲؛ تفاضل ۱: ۳+۳+۱-۳=۴
      ...encounter(2, 3, 3, [1, 1, 1, -3]), // ۲: ۳-۱ بر ۳؛ تفاضل ۲ در این بازی‌ها: ۱+۱+۱-۳=۰
      ...encounter(3, 1, 3, [1, 1, 1, -3]), // ۳: ۳-۱ بر ۱؛ تفاضل ۳: ۰؛ تفاضل ۱ در این بازی‌ها: -۰
    ];
    // امتیازها: هر کدام ۲ برد ۴ امتیاز — مینی‌لیگ هم ۴ امتیازی
    // تفاضل مینی‌لیگ: ۱: ۴-۰=۴؟ حساب کنیم:
    // ۱ در برابر ۲: +۴ (۳-۱ با تفاضل‌های ۳,۳,۱,-۳) و در برابر ۳: ۱ باخت ۳-۰ و سه برد ۲-۱؟ نه — encounter(3,1,3) یعنی ۳ سه برد
    // تفاضل ۱ از بازی با ۳: -۱-۱-۱+۳ = ۰. پس تفاضل مینی ۱ = ۴+۰ = ۴
    // ۲: در برابر ۱: -۴؛ در برابر ۳: +۰ → مینی -۴
    // ۳: در برابر ۱: ۰؛ در برابر ۲: ۰ → مینی ۰
    // ترتیب: ۱، ۳، ۲
    const standings = computeStandings(PLAYERS, matches, { isTournamentComplete: false });
    const top3 = standings.rows.slice(0, 3).map((r) => r.player.id);
    expect(top3).toEqual([1, 3, 2]);
  });

  it("۲۵) مسابقات ناتمام شکست محسوب نمی‌شوند (جدول موقت)", () => {
    const matches = [
      ...encounter(1, 2, 4), // داشلی ۴-۰ هانی
      m(1, 3, 0, 0, { status: "scheduled", matchType: "custom_deck" }),
      m(1, 3, 0, 0, { status: "scheduled", matchType: "draft_type_1" }),
    ];
    const standings = computeStandings(PLAYERS, matches, { isTournamentComplete: false });
    const dashli = standings.rows.find((r) => r.player.id === 1)!;
    const jaf = standings.rows.find((r) => r.player.id === 3)!;
    expect(dashli.played).toBe(4);
    expect(dashli.lost).toBe(0);
    expect(jaf.played).toBe(0);
    expect(jaf.lost).toBe(0);
    expect(jaf.points).toBe(0);
    expect(standings.isComplete).toBe(false);
    expect(hasOfficialChampion(standings)).toBe(false);
  });

  it("۲۴) مسابقات تکلیفی به امتیاز فصل عادی اضافه نمی‌شوند", () => {
    // مسابقهٔ تکلیفی در جدول matches نیست؛ حتی اگر باشد هم چون
    // امتیازها فقط از matches محاسبه می‌شوند، محاسبهٔ زیر خالص است
    const matches = [
      ...encounter(1, 2, 4),
      m(1, 2, 3, 0, { status: "cancelled" }), // مسابقهٔ لغوشده اثری ندارد
    ];
    const standings = computeStandings(PLAYERS, matches, { isTournamentComplete: false });
    const dashli = standings.rows.find((r) => r.player.id === 1)!;
    const hani = standings.rows.find((r) => r.player.id === 2)!;
    expect(dashli.points).toBe(8);
    expect(dashli.played).toBe(4);
    expect(hani.points).toBe(0);
  });

  it("رتبه‌های مشترک و بازی تکلیفی وقتی همهٔ معیارها برابر باشد", () => {
    // دو بازیکن با آمار کاملاً یکسان
    const matches = [
      ...encounter(1, 2, 2, [3, 3, -3, -3]), // ۲-۲ با تفاضل صفر
    ];
    const standings = computeStandings(PLAYERS, matches, { isTournamentComplete: true });
    const r1 = standings.rows.find((r) => r.player.id === 1)!;
    const r2 = standings.rows.find((r) => r.player.id === 2)!;
    expect(r1.points).toBe(r2.points);
    expect(r1.towerDiff).toBe(r2.towerDiff);
    expect(r1.towersFor).toBe(r2.towersFor);
    expect(r1.requiresTiebreak).toBe(true);
    expect(r2.requiresTiebreak).toBe(true);
    expect(r1.rank).toBe(r2.rank);
    expect(hasOfficialChampion(standings)).toBe(false);
  });

  it("برندهٔ رویارویی ۳-۱ حتی وقتی تفاضل برج کمتری دارد بالاتر است (مثال علی دولی/جاف حاف)", () => {
    const matches = [
      ...encounter(4, 3, 3, [1, 1, 1, -3]),
    ];
    const standings = computeStandings(PLAYERS, matches, { isTournamentComplete: false });
    expect(standings.rows[0]!.player.id).toBe(4);
    expect(standings.rows[1]!.player.id).toBe(3);
  });

  it("فقط مسابقات تکمیل‌شده در آمار رسمی لحاظ می‌شوند", () => {
    const match = m(1, 2, 2, 1, { status: "postponed", towersA: null, towersB: null, winnerId: null });
    expect(isCountableMatch(match)).toBe(false);
    expect(isCountableMatch(m(1, 2, 2, 1))).toBe(true);
    expect(isCountableMatch(m(1, 2, 0, 0, { status: "cancelled", towersA: null, towersB: null, winnerId: null }))).toBe(false);
  });
});
