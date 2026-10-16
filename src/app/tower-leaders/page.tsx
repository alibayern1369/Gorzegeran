import type { Metadata } from "next";
import Link from "next/link";
import { Swords, Flame, TrendingDown, TrendingUp, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { RankBadge } from "@/components/league/badges";
import { AnimatedCounter } from "@/components/league/animated-counter";
import { loadLeagueData } from "@/lib/queries";
import { computeTowerLeaders } from "@/lib/engine/stats";
import { TOWER_LEADER_TITLE, PLAYER_BY_ID, type PlayerSeed } from "@/lib/constants";
import { toPersianDigits, toPersianNumber } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${TOWER_LEADER_TITLE} — برترین فاتحان برج‌ها`,
  description:
    "جدول برترین تخریب‌کنندگان برج در لیگ گرز گران؛ معادل کفش طلای مسابقات.",
};

export default async function TowerLeadersPage() {
  const data = await loadLeagueData();
  const leaders = computeTowerLeaders(data.enginePlayers, data.engineMatches);
  const top = leaders[0]!;
  const totalDestroyed = leaders.reduce((s, l) => s + l.towersDestroyed, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* سربرگ */}
      <div className="clay relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -start-12 -top-12 size-52 rounded-full bg-gold/15 blur-3xl"
          aria-hidden
        />
        <div className="flex flex-wrap items-center gap-5">
          <span className="clay-sm flex size-16 items-center justify-center rounded-3xl bg-[linear-gradient(145deg,#fcd34d,#d97706)] shadow-[0_12px_30px_rgba(245,185,66,0.4)]">
            <Swords className="size-8 text-[#3d2c05]" aria-hidden />
          </span>
          <div>
            <Badge variant="gold" className="mb-2">
              <Flame className="size-3.5" aria-hidden />
              جایزهٔ مستقل از قهرمانی لیگ
            </Badge>
            <h1 className="text-2xl font-black sm:text-4xl">
              <span className="text-gradient-gold">{TOWER_LEADER_TITLE}</span>
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)] sm:text-base">
              برترین فاتحان برج‌های لیگ
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MiniStat
            icon={<Flame className="size-4 text-gold" />}
            label="کل برج‌های تخریب‌شده"
            value={totalDestroyed}
          />
          <MiniStat
            icon={<Target className="size-4 text-victory" />}
            label={`رهبر فعلی: ${top.player.name}`}
            value={top.towersDestroyed}
            suffix="برج"
          />
          <MiniStat
            icon={<TrendingUp className="size-4 text-royal-light" />}
            label="میانگین رهبر در هر بازی"
            value={Math.round(top.avgPerMatch * 100) / 100}
            isDecimal
          />
        </div>
      </div>

      {/* رهبر ویژه */}
      <Card className="mt-6 border-gold/40 bg-[linear-gradient(135deg,rgba(245,185,66,0.14),var(--surface))]">
        <div className="flex flex-wrap items-center gap-5">
          <span className="gold-sheen clay-sm flex size-20 items-center justify-center rounded-full">
            <PlayerAvatar player={PLAYER_BY_ID.get(top.player.id) as PlayerSeed} size={72} />
          </span>
          <div className="flex-1">
            <Badge variant="gold">
              <Flame className="size-3.5" aria-hidden />
              نشان ویژهٔ {TOWER_LEADER_TITLE}
            </Badge>
            <h2 className="mt-2 text-2xl font-black">{top.player.name}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              <span className="num text-gold">{toPersianDigits(top.towersDestroyed)}</span> برج
              تخریب‌شده در{" "}
              <span className="num">{toPersianDigits(top.played)}</span> مسابقه — میانگین{" "}
              <span className="num">{toPersianNumber(top.avgPerMatch)}</span> برج در هر بازی
            </p>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: Math.min(top.towersDestroyed, 12) }).map((_, i) => (
              <TowerIcon key={i} />
            ))}
          </div>
        </div>
      </Card>

      {/* جدول کامل */}
      <div className="table-scroll mt-8">
        <table className="table-clay">
          <thead>
            <tr>
              <th scope="col">رتبه</th>
              <th scope="col">پهلوان</th>
              <th scope="col">برج‌های تخریب‌شده</th>
              <th scope="col">برج‌های ازدست‌رفته</th>
              <th scope="col">تفاضل برج‌ها</th>
              <th scope="col">میانگین برج در هر بازی</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((row, index) => {
              const player = PLAYER_BY_ID.get(row.player.id) as PlayerSeed;
              return (
                <tr key={row.player.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <RankBadge rank={row.rank} />
                      {row.tied && (
                        <Badge variant="muted" className="text-[10px]">
                          مشترک
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/players/${player.slug}`}
                      className="flex items-center gap-3 hover:opacity-80"
                    >
                      <PlayerAvatar player={player} size={38} />
                      <span>
                        <span className="block text-sm font-extrabold">{player.name}</span>
                        <span className="block text-[11px] text-[var(--text-faint)]">
                          {toPersianDigits(row.played)} مسابقه
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <span className="num text-lg font-extrabold text-gold">
                        {toPersianDigits(row.towersDestroyed)}
                      </span>
                      <div className="flex gap-0.5" aria-hidden>
                        {Array.from({ length: Math.min(row.towersDestroyed, 8) }).map((_, i) => (
                          <TowerIcon key={i} small />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="num text-center text-defeat">
                    {toPersianDigits(row.towersLost)}
                  </td>
                  <td className="text-center">
                    <span
                      className={`num inline-flex min-w-9 justify-center rounded-lg px-2 py-1 text-sm font-extrabold ${
                        row.towerDiff > 0
                          ? "bg-victory/12 text-victory"
                          : row.towerDiff < 0
                            ? "bg-defeat/12 text-defeat"
                            : "text-[var(--text-muted)]"
                      }`}
                    >
                      {row.towerDiff > 0
                        ? `+${toPersianNumber(row.towerDiff)}`
                        : toPersianNumber(row.towerDiff)}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="num rounded-lg bg-[var(--table-header)] px-2.5 py-1 text-sm font-extrabold">
                      {toPersianNumber(row.avgPerMatch)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold">
          <TrendingDown className="size-4.5 text-elixir-light" aria-hidden />
          معیارهای رتبه‌بندی دژگشا
        </h2>
        <ol className="space-y-1.5 pr-5 text-sm leading-7 text-[var(--text-muted)]">
          <li>۱. مجموع برج‌های تخریب‌شده (معیار اصلی)</li>
          <li>۲. میانگین برج تخریب‌شده در هر مسابقهٔ برگزارشده</li>
          <li>۳. تفاضل کلی برج‌ها</li>
        </ol>
        <p className="mt-3 text-xs leading-6 text-[var(--text-faint)]">
          در صورت برابری کامل معیارها، رتبه‌ها به‌صورت مشترک نمایش داده می‌شوند. آمار این
          جدول با هر ثبت یا ویرایش نتیجه، به‌صورت خودکار به‌روز می‌شود.
        </p>
      </Card>
    </div>
  );
}

function TowerIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 20"
      width={small ? 10 : 18}
      height={small ? 13 : 23}
      aria-hidden
      className="drop-shadow-[0_2px_4px_rgba(245,185,66,0.4)]"
    >
      <path d="M3 8h10v10H3z" fill="#F5B942" />
      <path d="M2 4h2v3H2zM7 3h2v4H7zM12 4h2v3h-2z" fill="#FCD34D" />
      <rect x="6" y="12" width="4" height="6" rx="1" fill="#B45309" />
    </svg>
  );
}

function MiniStat({
  icon,
  label,
  value,
  suffix,
  isDecimal = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  isDecimal?: boolean;
}) {
  return (
    <div className="clay-sm p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-xl font-black">
        {isDecimal ? (
          <span className="num">{toPersianNumber(value)}</span>
        ) : (
          <AnimatedCounter value={value} className="num" />
        )}
        {suffix && <span className="ms-1 text-xs text-[var(--text-faint)]">{suffix}</span>}
      </p>
    </div>
  );
}
