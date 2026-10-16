import { getAllPlayers } from "@/lib/queries";
import { visualPlayer } from "@/lib/visual-players";
import { matchTypeLabel, matchTypeLabelEn } from "@/lib/engine/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Clock,
  Sparkles,
  ArrowDownUp,
  Trophy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchStatusBadge, MatchTypeBadge } from "@/components/league/badges";
import { ScoreShowcase, MatchCard } from "@/components/league/score-display";
import { Countdown } from "@/components/league/countdown";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { getMatchById, getAllMatches, toEngineMatch } from "@/lib/queries";
import { type PlayerSeed } from "@/lib/constants";
import { formatJalaliDateTime, toPersianDigits } from "@/lib/jalali";
import { MATCH_TYPE_LABELS, MATCH_TYPE_LABELS_EN } from "@/lib/engine/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatchById(Number(id));
  if (!match) return { title: "مسابقه یافت نشد" };
  const PLAYER_BY_ID = new Map(
    (await getAllPlayers()).map((p) => [p.id, visualPlayer(p)]),
  );
  const a = PLAYER_BY_ID.get(match.playerAId) as PlayerSeed;
  const b = PLAYER_BY_ID.get(match.playerBId) as PlayerSeed;
  return {
    title: `${a.name} در برابر ${b.name} — ${matchTypeLabel(match.matchType as keyof typeof MATCH_TYPE_LABELS)}`,
    description: "جزئیات کامل مسابقه لیگ گرز گران",
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const match = await getMatchById(numericId);
  if (!match) notFound();

  const PLAYER_BY_ID = new Map(
    (await getAllPlayers()).map((p) => [p.id, visualPlayer(p)]),
  );
  const a = PLAYER_BY_ID.get(match.playerAId) as PlayerSeed;
  const b = PLAYER_BY_ID.get(match.playerBId) as PlayerSeed;
  const completed = match.status === "completed" && match.towersA !== null;
  const aWon = completed && match.winnerId === match.playerAId;
  const engineMatch = toEngineMatch(match);

  // مسابقات مرتبط در همان رویارویی
  const all = (await getAllMatches()).map(toEngineMatch);
  const siblings = all
    .filter(
      (m) =>
        m.encounterId === engineMatch.encounterId && m.id !== engineMatch.id,
    )
    .sort((x, y) => x.slotIndex - y.slotIndex);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <Link
        href="/schedule"
        className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-royal-light hover:underline"
      >
        <ChevronRight className="size-4" aria-hidden />
        بازگشت به برنامه مسابقات
      </Link>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <MatchTypeBadge type={engineMatch.matchType} />
        <MatchStatusBadge status={match.status} />
        <Badge variant="muted" className="num">
          {formatJalaliDateTime(match.scheduledAt)}
        </Badge>
      </div>

      {completed ? (
        <ScoreShowcase match={engineMatch} />
      ) : (
        <Card>
          <div className="text-center">
            <Badge variant="royal" className="mx-auto">
              <Clock className="size-3.5" aria-hidden />
              مسابقهٔ پیش رو
            </Badge>
            <div className="mt-5 flex items-center justify-center gap-5 sm:gap-10">
              <PreMatchPlayer player={a} />
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-black text-[var(--text-faint)]">
                  VS
                </span>
                <MatchTypeBadge type={engineMatch.matchType} />
              </div>
              <PreMatchPlayer player={b} />
            </div>
            <p className="mt-5 text-sm font-bold text-[var(--text-muted)]">
              شروع مسابقه: {formatJalaliDateTime(match.scheduledAt)}
            </p>
            <div className="mt-3 flex justify-center">
              <Countdown targetIso={match.scheduledAt.toISOString()} />
            </div>
            <p className="mx-auto mt-4 max-w-md text-xs leading-6 text-[var(--text-faint)]">
              پس از پایان مسابقه، نتیجهٔ رسمی تنها توسط مدیر لیگ ثبت می‌شود.
              شمارش معکوس صفرشده به‌تنهایی مسابقه را «برگزارشده» نمی‌کند.
            </p>
          </div>
        </Card>
      )}

      {/* اطلاعات مسابقه */}
      <Card className="mt-5">
        <h2 className="mb-4 text-lg font-extrabold">اطلاعات مسابقه</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <InfoItem
            label="نوع مسابقه"
            value={matchTypeLabel(engineMatch.matchType)}
          />
          <InfoItem
            label="شناسهٔ انگلیسی نوع"
            value={matchTypeLabelEn(engineMatch.matchType)}
            mono
          />
          <InfoItem
            label="زمان برگزاری"
            value={formatJalaliDateTime(match.scheduledAt)}
          />
          <InfoItem
            label="شب مسابقات"
            value={`شب ${toPersianDigits(match.nightIndex + 1)}`}
          />
          {completed && (
            <>
              <InfoItem
                label="برنده"
                value={(aWon ? a : b).name}
                valueClassName="text-victory"
              />
              <InfoItem label="امتیاز کسب‌شده" value="۲ امتیاز لیگ" />
              <InfoItem
                label="تغییر تفاضل برج"
                value={
                  aWon
                    ? `${a.name}: +${toPersianDigits(match.towersA! - match.towersB!)} | ${b.name}: ${toPersianDigits(match.towersB! - match.towersA!)}`
                    : `${b.name}: +${toPersianDigits(match.towersB! - match.towersA!)} | ${a.name}: ${toPersianDigits(match.towersA! - match.towersB!)}`
                }
              />
              <InfoItem
                label="تاریخ ثبت نتیجه"
                value={
                  match.resultRecordedAt
                    ? formatJalaliDateTime(match.resultRecordedAt)
                    : "—"
                }
              />
            </>
          )}
        </dl>
      </Card>

      {/* مسابقات هم‌رویارویی */}
      {siblings.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
            <ArrowDownUp className="size-5 text-elixir-light" aria-hidden />
            دیگر مسابقات این رویارویی
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {siblings.map((m) => (
              <MatchCard key={m.id} match={m} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PreMatchPlayer({ player }: { player: PlayerSeed }) {
  return (
    <Link
      href={`/players/${player.slug}`}
      className="flex w-28 flex-col items-center gap-2 transition-transform hover:-translate-y-1 sm:w-36"
    >
      <PlayerAvatar player={player} size={80} />
      <p className="text-center text-base font-extrabold">{player.name}</p>
      <p className="text-center text-xs text-[var(--text-faint)]">
        {player.title}
      </p>
    </Link>
  );
}

function InfoItem({
  label,
  value,
  mono,
  valueClassName = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="clay-sm rounded-2xl p-3">
      <dt className="text-xs text-[var(--text-faint)]">{label}</dt>
      <dd className={`mt-1 font-bold ${mono ? "num" : ""} ${valueClassName}`}>
        {value}
      </dd>
    </div>
  );
}

export { Trophy, Sparkles };
