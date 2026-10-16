"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Info, ArrowLeftRight, AlertTriangle } from "lucide-react";
import { RankBadge } from "@/components/league/badges";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { Badge } from "@/components/ui/badge";
import { PLAYER_BY_ID, type PlayerSeed } from "@/lib/constants";
import { toPersianDigits, toPersianNumber } from "@/lib/jalali";
import type { PlayerStandingRow } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

interface StandingsTableProps {
  rows: PlayerStandingRow[];
  compact?: boolean;
  showTiebreakNote?: boolean;
}

export function StandingsTable({ rows, compact = false, showTiebreakNote = true }: StandingsTableProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div>
      {/* نسخهٔ دسکتاپ */}
      <div className="table-scroll hidden md:block">
        <table className="table-clay">
          <thead>
            <tr>
              <th scope="col">رتبه</th>
              <th scope="col">پهلوان</th>
              <th scope="col">بازی</th>
              <th scope="col">برد</th>
              <th scope="col">باخت</th>
              <th scope="col">امتیاز</th>
              <th scope="col">برج زده</th>
              <th scope="col">برج خورده</th>
              <th scope="col">تفاضل</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const player = PLAYER_BY_ID.get(row.player.id) as PlayerSeed;
              return (
                <motion.tr
                  key={row.player.id}
                  layout={!reduceMotion}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                  className={cn(row.rank === 1 && "relative")}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <RankBadge rank={row.rank} />
                      {row.requiresTiebreak && (
                        <Badge variant="elixir" title="نیاز به بازی تکلیفی">
                          <AlertTriangle className="size-3" aria-hidden />
                          تکلیفی
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/players/${player.slug}`}
                      className="flex items-center gap-3 transition-opacity hover:opacity-80"
                    >
                      <PlayerAvatar player={player} size={40} />
                      <span>
                        <span className="block text-sm font-extrabold text-[var(--text)]">
                          {player.name}
                        </span>
                        <span className="block text-[11px] text-[var(--text-faint)]">
                          {player.title}
                        </span>
                      </span>
                      {row.rank === 1 && (
                        <Badge variant="gold" className="ms-1">
                          صدرنشین
                        </Badge>
                      )}
                    </Link>
                  </td>
                  <td className="num text-center">{toPersianDigits(row.played)}</td>
                  <td className="num text-center text-victory">{toPersianDigits(row.won)}</td>
                  <td className="num text-center text-defeat">{toPersianDigits(row.lost)}</td>
                  <td className="text-center">
                    <span className="clay-sm num inline-flex min-w-10 items-center justify-center rounded-xl bg-[var(--table-header)] px-2.5 py-1 text-base font-extrabold text-gold">
                      {toPersianDigits(row.points)}
                    </span>
                  </td>
                  <td className="num text-center">{toPersianDigits(row.towersFor)}</td>
                  <td className="num text-center">{toPersianDigits(row.towersAgainst)}</td>
                  <td className="text-center">
                    <DiffValue value={row.towerDiff} />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* نسخهٔ موبایل */}
      <ul className="flex flex-col gap-2.5 md:hidden">
        {rows.map((row, index) => {
          const player = PLAYER_BY_ID.get(row.player.id) as PlayerSeed;
          return (
            <motion.li
              key={row.player.id}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link
                href={`/players/${player.slug}`}
                className={cn(
                  "clay-sm block p-3.5",
                  row.rank === 1 && "border-gold/40 bg-[linear-gradient(135deg,rgba(245,185,66,0.14),var(--surface))]",
                )}
              >
                <div className="flex items-center gap-3">
                  <RankBadge rank={row.rank} size="sm" />
                  <PlayerAvatar player={player} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-extrabold">{player.name}</p>
                      {row.requiresTiebreak && (
                        <Badge variant="elixir" className="scale-90 px-1.5 py-0.5 text-[9px]">
                          تکلیفی
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--text-faint)]">
                      {toPersianDigits(row.won)} برد · {toPersianDigits(row.lost)} باخت ·{" "}
                      {toPersianDigits(row.played)} بازی
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="clay-sm num rounded-lg bg-[var(--table-header)] px-2 py-0.5 text-lg font-extrabold text-gold">
                      {toPersianDigits(row.points)}
                    </span>
                    <DiffValue value={row.towerDiff} small />
                  </div>
                </div>
                {!compact && (
                  <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-2.5 text-center">
                    <MiniStat label="برج زده" value={row.towersFor} />
                    <MiniStat label="برج خورده" value={row.towersAgainst} />
                    <MiniStat label="تفاضل" value={row.towerDiff} diff />
                  </div>
                )}
              </Link>
            </motion.li>
          );
        })}
      </ul>

      {showTiebreakNote && rows.some((r) => r.requiresTiebreak) && (
        <div className="clay-sm mt-4 flex items-start gap-2.5 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
          <p className="text-xs leading-6 text-[var(--text-muted)]">
            برخی پهلوانان در تمام معیارهای رتبه‌بندی برابرند؛ رتبهٔ نهایی با{" "}
            <strong className="text-gold">بازی تکلیفی</strong> تعیین می‌شود.
          </p>
        </div>
      )}
    </div>
  );
}

function DiffValue({ value, small = false }: { value: number; small?: boolean }) {
  return (
    <span
      className={cn(
        "num inline-flex items-center justify-center rounded-lg font-extrabold",
        small ? "px-1.5 text-xs" : "min-w-9 px-2 py-1 text-sm",
        value > 0 && "bg-victory/12 text-victory",
        value < 0 && "bg-defeat/12 text-defeat",
        value === 0 && "bg-[var(--surface-2)] text-[var(--text-muted)]",
      )}
    >
      {value > 0 ? `+${toPersianNumber(value)}` : toPersianNumber(value)}
    </span>
  );
}

function MiniStat({
  label,
  value,
  diff = false,
}: {
  label: string;
  value: number;
  diff?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-[var(--text-faint)]">{label}</p>
      <p className="num text-sm font-extrabold">
        {diff
          ? value > 0
            ? `+${toPersianNumber(value)}`
            : toPersianNumber(value)
          : toPersianDigits(value)}
      </p>
    </div>
  );
}

export function RankingRulesHint() {
  return (
    <details className="clay-sm mt-4 p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[var(--text-muted)]">
        <Info className="size-4 text-royal-light" aria-hidden />
        معیارهای رتبه‌بندی لیگ
      </summary>
      <ol className="mt-3 space-y-1.5 pr-5 text-xs leading-6 text-[var(--text-faint)]">
        <li>۱. مجموع امتیازات لیگ (برد = ۲ امتیاز، باخت = ۰ امتیاز)</li>
        <li>۲. نتیجهٔ رویارویی مستقیم (بازی‌های دوطرفهٔ تکمیل‌شده)</li>
        <li>۳. تفاضل کلی برج‌ها</li>
        <li>۴. مجموع برج‌های تخریب‌شده</li>
        <li>۵. بازی تکلیفی (در صورت برابری کامل)</li>
      </ol>
    </details>
  );
}

export { ArrowLeftRight };
