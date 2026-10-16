import type { Metadata } from "next";
import { CalendarDays, Moon, ListFilter, CalendarRange } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchCard } from "@/components/league/score-display";
import { ScheduleFilters } from "@/components/league/schedule-filters";
import { loadLeagueData } from "@/lib/queries";
import { PLAYER_BY_ID, PLAYER_SEEDS, type PlayerSeed } from "@/lib/constants";
import {
  formatJalaliDate,
  formatJalaliDateWithWeekday,
  formatTime,
  isSameTehranDay,
  toPersianDigits,
  relativeDayLabel,
} from "@/lib/jalali";
import {
  MATCH_TYPE_LABELS,
  MATCH_TYPES,
  MATCH_STATUS_LABELS,
  type EngineMatch,
  type MatchStatus,
  type MatchType,
} from "@/lib/engine/types";
import { PlayerAvatar } from "@/components/league/player-avatar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "برنامه مسابقات",
  description:
    "برنامهٔ کامل مسابقات لیگ گرز گران در ده شب به همراه زمان‌بندی دقیق به وقت تهران.",
};

interface SearchParams {
  player?: string;
  type?: string;
  status?: string;
  view?: string;
  date?: string;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const data = await loadLeagueData();
  const now = new Date();

  let matches = data.engineMatches;

  const playerFilter = params.player ? Number(params.player) : null;
  if (playerFilter) {
    matches = matches.filter(
      (m) => m.playerAId === playerFilter || m.playerBId === playerFilter,
    );
  }
  if (params.type && MATCH_TYPES.includes(params.type as MatchType)) {
    matches = matches.filter((m) => m.matchType === params.type);
  }
  if (
    params.status &&
    ["scheduled", "live", "completed", "postponed", "cancelled"].includes(params.status)
  ) {
    matches = matches.filter((m) => m.status === params.status);
  }
  if (params.date) {
    matches = matches.filter((m) => m.scheduledAt.startsWith(params.date!));
  }

  // گروه‌بندی بر اساس شب مسابقات
  const nights = new Map<number, EngineMatch[]>();
  for (const m of data.engineMatches) {
    if (!nights.has(m.nightIndex)) nights.set(m.nightIndex, []);
    nights.get(m.nightIndex)!.push(m);
  }
  const filteredNights = new Map<number, EngineMatch[]>();
  for (const m of matches) {
    if (!filteredNights.has(m.nightIndex)) filteredNights.set(m.nightIndex, []);
    filteredNights.get(m.nightIndex)!.push(m);
  }

  const restByNight = new Map<number, number>();
  for (const [night, list] of nights) {
    const active = new Set<number>();
    for (const m of list) {
      active.add(m.playerAId);
      active.add(m.playerBId);
    }
    const resting = PLAYER_SEEDS.find((p) => !active.has(p.id));
    if (resting) restByNight.set(night, resting.id);
  }

  const view = params.view === "calendar" ? "calendar" : "list";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-black sm:text-3xl">
          <CalendarDays className="size-7 text-royal-light" aria-hidden />
          برنامه مسابقات
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          ده شب نبرد؛ هر شب چهار مسابقه پس از نیمه‌شب به وقت تهران (۰۰:۰۰ تا ۰۰:۴۵)
        </p>
      </div>

      <ScheduleFilters
        view={view}
        nights={(() => {
          const seen = new Set<number>();
          const out: Array<{ night: number; dateIso: string; dateLabel: string }> = [];
          for (const m of data.engineMatches) {
            if (seen.has(m.nightIndex)) continue;
            seen.add(m.nightIndex);
            out.push({
              night: m.nightIndex + 1,
              dateIso: m.scheduledAt.slice(0, 10),
              dateLabel: formatJalaliDate(m.scheduledAt),
            });
          }
          return out.sort((a, b) => a.night - b.night);
        })()}
      />

      {view === "calendar" ? (
        <CalendarView
          nights={nights}
          restByNight={restByNight}
          now={now}
          filtered={filteredNights}
        />
      ) : (
        <div className="mt-6 space-y-6">
          {[...filteredNights.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([night, list]) => {
              const first = list[0] ?? nights.get(night)?.[0];
              if (!first) return null;
              const isToday = isSameTehranDay(first.scheduledAt, now);
              const restingId = restByNight.get(night);
              const resting = restingId
                ? (PLAYER_BY_ID.get(restingId) as PlayerSeed)
                : null;
              return (
                <section key={night} aria-label={`شب ${night + 1}`}>
                  <Card className="p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#2563eb,#8b5cf6)] font-black text-white">
                          <span className="num">{toPersianDigits(night + 1)}</span>
                        </span>
                        <div>
                          <h2 className="text-base font-extrabold">
                            {formatJalaliDateWithWeekday(first.scheduledAt)}
                          </h2>
                          <p className="text-xs text-[var(--text-faint)]">
                            {relativeDayLabel(first.scheduledAt)} · شب{" "}
                            {toPersianDigits(night + 1)} از {toPersianDigits(10)}
                          </p>
                        </div>
                        {isToday && (
                          <Badge variant="gold">امشب</Badge>
                        )}
                      </div>
                      {resting && (
                        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] px-3 py-1.5">
                          <Moon className="size-3.5 text-elixir-light" aria-hidden />
                          <span className="text-xs text-[var(--text-muted)]">
                            استراحت:
                          </span>
                          <PlayerAvatar player={resting} size={22} />
                          <span className="text-xs font-bold">{resting.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {list
                        .sort((a, b) => a.slotIndex - b.slotIndex)
                        .map((m) => (
                          <div key={m.id} className="relative">
                            <span className="num absolute end-3 top-3 z-10 rounded-lg bg-[var(--surface-2)] px-2 py-0.5 text-[10px] text-[var(--text-faint)]">
                              {formatTime(m.scheduledAt)}
                            </span>
                            <MatchCard match={m} showDate={false} compact />
                          </div>
                        ))}
                    </div>
                  </Card>
                </section>
              );
            })}
          {filteredNights.size === 0 && (
            <Card className="p-10 text-center text-sm text-[var(--text-faint)]">
              مسابقه‌ای با فیلترهای انتخاب‌شده یافت نشد.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function CalendarView({
  nights,
  restByNight,
  now,
  filtered,
}: {
  nights: Map<number, EngineMatch[]>;
  restByNight: Map<number, number>;
  now: Date;
  filtered: Map<number, EngineMatch[]>;
}) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[...nights.entries()].sort((a, b) => a[0] - b[0]).map(([night, list]) => {
        const first = list[0]!;
        const isToday = isSameTehranDay(first.scheduledAt, now);
        const restingId = restByNight.get(night);
        const resting = restingId ? (PLAYER_BY_ID.get(restingId) as PlayerSeed) : null;
        const shown = filtered.get(night) ?? [];
        return (
          <div
            key={night}
            className={`clay-sm p-4 ${isToday ? "border-gold/50 bg-[linear-gradient(135deg,rgba(245,185,66,0.12),var(--surface))]" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold">
                  {formatJalaliDateWithWeekday(first.scheduledAt)}
                </p>
                <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">
                  شب {toPersianDigits(night + 1)} · ساعت{" "}
                  <span className="num">{formatTime(first.scheduledAt)}</span>
                </p>
              </div>
              {isToday && <Badge variant="gold">امشب</Badge>}
            </div>
            <div className="mt-3 space-y-1.5">
              {shown.length > 0 ? (
                shown
                  .sort((a, b) => a.slotIndex - b.slotIndex)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] px-2.5 py-1.5 text-[11px]"
                    >
                      <span className="font-bold">
                        {(PLAYER_BY_ID.get(m.playerAId) as PlayerSeed).name}
                        <span className="mx-1 text-[var(--text-faint)]">در برابر</span>
                        {(PLAYER_BY_ID.get(m.playerBId) as PlayerSeed).name}
                      </span>
                      <span className="text-[var(--text-faint)]">
                        {MATCH_TYPE_LABELS[m.matchType]}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-[10px] text-[var(--text-faint)]">—</p>
              )}
            </div>
            {resting && (
              <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--border)] pt-2.5 text-[10px] text-[var(--text-faint)]">
                <Moon className="size-3" aria-hidden />
                استراحت: {resting.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { ListFilter, CalendarRange };
