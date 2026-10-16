import Link from "next/link";
import { Swords, Trophy, ShieldX, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchStatusBadge, MatchTypeBadge } from "@/components/league/badges";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { PLAYER_BY_ID, type PlayerSeed } from "@/lib/constants";
import {
  formatJalaliDate,
  formatTime,
  toPersianDigits,
  relativeDayLabel,
} from "@/lib/jalali";
import { MATCH_TYPE_LABELS, type EngineMatch } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: EngineMatch;
  showDate?: boolean;
  compact?: boolean;
}

export function MatchCard({ match, showDate = true, compact = false }: MatchCardProps) {
  const a = PLAYER_BY_ID.get(match.playerAId) as PlayerSeed;
  const b = PLAYER_BY_ID.get(match.playerBId) as PlayerSeed;
  const completed = match.status === "completed" && match.towersA !== null;
  const aWon = completed && match.winnerId === match.playerAId;

  return (
    <Link
      href={`/matches/${match.id}`}
      className={cn(
        "clay-sm block p-4 transition-transform hover:-translate-y-0.5",
        compact && "p-3",
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <MatchTypeBadge type={match.matchType} />
        <div className="flex items-center gap-1.5">
          {showDate && (
            <span className="num text-[11px] text-[var(--text-faint)]">
              {relativeDayLabel(match.scheduledAt)} · {formatTime(match.scheduledAt)}
            </span>
          )}
          <MatchStatusBadge status={match.status} />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <PlayerSide player={a} won={completed ? aWon : null} align="start" />
        <div className="flex flex-col items-center gap-1 px-1">
          {completed ? (
            <span className="clay-pressed num flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-lg font-extrabold">
              {toPersianDigits(match.towersA!)}
              <span className="text-[var(--text-faint)]">—</span>
              {toPersianDigits(match.towersB!)}
            </span>
          ) : (
            <span className="clay-pressed rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--text-muted)]">
              {formatTime(match.scheduledAt)}
            </span>
          )}
          {completed && (
            <Badge variant={aWon ? "victory" : "defeat"} className="text-[10px]">
              <Trophy className="size-3" aria-hidden />
              {aWon ? a.name : b.name}
            </Badge>
          )}
        </div>
        <PlayerSide player={b} won={completed ? !aWon : null} align="end" />
      </div>
    </Link>
  );
}

function PlayerSide({
  player,
  won,
  align,
}: {
  player: PlayerSeed;
  won: boolean | null;
  align: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2",
        align === "end" && "flex-row-reverse text-end",
      )}
    >
      <PlayerAvatar player={player} size={40} />
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-sm font-extrabold",
            won === true && "text-victory",
            won === false && "text-[var(--text-muted)]",
          )}
        >
          {player.name}
        </p>
        <p className="truncate text-[10px] text-[var(--text-faint)]">{player.title}</p>
      </div>
    </div>
  );
}

/** کارت نتیجهٔ برجسته برای مسابقهٔ تکمیل‌شده */
export function ScoreShowcase({ match }: { match: EngineMatch }) {
  const a = PLAYER_BY_ID.get(match.playerAId) as PlayerSeed;
  const b = PLAYER_BY_ID.get(match.playerBId) as PlayerSeed;
  const aWon = match.winnerId === match.playerAId;
  const winner = aWon ? a : b;

  return (
    <Card className="overflow-hidden">
      <div className="gold-sheen absolute inset-x-0 top-0 h-1" aria-hidden />
      <div className="text-center">
        <Badge variant="gold" className="mx-auto">
          <Trophy className="size-3.5" aria-hidden />
          نتیجهٔ نهایی
        </Badge>
        <div className="mt-5 flex items-center justify-center gap-4 sm:gap-8">
          <BigPlayer player={a} won={aWon} />
          <div className="flex flex-col items-center">
            <span className="num flex items-baseline gap-2 text-4xl font-extrabold sm:text-5xl">
              <span className={aWon ? "text-victory" : "text-[var(--text-muted)]"}>
                {toPersianDigits(match.towersA!)}
              </span>
              <span className="text-2xl text-[var(--text-faint)]">—</span>
              <span className={!aWon ? "text-victory" : "text-[var(--text-muted)]"}>
                {toPersianDigits(match.towersB!)}
              </span>
            </span>
            <MatchTypeBadge type={match.matchType} className="mt-2" />
          </div>
          <BigPlayer player={b} won={!aWon} />
        </div>
        <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--table-header)] px-5 py-2.5">
          <Sparkles className="size-4 text-gold" aria-hidden />
          <span className="text-sm font-extrabold">
            برنده: <span className="text-gradient-gold">{winner.name}</span> — امتیاز کسب‌شده:{" "}
            <span className="num">۲</span>
          </span>
        </div>
      </div>
    </Card>
  );
}

function BigPlayer({ player, won }: { player: PlayerSeed; won: boolean }) {
  return (
    <div className="flex w-24 flex-col items-center gap-2 sm:w-32">
      <span className={cn(!won && "opacity-60 grayscale-[0.35]")}>
        <PlayerAvatar player={player} size={72} />
      </span>
      <p className="text-center text-sm font-extrabold">{player.name}</p>
      {won ? (
        <Badge variant="victory">
          <Trophy className="size-3" aria-hidden /> برد
        </Badge>
      ) : (
        <Badge variant="defeat">
          <ShieldX className="size-3" aria-hidden /> باخت
        </Badge>
      )}
    </div>
  );
}

export function MatchTypeLabel({ type }: { type: EngineMatch["matchType"] }) {
  return <span>{MATCH_TYPE_LABELS[type]}</span>;
}

export function EncounterScoreBadge({
  winsA,
  winsB,
  nameA,
  nameB,
  complete,
}: {
  winsA: number;
  winsB: number;
  nameA: string;
  nameB: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={winsA > winsB ? "victory" : winsA === winsB ? "default" : "defeat"}>
        <Swords className="size-3" aria-hidden />
        <span className="num">
          {toPersianDigits(winsA)} — {toPersianDigits(winsB)}
        </span>
      </Badge>
      <span className="text-xs text-[var(--text-faint)]">
        {complete
          ? winsA === winsB
            ? `${nameA} و ${nameB} — رویارویی مساوی`
            : `${winsA > winsB ? nameA : nameB} برندهٔ رویارویی`
          : "رویارویی ناتمام"}
      </span>
    </div>
  );
}
