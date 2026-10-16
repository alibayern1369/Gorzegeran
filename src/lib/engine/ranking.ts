/**
 * موتور رتبه‌بندی قطعی لیگ گرز گران
 * Deterministic league ranking engine with full tiebreak hierarchy:
 *   ۱) امتیاز لیگ  ۲) رویارویی مستقیم  ۳) تفاضل برج  ۴) برج زده  ۵) بازی تکلیفی
 */
import type {
  EngineMatch,
  EnginePlayer,
  PlayerStandingRow,
  StandingsResult,
} from "./types";
import { MATCHES_PER_ENCOUNTER, WIN_POINTS } from "./types";

interface BaseStats {
  playerId: number;
  played: number;
  won: number;
  lost: number;
  points: number;
  towersFor: number;
  towersAgainst: number;
  towerDiff: number;
  threeCrownWins: number;
}

function emptyStats(playerId: number): BaseStats {
  return {
    playerId,
    played: 0,
    won: 0,
    lost: 0,
    points: 0,
    towersFor: 0,
    towersAgainst: 0,
    towerDiff: 0,
    threeCrownWins: 0,
  };
}

/** فقط مسابقات تکمیل‌شده در آمار رسمی لحاظ می‌شوند */
export function isCountableMatch(m: EngineMatch): boolean {
  return (
    m.status === "completed" &&
    m.towersA !== null &&
    m.towersB !== null &&
    m.winnerId !== null
  );
}

function computeBaseStats(
  playerIds: number[],
  matches: EngineMatch[],
): Map<number, BaseStats> {
  const map = new Map<number, BaseStats>();
  for (const id of playerIds) map.set(id, emptyStats(id));

  for (const m of matches) {
    if (!isCountableMatch(m)) continue;
    const a = map.get(m.playerAId);
    const b = map.get(m.playerBId);
    if (!a || !b) continue;
    const ta = m.towersA!;
    const tb = m.towersB!;
    a.played++;
    b.played++;
    a.towersFor += ta;
    a.towersAgainst += tb;
    b.towersFor += tb;
    b.towersAgainst += ta;
    if (m.winnerId === m.playerAId) {
      a.won++;
      a.points += WIN_POINTS;
      b.lost++;
      if (ta === 3 && tb === 0) a.threeCrownWins++;
    } else {
      b.won++;
      b.points += WIN_POINTS;
      a.lost++;
      if (tb === 3 && ta === 0) b.threeCrownWins++;
    }
    a.towerDiff = a.towersFor - a.towersAgainst;
    b.towerDiff = b.towersFor - b.towersAgainst;
  }
  return map;
}

interface PairH2H {
  winsA: number;
  winsB: number;
  complete: boolean;
  towersForA: number;
  towersForB: number;
  diffA: number;
  diffB: number;
  pointsA: number;
  pointsB: number;
}

function h2hBetween(
  idA: number,
  idB: number,
  matches: EngineMatch[],
): PairH2H {
  const res: PairH2H = {
    winsA: 0,
    winsB: 0,
    complete: false,
    towersForA: 0,
    towersForB: 0,
    diffA: 0,
    diffB: 0,
    pointsA: 0,
    pointsB: 0,
  };
  let completed = 0;
  for (const m of matches) {
    const involves =
      (m.playerAId === idA && m.playerBId === idB) ||
      (m.playerAId === idB && m.playerBId === idA);
    if (!involves) continue;
    if (m.status === "completed" && m.towersA !== null && m.towersB !== null && m.winnerId !== null) {
      completed++;
      const aIsA = m.playerAId === idA;
      const tA = aIsA ? m.towersA! : m.towersB!;
      const tB = aIsA ? m.towersB! : m.towersA!;
      res.towersForA += tA;
      res.towersForB += tB;
      res.diffA += tA - tB;
      res.diffB += tB - tA;
      if (m.winnerId === idA) {
        res.winsA++;
        res.pointsA += WIN_POINTS;
      } else {
        res.winsB++;
        res.pointsB += WIN_POINTS;
      }
    }
  }
  res.complete = completed === MATCHES_PER_ENCOUNTER;
  return res;
}

/** آمار مسابقات بین اعضای یک زیرگروه (مینی‌لیگ) */
function miniLeagueStats(
  ids: number[],
  matches: EngineMatch[],
): Map<number, { points: number; diff: number; towers: number }> {
  const set = new Set(ids);
  const out = new Map<number, { points: number; diff: number; towers: number }>();
  for (const id of ids) out.set(id, { points: 0, diff: 0, towers: 0 });
  for (const m of matches) {
    if (!isCountableMatch(m)) continue;
    if (!set.has(m.playerAId) || !set.has(m.playerBId)) continue;
    const a = out.get(m.playerAId)!;
    const b = out.get(m.playerBId)!;
    const ta = m.towersA!;
    const tb = m.towersB!;
    a.towers += ta;
    b.towers += tb;
    a.diff += ta - tb;
    b.diff += tb - ta;
    if (m.winnerId === m.playerAId) a.points += WIN_POINTS;
    else b.points += WIN_POINTS;
  }
  return out;
}

interface ResolvedEntry {
  playerId: number;
  requiresTiebreak: boolean;
  sharedRank: boolean;
}

/**
 * چیدمان قطعی گروه هم‌امتیاز.
 * خروجی ترتیب نهایی اعضای گروه + پرچم نیاز به بازی تکلیفی است.
 */
function resolveTiedGroup(
  ids: number[],
  matches: EngineMatch[],
  stats: Map<number, BaseStats>,
  isComplete: boolean,
): ResolvedEntry[] {
  if (ids.length <= 1) {
    return ids.map((playerId) => ({ playerId, requiresTiebreak: false, sharedRank: false }));
  }

  // — گروه دو نفره: مقایسهٔ رویارویی مستقیمِ تکمیل‌شده، سپس تفاضل و برج زدهٔ کلی —
  if (ids.length === 2) {
    const [idA, idB] = ids as [number, number];
    const h = h2hBetween(idA, idB, matches);
    const sA = stats.get(idA)!;
    const sB = stats.get(idB)!;
    let winnerFirst: number | null = null;

    // رویارویی فقط وقتی تعیین‌کننده است که هر ۴ مسابقه برگزار شده باشد
    if (h.complete) {
      if (h.winsA > h.winsB) winnerFirst = idA;
      else if (h.winsB > h.winsA) winnerFirst = idB;
    }

    const key = (p: number) => {
      const s = stats.get(p)!;
      return { diff: s.towerDiff, towers: s.towersFor };
    };
    const kA = key(idA);
    const kB = key(idB);

    const byOverall = (): ResolvedEntry[] | null => {
      if (kA.diff !== kB.diff) {
        return kA.diff > kB.diff
          ? [ent(idA), ent(idB)]
          : [ent(idB), ent(idA)];
      }
      if (kA.towers !== kB.towers) {
        return kA.towers > kB.towers
          ? [ent(idA), ent(idB)]
          : [ent(idB), ent(idA)];
      }
      return null;
    };
    const ent = (p: number, tie = false, shared = false): ResolvedEntry => ({
      playerId: p,
      requiresTiebreak: tie,
      sharedRank: shared,
    });

    if (winnerFirst !== null) {
      return winnerFirst === idA ? [ent(idA), ent(idB)] : [ent(idB), ent(idA)];
    }
    const byOverallResult = byOverall();
    if (byOverallResult) return byOverallResult;

    // همهٔ معیارها برابر: بازی تکلیفی (فقط در پایان مسابقات)
    const tie = isComplete;
    // ترتیب نمایشی قطعی بر اساس شناسه، بدون اختراع برنده
    const sorted = [idA, idB].sort((x, y) => x - y);
    return sorted.map((p) => ent(p, tie, true));
  }

  // — گروه سه‌نفره یا بیشتر: مینی‌لیگ —
  const mini = miniLeagueStats(ids, matches);
  const keyOf = (p: number) => {
    const m = mini.get(p)!;
    return `${m.points}|${m.diff}|${m.towers}`;
  };
  const clusters = new Map<string, number[]>();
  for (const id of [...ids].sort((a, b) => a - b)) {
    const k = keyOf(id);
    if (!clusters.has(k)) clusters.set(k, []);
    clusters.get(k)!.push(id);
  }
  const orderedClusters = [...clusters.entries()].sort((x, y) => {
    const [p1, d1, t1] = x[0].split("|").map(Number) as [number, number, number];
    const [p2, d2, t2] = y[0].split("|").map(Number) as [number, number, number];
    if (p1 !== p2) return p2 - p1;
    if (d1 !== d2) return d2 - d1;
    return t2 - t1;
  });

  const out: ResolvedEntry[] = [];
  for (const [, cluster] of orderedClusters) {
    if (cluster.length === 1) {
      out.push({ playerId: cluster[0]!, requiresTiebreak: false, sharedRank: false });
      continue;
    }
    if (cluster.length === 2) {
      // بازاعمال روال رویارویی مستقیم برای زیرگروه باقی‌مانده
      out.push(...resolveTiedGroup(cluster, matches, stats, isComplete));
      continue;
    }
    // زیرگروه بزرگ‌تر: معیارهای کلی؛ اگر هنوز برابر بود، بدون اختراع برنده
    const subKey = (p: number) => {
      const s = stats.get(p)!;
      return { diff: s.towerDiff, towers: s.towersFor };
    };
    const subClusters = new Map<string, number[]>();
    for (const p of cluster) {
      const k = `${subKey(p).diff}|${subKey(p).towers}`;
      if (!subClusters.has(k)) subClusters.set(k, []);
      subClusters.get(k)!.push(p);
    }
    const orderedSub = [...subClusters.entries()].sort((x, y) => {
      const [d1, t1] = x[0].split("|").map(Number) as [number, number];
      const [d2, t2] = y[0].split("|").map(Number) as [number, number];
      if (d1 !== d2) return d2 - d1;
      return t2 - t1;
    });
    for (const [, sub] of orderedSub) {
      const tie = sub.length > 1 && isComplete;
      for (const p of [...sub].sort((a, b) => a - b)) {
        out.push({ playerId: p, requiresTiebreak: tie, sharedRank: sub.length > 1 });
      }
    }
  }
  return out;
}

/**
 * محاسبهٔ جدول رتبه‌بندی.
 * @param isTournamentComplete آیا همهٔ مسابقات برگزار یا لغو شده‌اند
 */
export function computeStandings(
  players: EnginePlayer[],
  matches: EngineMatch[],
  options?: { isTournamentComplete?: boolean },
): StandingsResult {
  const playerIds = players.map((p) => p.id);
  const stats = computeBaseStats(playerIds, matches);

  const completedMatches = matches.filter(isCountableMatch).length;
  const totalMatches = matches.filter((m) => m.status !== "cancelled").length;
  const allResolved = matches.every(
    (m) => m.status === "completed" || m.status === "cancelled",
  );
  const isComplete =
    (options?.isTournamentComplete ?? allResolved) && allResolved;

  // گروه‌بندی بر اساس امتیاز
  const byPoints = new Map<number, number[]>();
  for (const id of playerIds) {
    const pts = stats.get(id)!.points;
    if (!byPoints.has(pts)) byPoints.set(pts, []);
    byPoints.get(pts)!.push(id);
  }
  const pointLevels = [...byPoints.keys()].sort((a, b) => b - a);

  const resolved: ResolvedEntry[] = [];
  for (const pts of pointLevels) {
    const group = byPoints.get(pts)!.sort((a, b) => a - b);
    resolved.push(...resolveTiedGroup(group, matches, stats, isComplete));
  }

  // اختصاص رتبه (مشترک وقتی همهٔ معیارها برابر بمانند)
  const rows: PlayerStandingRow[] = [];
  let currentRank = 0;
  let index = 0;
  while (index < resolved.length) {
    const entry = resolved[index]!;
    let clusterEnd = index + 1;
    // خوشهٔ رتبهٔ مشترک: فقط وقتی requiresTiebreak/sharedRank باشد
    if (entry.sharedRank && entry.requiresTiebreak) {
      while (
        clusterEnd < resolved.length &&
        resolved[clusterEnd]!.sharedRank &&
        resolved[clusterEnd]!.requiresTiebreak &&
        samePoints(resolved[clusterEnd]!.playerId, entry.playerId, stats)
      ) {
        clusterEnd++;
      }
    }
    currentRank = index + 1;
    for (let i = index; i < clusterEnd; i++) {
      const r = resolved[i]!;
      const s = stats.get(r.playerId)!;
      rows.push({
        player: players.find((p) => p.id === r.playerId)!,
        rank: currentRank,
        played: s.played,
        won: s.won,
        lost: s.lost,
        points: s.points,
        towersFor: s.towersFor,
        towersAgainst: s.towersAgainst,
        towerDiff: s.towerDiff,
        threeCrownWins: s.threeCrownWins,
        requiresTiebreak: r.requiresTiebreak,
        sharedRank: clusterEnd - index > 1,
      });
    }
    index = clusterEnd;
  }

  return { rows, isComplete, completedMatches, totalMatches };
}

function samePoints(a: number, b: number, stats: Map<number, BaseStats>): boolean {
  return stats.get(a)!.points === stats.get(b)!.points;
}

/** آیا تورنمنت قهرمان قطعی دارد (کامل و بدون نیاز به بازی تکلیفی) */
export function hasOfficialChampion(standings: StandingsResult): boolean {
  return (
    standings.isComplete &&
    standings.rows.length > 0 &&
    !standings.rows.some((r) => r.requiresTiebreak) &&
    standings.rows[0]!.rank === 1 &&
    standings.rows.filter((r) => r.rank === 1).length === 1
  );
}
