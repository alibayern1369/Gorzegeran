import Link from "next/link";
import {
  Swords,
  CalendarDays,
  Trophy,
  Flame,
  Crown,
  ChevronLeft,
  Sparkles,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrophyHero } from "@/components/league/trophy-hero";
import { MatchCard } from "@/components/league/score-display";
import { StandingsTable, RankingRulesHint } from "@/components/league/standings-table";
import { ProgressBar } from "@/components/league/progress-bar";
import { AnimatedCounter } from "@/components/league/animated-counter";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { RankBadge } from "@/components/league/badges";
import { loadLeagueData } from "@/lib/queries";
import { computeStandings, hasOfficialChampion } from "@/lib/engine/ranking";
import {
  computeLeagueSummary,
  computeTowerLeaders,
} from "@/lib/engine/stats";
import {
  CHAMPION_TITLE,
  PLAYER_BY_ID,
  TOWER_LEADER_TITLE,
  TOURNAMENT_NAME,
  TOURNAMENT_SUBTITLE,
  type PlayerSeed,
} from "@/lib/constants";
import {
  formatJalaliDateWithWeekday,
  formatTime,
  toPersianDigits,
  relativeDayLabel,
} from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await loadLeagueData();
  const nowIso = new Date().toISOString();

  const standings = computeStandings(data.enginePlayers, data.engineMatches, {
    isTournamentComplete: false,
  });
  const summary = computeLeagueSummary(data.engineMatches, nowIso);
  const towerLeaders = computeTowerLeaders(data.enginePlayers, data.engineMatches);
  const leader = standings.rows[0]!;
  const towerLeader = towerLeaders[0]!;
  const championDecided = hasOfficialChampion(standings);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        <div className="clay relative overflow-hidden p-6 sm:p-10">
          <div
            className="pointer-events-none absolute -start-16 -top-16 size-64 rounded-full bg-elixir/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -end-20 bottom-[-4rem] size-72 rounded-full bg-royal/20 blur-3xl"
            aria-hidden
          />
          <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <Badge variant="gold" className="mb-4">
                <Sparkles className="size-3.5" aria-hidden />
                فصل یکم — جام پنج پهلوان
              </Badge>
              <h1 className="text-3xl font-black leading-tight sm:text-5xl">
                <span className="text-gradient-gold">{TOURNAMENT_NAME}</span>
              </h1>
              <p className="mt-2 text-lg font-bold text-[var(--text-muted)] sm:text-2xl">
                {TOURNAMENT_SUBTITLE}
              </p>
              <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--text-muted)]">
                پنج پهلوان، ده شب نبرد، چهل مسابقهٔ سرنوشت‌ساز. هر برد{" "}
                <strong className="text-victory">۲ امتیاز</strong>، هر برج یک گام نزدیک‌تر
                به تاج <strong className="text-gradient-gold">{CHAMPION_TITLE}</strong>.
              </p>

              <div className="mt-6 max-w-md">
                <ProgressBar
                  value={summary.completedMatches}
                  max={summary.totalMatches}
                  label="پیشرفت مسابقات"
                  showPercent={false}
                />
                <p className="mt-2 text-sm font-bold text-[var(--text-muted)]">
                  <span className="num text-gold">
                    {toPersianDigits(summary.completedMatches)}
                  </span>{" "}
                  مسابقه از{" "}
                  <span className="num">{toPersianDigits(summary.totalMatches)}</span> مسابقه
                  برگزار شده
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="gold" size="lg">
                  <Link href="/standings">
                    <Trophy className="size-5" aria-hidden />
                    جدول رده‌بندی
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/schedule">
                    <CalendarDays className="size-5" aria-hidden />
                    برنامه مسابقات
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xs">
              <TrophyHero className="clay-float mx-auto w-full drop-shadow-[0_20px_45px_rgba(245,185,66,0.35)]" />
              <div className="clay-sm absolute bottom-2 start-0 p-3">
                <p className="text-[10px] text-[var(--text-faint)]">صدرنشین اکنون</p>
                <div className="mt-1 flex items-center gap-2">
                  <PlayerAvatar player={PLAYER_BY_ID.get(leader.player.id) as PlayerSeed} size={32} />
                  <div>
                    <p className="text-xs font-extrabold">{leader.player.name}</p>
                    <p className="num text-[10px] text-gold">
                      {toPersianDigits(leader.points)} امتیاز
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── آمار سریع ───────── */}
      <section className="mt-8" aria-label="آمار سریع">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={<Swords className="size-5 text-royal-light" />}
            label="مسابقات برگزارشده"
            value={summary.completedMatches}
            suffix={`از ${toPersianDigits(summary.totalMatches)}`}
          />
          <StatCard
            icon={<CalendarDays className="size-5 text-elixir-light" />}
            label="مسابقات باقی‌مانده"
            value={summary.remainingMatches}
            suffix="مسابقه"
          />
          <StatCard
            icon={<Crown className="size-5 text-gold" />}
            label="رهبر لیگ"
            text={leader.player.name}
            suffix={`${toPersianDigits(leader.points)} امتیاز`}
          />
          <StatCard
            icon={<Flame className="size-5 text-victory" />}
            label={TOWER_LEADER_TITLE}
            text={towerLeader.player.name}
            suffix={`${toPersianDigits(towerLeader.towersDestroyed)} برج`}
          />
        </div>
      </section>

      {/* ───────── مسابقهٔ بعدی ───────── */}
      {summary.nextMatch && (
        <section className="mt-8" aria-label="مسابقه بعدی">
          <Card className="border-royal/30 bg-[linear-gradient(135deg,rgba(37,99,235,0.14),var(--surface))]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge variant="royal">
                  <Target className="size-3.5" aria-hidden />
                  مسابقهٔ بعدی
                </Badge>
                <p className="mt-2 text-sm font-bold text-[var(--text-muted)]">
                  {formatJalaliDateWithWeekday(summary.nextMatch.scheduledAt)} — ساعت{" "}
                  <span className="num">{formatTime(summary.nextMatch.scheduledAt)}</span>
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  {(PLAYER_BY_ID.get(summary.nextMatch.playerAId) as PlayerSeed).name} در برابر{" "}
                  {(PLAYER_BY_ID.get(summary.nextMatch.playerBId) as PlayerSeed).name}
                </p>
              </div>
              <Button asChild variant="primary">
                <Link href={`/matches/${summary.nextMatch.id}`}>
                  جزئیات مسابقه
                  <ChevronLeft className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* ───────── جدول لیگ ───────── */}
      <section className="mt-10" aria-label="جدول رده‌بندی">
        <SectionHeader
          title="جدول رده‌بندی لیگ"
          subtitle={standings.isComplete ? "رتبه‌بندی نهایی" : "رتبه‌بندی موقت تا این لحظه"}
          href="/standings"
          linkLabel="جدول کامل"
        />
        <StandingsTable rows={standings.rows} compact />
        <RankingRulesHint />
      </section>

      {/* ───────── نتایج اخیر و مسابقات پیش رو ───────── */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeader title="آخرین نتایج" href="/schedule" linkLabel="همه نتایج" />
          <div className="flex flex-col gap-3">
            {summary.latestResults.length > 0 ? (
              summary.latestResults.map((m) => (
                <MatchCard key={m.id} match={m} showDate />
              ))
            ) : (
              <EmptyState text="هنوز نتیجه‌ای ثبت نشده است." />
            )}
          </div>
        </div>
        <div>
          <SectionHeader title="مسابقات پیش رو" href="/schedule" linkLabel="برنامه کامل" />
          <div className="flex flex-col gap-3">
            {upcomingSlice(data.engineMatches, nowIso).length > 0 ? (
              upcomingSlice(data.engineMatches, nowIso).map((m) => (
                <MatchCard key={m.id} match={m} showDate />
              ))
            ) : (
              <EmptyState text="مسابقهٔ زمان‌بندی‌شده‌ای باقی نمانده است." />
            )}
          </div>
        </div>
      </section>

      {/* ───────── دژگشایان برتر ───────── */}
      <section className="mt-10" aria-label="دژگشایان برتر">
        <SectionHeader
          title={TOWER_LEADER_TITLE}
          subtitle="برترین فاتحان برج‌های لیگ"
          href="/tower-leaders"
          linkLabel="جدول کامل"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {towerLeaders.slice(0, 5).map((row) => {
            const player = PLAYER_BY_ID.get(row.player.id) as PlayerSeed;
            return (
              <Link
                key={row.player.id}
                href={`/players/${player.slug}`}
                className="clay-sm flex items-center gap-3 p-4 transition-transform hover:-translate-y-1"
              >
                <RankBadge rank={row.rank} size="sm" />
                <PlayerAvatar player={player} size={42} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">{player.name}</p>
                  <p className="num text-xs text-gold">
                    {toPersianDigits(row.towersDestroyed)} برج تخریب‌شده
                  </p>
                  <p className="num text-[10px] text-[var(--text-faint)]">
                    میانگین {row.avgPerMatch.toFixed(2).replace(".", "٫").replace(/\d/g, (d) => toPersianDigits(Number(d)))} در هر بازی
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────── وضعیت قهرمانی ───────── */}
      <section className="mt-10" aria-label="وضعیت قهرمانی">
        <Card className="border-gold/30 bg-[linear-gradient(135deg,rgba(245,185,66,0.12),var(--surface))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="size-5 text-gold" aria-hidden />
              نشان {CHAMPION_TITLE}
            </CardTitle>
            <Badge variant={championDecided ? "gold" : "muted"}>
              {championDecided ? "قهرمان رسمی" : "در انتظار پایان مسابقات"}
            </Badge>
          </CardHeader>
          <CardContent>
            {championDecided ? (
              <p className="text-sm leading-7">
                <strong className="text-gradient-gold">{leader.player.name}</strong> با{" "}
                <span className="num">{toPersianDigits(leader.points)}</span> امتیاز،{" "}
                {CHAMPION_TITLE} فصل یکم است!
              </p>
            ) : (
              <p className="text-sm leading-7 text-[var(--text-muted)]">
                در حال حاضر{" "}
                <strong className="text-[var(--text)]">{leader.player.name}</strong> با{" "}
                <span className="num text-gold">{toPersianDigits(leader.points)}</span> امتیاز
                صدرنشین است، اما تا پایان همهٔ مسابقات و رفع هرگونه تساوی، قهرمان رسمی اعلام
                نمی‌شود.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function upcomingSlice(
  matches: Awaited<ReturnType<typeof loadLeagueData>>["engineMatches"],
  nowIso: string,
) {
  return matches
    .filter(
      (m) =>
        (m.status === "scheduled" || m.status === "postponed") && m.scheduledAt >= nowIso,
    )
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.id - b.id)
    .slice(0, 3);
}

function StatCard({
  icon,
  label,
  value,
  text,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  text?: string;
  suffix?: string;
}) {
  return (
    <div className="clay-sm p-4">
      <div className="flex items-center gap-2">
        <span className="clay-pressed flex size-9 items-center justify-center rounded-xl">
          {icon}
        </span>
        <p className="text-xs font-bold text-[var(--text-muted)]">{label}</p>
      </div>
      <p className="mt-2 text-xl font-black sm:text-2xl">
        {typeof value === "number" ? (
          <AnimatedCounter value={value} className="num" />
        ) : (
          text
        )}
      </p>
      {suffix && <p className="text-[11px] text-[var(--text-faint)]">{suffix}</p>}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-[var(--text-faint)]">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-bold text-royal-light hover:underline"
        >
          {linkLabel}
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="clay-sm p-8 text-center text-sm text-[var(--text-faint)]">{text}</div>
  );
}

export { relativeDayLabel };
