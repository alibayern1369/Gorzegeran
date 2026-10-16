import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/guard";
import { ListChecks, ExternalLink, Ban, RotateCcw, Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MatchStatusBadge,
  MatchTypeBadge,
} from "@/components/league/badges";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { StatusForm } from "@/components/admin/status-form";
import { ResultForm } from "@/components/admin/result-form";
import { loadLeagueData } from "@/lib/queries";
import { PLAYER_BY_ID, type PlayerSeed } from "@/lib/constants";
import { formatJalaliDate, formatTime, toPersianDigits } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; night?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const data = await loadLeagueData();

  let matches = data.engineMatches;
  if (params.status) {
    matches = matches.filter((m) => m.status === params.status);
  }
  if (params.night) {
    matches = matches.filter((m) => m.nightIndex === Number(params.night) - 1);
  }
  matches = [...matches].sort(
    (a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.id - b.id,
  );

  return (
    <div>
      <div className="mb-5">
        <h1 className="flex items-center gap-2.5 text-2xl font-black">
          <ListChecks className="size-6 text-royal-light" aria-hidden />
          مدیریت مسابقات
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          وضعیت هر مسابقه را مدیریت کنید؛ برای ثبت سریع نتیجه از فرم هر مسابقه استفاده
          کنید.
        </p>
      </div>

      {/* فیلتر وضعیت */}
      <div className="mb-5 flex flex-wrap gap-2">
        <FilterLink active={!params.status} href="/admin/matches">
          همه
        </FilterLink>
        {(["scheduled", "live", "postponed", "completed", "cancelled"] as const).map(
          (status) => (
            <FilterLink
              key={status}
              active={params.status === status}
              href={`/admin/matches?status=${status}`}
            >
              {{
                scheduled: "زمان‌بندی‌شده",
                live: "در حال برگزاری",
                postponed: "به تعویق افتاده",
                completed: "برگزار شده",
                cancelled: "لغو شده",
              }[status]}
            </FilterLink>
          ),
        )}
      </div>

      <div className="flex flex-col gap-3">
        {matches.map((m) => {
          const a = PLAYER_BY_ID.get(m.playerAId) as PlayerSeed;
          const b = PLAYER_BY_ID.get(m.playerBId) as PlayerSeed;
          const completed = m.status === "completed";
          return (
            <Card key={m.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="clay-sm num flex size-10 items-center justify-center rounded-xl bg-[var(--table-header)] text-sm font-black">
                  #{toPersianDigits(m.id)}
                </span>
                <MatchTypeBadge type={m.matchType} />
                <MatchStatusBadge status={m.status} />
                <div className="flex flex-1 items-center gap-2">
                  <PlayerAvatar player={a} size={30} />
                  <span className="text-sm font-bold">{a.name}</span>
                  <span className="num text-sm font-black text-[var(--text-faint)]">
                    {completed ? `${toPersianDigits(m.towersA!)} — ${toPersianDigits(m.towersB!)}` : "در برابر"}
                  </span>
                  <span className="text-sm font-bold">{b.name}</span>
                  <PlayerAvatar player={b} size={30} />
                </div>
                <span className="num text-[11px] text-[var(--text-faint)]">
                  {formatJalaliDate(m.scheduledAt)} — {formatTime(m.scheduledAt)}
                </span>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/matches/${m.id}`}>
                    <ExternalLink className="size-3.5" aria-hidden />
                    جزئیات
                  </Link>
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
                {!completed && m.status !== "cancelled" && (
                  <>
                    <ResultForm
                      match={{
                        id: m.id,
                        playerAId: m.playerAId,
                        playerBId: m.playerBId,
                        matchType: m.matchType,
                        status: m.status,
                        towersA: m.towersA,
                        towersB: m.towersB,
                        winnerId: m.winnerId,
                        scheduledAt: m.scheduledAt,
                      }}
                      mode="record"
                    />
                    <StatusForm
                      matchId={m.id}
                      status={m.status}
                    />
                  </>
                )}
                {m.status === "cancelled" && (
                  <StatusForm matchId={m.id} status={m.status} />
                )}
                {completed && (
                  <Badge variant="victory">
                    <Radio className="size-3" aria-hidden />
                    نتیجه ثبت شده — از بخش «ویرایش نتایج» قابل تغییر است
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {matches.length === 0 && (
        <Card className="p-10 text-center text-sm text-[var(--text-faint)]">
          مسابقه‌ای با فیلتر انتخاب‌شده یافت نشد.
        </Card>
      )}
    </div>
  );
}

function FilterLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`clay-btn rounded-xl px-4 py-2 text-sm font-bold ${
        active ? "text-royal-light" : "text-[var(--text-muted)]"
      }`}
    >
      {children}
    </Link>
  );
}

export { Ban, RotateCcw };
