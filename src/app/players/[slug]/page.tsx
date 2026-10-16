import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Swords,
  TrendingUp,
  Crown,
  Flame,
  CalendarDays,
  Award,
  Target,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/league/player-avatar";
import {
  RankBadge,
  MatchStatusBadge,
  MatchTypeBadge,
} from "@/components/league/badges";
import {
  MatchCard,
  EncounterScoreBadge,
} from "@/components/league/score-display";
import { LazyPlayerCharts } from "@/components/charts/lazy-player-charts";
import { getPlayerBySlug, loadLeagueData, toEngineMatch } from "@/lib/queries";
import { computeStandings } from "@/lib/engine/ranking";
import {
  computePlayerAggregate,
  computeHeadToHead,
  computeAchievements,
  computePlayerTimeline,
  upcomingMatchesFor,
} from "@/lib/engine/stats";
import { PLAYER_BY_ID, CHAMPION_TITLE, type PlayerSeed } from "@/lib/constants";
import {
  formatJalaliDate,
  toPersianDigits,
  toPersianNumber,
} from "@/lib/jalali";
import {
  MATCH_TYPE_LABELS,
  MATCH_TYPES,
  type MatchType,
} from "@/lib/engine/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);
  if (!player) return { title: "بازیکن یافت نشد" };
  return {
    title: `پروفایل ${player.name}`,
    description: `آمار کامل ${player.name} در لیگ گرز گران — ${player.title ?? ""}`,
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);
  if (!player) notFound();

  const data = await loadLeagueData();
  const PLAYER_BY_ID = data.playerById;
  const matches = data.engineMatches;
  const standings = computeStandings(data.enginePlayers, matches, {
    isTournamentComplete:
      data.engineMatches.length > 0 &&
      data.engineMatches.every(
        (m) => m.status === "completed" || m.status === "cancelled",
      ),
  });
  const row = standings.rows.find((r) => r.player.id === player.id);
  const agg = computePlayerAggregate(player.id, matches);
  const h2h = computeHeadToHead(player.id, data.enginePlayers, matches);
  const achievements = computeAchievements(data.enginePlayers, matches);
  const timeline = computePlayerTimeline(player.id, matches);
  const upcoming = upcomingMatchesFor(
    player.id,
    matches,
    new Date().toISOString(),
  );

  const seed = PLAYER_BY_ID.get(player.id) as PlayerSeed;
  const myAchievements = achievements.filter((a) =>
    a.holderIds.includes(player.id),
  );

  const completedMatches = matches
    .filter(
      (m) =>
        m.status === "completed" &&
        (m.playerAId === player.id || m.playerBId === player.id),
    )
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt) || b.id - a.id);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <Link
        href="/standings"
        className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-royal-light hover:underline"
      >
        <ChevronRight className="size-4" aria-hidden />
        بازگشت به جدول لیگ
      </Link>

      {/* سربرگ پروفایل */}
      <div
        className="clay relative overflow-hidden p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${seed.accent}22, var(--surface) 55%)`,
        }}
      >
        <div
          className="pointer-events-none absolute -start-10 -top-10 size-48 rounded-full blur-3xl"
          style={{ background: `${seed.accent}33` }}
          aria-hidden
        />
        <div className="flex flex-wrap items-center gap-5">
          <PlayerAvatar player={seed} size={96} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className="border-0 text-white"
                style={{ background: seed.accent }}
              >
                {seed.title}
              </Badge>
              {row && <RankBadge rank={row.rank} size="sm" />}
              {row?.rank === 1 && standings.isComplete && (
                <Badge variant="gold">
                  <Crown className="size-3.5" aria-hidden />
                  {CHAMPION_TITLE}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-black">{player.name}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              رتبهٔ فعلی:{" "}
              <strong className="text-[var(--text)]">
                {row ? `رتبه ${toPersianDigits(row.rank)}` : "—"}
              </strong>{" "}
              ·{" "}
              <span className="num text-gold">
                {toPersianDigits(row?.points ?? 0)}
              </span>{" "}
              امتیاز
            </p>
          </div>
          <div className="flex gap-3">
            <HeroStat label="برد" value={agg.won} color="text-victory" />
            <HeroStat label="باخت" value={agg.lost} color="text-defeat" />
            <HeroStat
              label="تفاضل برج"
              value={agg.towerDiff}
              color={agg.towerDiff >= 0 ? "text-gold" : "text-defeat"}
              signed
            />
          </div>
        </div>
      </div>

      {/* نمای کلی عملکرد */}
      <section className="mt-6" aria-label="نمای کلی عملکرد">
        <h2 className="mb-4 text-xl font-extrabold">نمای کلی عملکرد</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <OverviewCard
            icon={<Swords className="size-4.5 text-royal-light" />}
            label="مسابقات"
            value={agg.played}
          />
          <OverviewCard
            icon={<TrendingUp className="size-4.5 text-victory" />}
            label="درصد برد"
            value={`${toPersianNumber(Math.round(agg.winRate * 100))}٪`}
          />
          <OverviewCard
            icon={<Flame className="size-4.5 text-gold" />}
            label="برج تخریب‌شده"
            value={agg.towersFor}
          />
          <OverviewCard
            icon={<Target className="size-4.5 text-elixir-light" />}
            label="برج ازدست‌رفته"
            value={agg.towersAgainst}
          />
        </div>
      </section>

      {/* افتخارات */}
      {myAchievements.length > 0 && (
        <section className="mt-8" aria-label="افتخارات">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold">
            <Award className="size-5 text-gold" aria-hidden />
            افتخارات خودکار
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myAchievements.map((a) => (
              <div key={a.key} className="clay-sm border-gold/30 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-gold" aria-hidden />
                  <p className="text-sm font-extrabold">{a.label}</p>
                  {a.shared && (
                    <Badge variant="muted" className="text-[10px]">
                      مشترک
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--text-faint)]">
                  {a.description}
                </p>
                <p className="num mt-2 text-lg font-black text-gold">
                  {toPersianDigits(a.value)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* نمودارها */}
      <section className="mt-8" aria-label="نمودارهای عملکرد">
        <h2 className="mb-4 text-xl font-extrabold">نمودارهای عملکرد</h2>
        <LazyPlayerCharts
          timeline={timeline.map((t) => ({
            at: t.at,
            cumulativePoints: t.cumulativePoints,
            cumulativeTowers: t.cumulativeTowers,
            opponentName: PLAYER_BY_ID.get(t.opponentId)?.name ?? "",
            won: t.won,
          }))}
          won={agg.won}
          lost={agg.lost}
          byType={Object.keys(agg.byMatchType).map((type) => ({
            type,
            won: agg.byMatchType[type]?.won ?? 0,
            lost: agg.byMatchType[type]?.lost ?? 0,
          }))}
        />
      </section>

      {/* رویارویی مستقیم */}
      <section className="mt-8" aria-label="آمار رویارویی مستقیم">
        <h2 className="mb-4 text-xl font-extrabold">آمار رویارویی مستقیم</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {h2h.map((record) => {
            const opponent = PLAYER_BY_ID.get(record.opponentId) as PlayerSeed;
            return (
              <div key={record.opponentId} className="clay-sm p-4">
                <div className="flex items-center gap-3">
                  <PlayerAvatar player={opponent} size={40} />
                  <div className="flex-1">
                    <p className="text-sm font-extrabold">
                      {player.name} در برابر {opponent.name}
                    </p>
                    <p className="num mt-0.5 text-xs text-[var(--text-muted)]">
                      {toPersianDigits(record.won)} برد —{" "}
                      {toPersianDigits(record.lost)} باخت
                    </p>
                  </div>
                  <EncounterScoreBadge
                    winsA={record.won}
                    winsB={record.lost}
                    nameA={player.name}
                    nameB={opponent.name}
                    complete={record.encounterComplete}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-2.5 text-center text-xs">
                  <div>
                    <p className="text-[var(--text-faint)]">برج زده</p>
                    <p className="num font-extrabold">
                      {toPersianDigits(record.towersFor)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-faint)]">برج خورده</p>
                    <p className="num font-extrabold">
                      {toPersianDigits(record.towersAgainst)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-faint)]">تفاضل</p>
                    <p className="num font-extrabold">
                      {record.towerDiff > 0
                        ? `+${toPersianNumber(record.towerDiff)}`
                        : toPersianNumber(record.towerDiff)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* تاریخچهٔ مسابقات */}
      <section className="mt-8" aria-label="تاریخچه مسابقات">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold">
          <CalendarDays className="size-5 text-royal-light" aria-hidden />
          تاریخچهٔ مسابقات
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {completedMatches.map((m) => {
            const isA = m.playerAId === player.id;
            const opponent = PLAYER_BY_ID.get(
              isA ? m.playerBId : m.playerAId,
            ) as PlayerSeed;
            const won = m.winnerId === player.id;
            const my = isA ? m.towersA! : m.towersB!;
            const opp = isA ? m.towersB! : m.towersA!;
            return (
              <div key={m.id} className="clay-sm p-4">
                <div className="flex items-center justify-between">
                  <MatchTypeBadge type={m.matchType} />
                  <span className="num text-[11px] text-[var(--text-faint)]">
                    {formatJalaliDate(m.scheduledAt)}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <PlayerAvatar player={opponent} size={38} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">
                      در برابر <strong>{opponent.name}</strong>
                    </p>
                    <p className="num mt-0.5 text-xs text-[var(--text-muted)]">
                      {toPersianDigits(my)} — {toPersianDigits(opp)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={won ? "victory" : "defeat"}>
                      {won ? "برد" : "باخت"}
                    </Badge>
                    <span className="num text-[11px] text-gold">
                      {won ? "+۲ امتیاز" : "۰ امتیاز"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {completedMatches.length === 0 && (
            <Card className="p-8 text-center text-sm text-[var(--text-faint)]">
              هنوز مسابقهٔ تکمیل‌شده‌ای وجود ندارد.
            </Card>
          )}
        </div>
      </section>

      {/* مسابقات پیش رو */}
      <section className="mt-8" aria-label="مسابقات پیش رو">
        <h2 className="mb-4 text-xl font-extrabold">مسابقات پیش رو</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
          {upcoming.length === 0 && (
            <Card className="p-8 text-center text-sm text-[var(--text-faint)]">
              مسابقهٔ پیش رویی زمان‌بندی نشده است.
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function HeroStat({
  label,
  value,
  color,
  signed = false,
}: {
  label: string;
  value: number;
  color: string;
  signed?: boolean;
}) {
  return (
    <div className="clay-sm min-w-20 px-4 py-3 text-center">
      <p className="text-[11px] text-[var(--text-faint)]">{label}</p>
      <p className={`num text-xl font-black ${color}`}>
        {signed && value > 0
          ? `+${toPersianNumber(value)}`
          : toPersianNumber(value)}
      </p>
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="clay-sm p-4">
      <div className="flex items-center gap-2">
        <span className="clay-pressed flex size-9 items-center justify-center rounded-xl">
          {icon}
        </span>
        <p className="text-xs font-bold text-[var(--text-muted)]">{label}</p>
      </div>
      <p className="num mt-2 text-2xl font-black">
        {typeof value === "number" ? toPersianDigits(value) : value}
      </p>
    </div>
  );
}

export { toEngineMatch, MatchStatusBadge };
