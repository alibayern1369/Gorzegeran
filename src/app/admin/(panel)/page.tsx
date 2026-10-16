import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/guard";
import {
  Swords,
  CalendarDays,
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  Crown,
  ScrollText,
  ListChecks,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/league/animated-counter";
import { ProgressBar } from "@/components/league/progress-bar";
import { MatchCard } from "@/components/league/score-display";
import { loadLeagueData } from "@/lib/queries";
import { computeStandings } from "@/lib/engine/ranking";
import {
  computeLeagueSummary,
  computeTowerLeaders,
} from "@/lib/engine/stats";
import { toPersianDigits, formatJalaliDate, formatTime } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdminPage();
  const data = await loadLeagueData();
  const nowIso = new Date().toISOString();
  const standings = computeStandings(data.enginePlayers, data.engineMatches, {
    isTournamentComplete: false,
  });
  const summary = computeLeagueSummary(data.engineMatches, nowIso);
  const towerLeaders = computeTowerLeaders(data.enginePlayers, data.engineMatches);
  const leader = standings.rows[0]!;
  const towerLeader = towerLeaders[0]!;

  const pendingMatches = data.engineMatches
    .filter((m) => m.status !== "completed" && m.status !== "cancelled")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.id - b.id)
    .slice(0, 4);

  return (
    <div>
      {/* آمار */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<CheckCircle2 className="size-5 text-victory" />}
          label="مسابقات برگزارشده"
          value={summary.completedMatches}
        />
        <StatCard
          icon={<Clock className="size-5 text-royal-light" />}
          label="مسابقات باقی‌مانده"
          value={summary.remainingMatches}
        />
        <StatCard
          icon={<Crown className="size-5 text-gold" />}
          label="رهبر لیگ"
          text={leader.player.name}
          suffix={`${toPersianDigits(leader.points)} امتیاز`}
        />
        <StatCard
          icon={<Flame className="size-5 text-elixir-light" />}
          label="دژگشای برتر"
          text={towerLeader.player.name}
          suffix={`${toPersianDigits(towerLeader.towersDestroyed)} برج`}
        />
      </div>

      {/* پیشرفت */}
      <Card className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">پیشرفت تورنمنت</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              <span className="num text-gold">{toPersianDigits(summary.completedMatches)}</span>{" "}
              از <span className="num">{toPersianDigits(summary.totalMatches)}</span> مسابقه
              ثبت نتیجه شده است
              {summary.liveMatches > 0 && (
                <Badge variant="live" className="ms-2">
                  {toPersianDigits(summary.liveMatches)} در حال برگزاری
                </Badge>
              )}
            </p>
          </div>
          <div className="min-w-52">
            <ProgressBar
              value={summary.completedMatches}
              max={summary.totalMatches}
              showPercent
            />
          </div>
        </div>
      </Card>

      {/* اقدامات سریع */}
      <section className="mt-6" aria-label="اقدامات سریع">
        <h2 className="mb-3 text-lg font-extrabold">اقدامات سریع</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <QuickAction
            href="/admin/results"
            icon={<Swords className="size-5 text-victory" />}
            label="ثبت نتیجه"
          />
          <QuickAction
            href="/admin/results?edit=1"
            icon={<ScrollText className="size-5 text-royal-light" />}
            label="ویرایش نتیجه"
          />
          <QuickAction
            href="/admin/matches"
            icon={<ListChecks className="size-5 text-elixir-light" />}
            label="مدیریت مسابقات"
          />
          <QuickAction
            href="/admin/schedule"
            icon={<CalendarDays className="size-5 text-gold" />}
            label="برنامه زمان‌بندی"
          />
          <QuickAction
            href="/admin/players"
            icon={<Users className="size-5 text-royal-light" />}
            label="مدیریت بازیکنان"
          />
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* نتایج اخیر */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">آخرین نتایج ثبت‌شده</h2>
            <Button asChild variant="link" size="sm">
              <Link href="/admin/results">مدیریت نتایج</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {summary.latestResults.length > 0 ? (
              summary.latestResults.slice(0, 3).map((m) => (
                <MatchCard key={m.id} match={m} compact />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-[var(--text-faint)]">
                هنوز نتیجه‌ای ثبت نشده است.
              </p>
            )}
          </div>
        </Card>

        {/* مسابقات پیش رو */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">مسابقات پیش رو</h2>
            <Button asChild variant="link" size="sm">
              <Link href="/admin/matches">ثبت سریع نتیجه</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {pendingMatches.length > 0 ? (
              pendingMatches.map((m) => (
                <div key={m.id}>
                  <MatchCard match={m} compact />
                  <p className="num mt-1 text-center text-[10px] text-[var(--text-faint)]">
                    {formatJalaliDate(m.scheduledAt)} — {formatTime(m.scheduledAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-[var(--text-faint)]">
                مسابقه‌ای در انتظار برگزاری نیست.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* خلاصهٔ جدول */}
      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Trophy className="size-5 text-gold" aria-hidden />
            وضعیت جدول لیگ
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/standings">جدول کامل</Link>
          </Button>
        </div>
        <ul className="mt-4 space-y-2">
          {standings.rows.map((row) => (
            <li
              key={row.player.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3.5 py-2.5"
            >
              <span className="flex items-center gap-2.5 text-sm font-bold">
                <span className="num w-6 text-center text-[var(--text-faint)]">
                  {toPersianDigits(row.rank)}
                </span>
                {row.player.name}
              </span>
              <span className="num text-sm font-extrabold text-gold">
                {toPersianDigits(row.points)} امتیاز
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
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
      <p className="mt-2 text-xl font-black">
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

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="clay-btn flex flex-col items-center gap-2 p-4 text-sm font-extrabold transition-transform hover:-translate-y-1"
    >
      <span className="clay-pressed flex size-11 items-center justify-center rounded-2xl">
        {icon}
      </span>
      {label}
    </Link>
  );
}
