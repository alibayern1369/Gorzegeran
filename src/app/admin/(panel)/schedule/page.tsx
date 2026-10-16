import { CalendarRange, Moon, Clock } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/guard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchTypeBadge, MatchStatusBadge } from "@/components/league/badges";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { loadLeagueData } from "@/lib/queries";
import { PLAYER_BY_ID, PLAYER_SEEDS, type PlayerSeed } from "@/lib/constants";
import {
  formatJalaliDateWithWeekday,
  formatTime,
  isSameTehranDay,
  toPersianDigits,
  relativeDayLabel,
} from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  await requireAdminPage();
  const data = await loadLeagueData();
  const now = new Date();

  const nights = new Map<number, typeof data.engineMatches>();
  for (const m of data.engineMatches) {
    if (!nights.has(m.nightIndex)) nights.set(m.nightIndex, []);
    nights.get(m.nightIndex)!.push(m);
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="flex items-center gap-2.5 text-2xl font-black">
          <CalendarRange className="size-6 text-gold" aria-hidden />
          برنامه زمان‌بندی
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          برنامهٔ قطعی ۱۰ شبته — ثابت و مبتنی بر الگوریتم رفت‌وبرگشتی. برای تغییر وضعیت
          هر مسابقه به بخش «مدیریت مسابقات» مراجعه کنید.
        </p>
      </div>

      <div className="space-y-4">
        {[...nights.entries()].sort((a, b) => a[0] - b[0]).map(([night, list]) => {
          const sorted = [...list].sort((x, y) => x.slotIndex - y.slotIndex);
          const first = sorted[0]!;
          const isToday = isSameTehranDay(first.scheduledAt, now);
          const active = new Set<number>();
          for (const m of sorted) {
            active.add(m.playerAId);
            active.add(m.playerBId);
          }
          const resting = PLAYER_SEEDS.find((p) => !active.has(p.id))!;

          return (
            <Card key={night} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#2563eb,#8b5cf6)] font-black text-white">
                    <span className="num">{toPersianDigits(night + 1)}</span>
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold">
                      {formatJalaliDateWithWeekday(first.scheduledAt)}
                    </h2>
                    <p className="text-xs text-[var(--text-faint)]">
                      {relativeDayLabel(first.scheduledAt)} · مرحلهٔ{" "}
                      {night < 5 ? "یک" : "دو"}
                    </p>
                  </div>
                  {isToday && <Badge variant="gold">امشب</Badge>}
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] px-3 py-1.5">
                  <Moon className="size-3.5 text-elixir-light" aria-hidden />
                  <span className="text-xs text-[var(--text-muted)]">استراحت:</span>
                  <PlayerAvatar player={resting} size={22} />
                  <span className="text-xs font-bold">{resting.name}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {sorted.map((m) => {
                  const a = PLAYER_BY_ID.get(m.playerAId) as PlayerSeed;
                  const b = PLAYER_BY_ID.get(m.playerBId) as PlayerSeed;
                  return (
                    <div
                      key={m.id}
                      className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[var(--border)] px-3 py-2.5"
                    >
                      <span className="num flex items-center gap-1 text-xs text-[var(--text-faint)]">
                        <Clock className="size-3.5" aria-hidden />
                        {formatTime(m.scheduledAt)}
                      </span>
                      <MatchTypeBadge type={m.matchType} />
                      <MatchStatusBadge status={m.status} />
                      <div className="flex flex-1 items-center gap-2">
                        <PlayerAvatar player={a} size={26} />
                        <span className="text-sm font-bold">{a.name}</span>
                        <span className="text-xs text-[var(--text-faint)]">در برابر</span>
                        <span className="text-sm font-bold">{b.name}</span>
                        <PlayerAvatar player={b} size={26} />
                      </div>
                      <span className="num text-[11px] text-[var(--text-faint)]">
                        مسابقهٔ #{toPersianDigits(m.id)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
