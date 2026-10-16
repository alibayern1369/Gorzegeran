import { Users, ExternalLink } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/guard";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { RankBadge } from "@/components/league/badges";
import { loadLeagueData } from "@/lib/queries";
import { computeStandings } from "@/lib/engine/ranking";
import { computePlayerAggregate } from "@/lib/engine/stats";
import { PLAYER_BY_ID, type PlayerSeed } from "@/lib/constants";
import { toPersianDigits, toPersianNumber } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  await requireAdminPage();
  const data = await loadLeagueData();
  const standings = computeStandings(data.enginePlayers, data.engineMatches, {
    isTournamentComplete: false,
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="flex items-center gap-2.5 text-2xl font-black">
          <Users className="size-6 text-royal-light" aria-hidden />
          مدیریت بازیکنان
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          نمای کامل بازیکنان لیگ به همراه آمار و وضعیت فعلی. تغییر نام و هویت بصری از
          طریق seed و پایگاه داده انجام می‌شود.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.players.map((player) => {
          const seed = PLAYER_BY_ID.get(player.id) as PlayerSeed;
          const row = standings.rows.find((r) => r.player.id === player.id)!;
          const agg = computePlayerAggregate(player.id, data.engineMatches);
          return (
            <Card key={player.id} className="p-5">
              <div className="flex items-center gap-4">
                <PlayerAvatar player={seed} size={64} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black">{player.name}</h2>
                    <RankBadge rank={row.rank} size="sm" />
                  </div>
                  <p className="text-xs text-[var(--text-faint)]">
                    {player.title} ·{" "}
                    <span dir="ltr" className="num">
                      {player.slug}
                    </span>
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className="inline-block size-3.5 rounded-full"
                      style={{ background: player.accentColor }}
                      aria-hidden
                    />
                    <span className="num text-[10px] text-[var(--text-faint)]" dir="ltr">
                      {player.accentColor}
                    </span>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/players/${player.slug}`}>
                    <ExternalLink className="size-3.5" aria-hidden />
                    پروفایل
                  </Link>
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-2 text-center">
                <SmallStat label="بازی" value={toPersianDigits(agg.played)} />
                <SmallStat label="برد" value={toPersianDigits(agg.won)} />
                <SmallStat label="باخت" value={toPersianDigits(agg.lost)} />
                <SmallStat label="امتیاز" value={toPersianDigits(agg.points)} gold />
                <SmallStat
                  label="تفاضل"
                  value={
                    agg.towerDiff > 0
                      ? `+${toPersianNumber(agg.towerDiff)}`
                      : toPersianNumber(agg.towerDiff)
                  }
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="muted">
                  {toPersianDigits(agg.towersFor)} برج زده
                </Badge>
                <Badge variant="muted">
                  {toPersianDigits(agg.towersAgainst)} برج خورده
                </Badge>
                <Badge variant="muted">
                  {toPersianDigits(agg.threeCrownWins)} برد سه‌تاجی
                </Badge>
                <Badge variant="muted">
                  {toPersianNumber(Math.round(agg.winRate * 100))}٪ برد
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="clay-sm rounded-xl px-1 py-2">
      <p className="text-[10px] text-[var(--text-faint)]">{label}</p>
      <p className={`num text-sm font-black ${gold ? "text-gold" : ""}`}>{value}</p>
    </div>
  );
}
