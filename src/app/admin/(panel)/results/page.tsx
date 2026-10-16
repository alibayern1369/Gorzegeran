import { CheckCircle2, Clock, PencilLine, Swords, Filter } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/guard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchStatusBadge, MatchTypeBadge } from "@/components/league/badges";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { ResultForm, DeleteResultButton } from "@/components/admin/result-form";
import { loadLeagueData } from "@/lib/queries";
import { type PlayerSeed } from "@/lib/constants";
import { formatJalaliDate, formatTime, toPersianDigits } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const data = await loadLeagueData();
  const PLAYER_BY_ID = data.playerById;

  const pending = data.engineMatches
    .filter((m) => m.status !== "completed" && m.status !== "cancelled")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.id - b.id);

  const completed = data.engineMatches
    .filter((m) => m.status === "completed")
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt) || b.id - a.id);

  const cancelled = data.engineMatches.filter((m) => m.status === "cancelled");

  return (
    <div>
      <div className="mb-5">
        <h1 className="flex items-center gap-2.5 text-2xl font-black">
          <Swords className="size-6 text-victory" aria-hidden />
          مدیریت نتایج
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          ثبت، ویرایش و حذف نتایج مسابقات — تمام آمارهای لیگ به‌صورت خودکار
          بازمحاسبه می‌شوند.
        </p>
      </div>

      <Tabs defaultValue={params.edit === "1" ? "edit" : "record"}>
        <TabsList>
          <TabsTrigger value="record">
            <CheckCircle2 className="size-4" aria-hidden />
            ثبت نتیجه ({toPersianDigits(pending.length)})
          </TabsTrigger>
          <TabsTrigger value="edit">
            <PencilLine className="size-4" aria-hidden />
            ویرایش نتایج ({toPersianDigits(completed.length)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record">
          {pending.length === 0 ? (
            <Card className="p-10 text-center text-sm text-[var(--text-faint)]">
              مسابقه‌ای در انتظار ثبت نتیجه وجود ندارد. 🎉
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {pending.map((m) => (
                <Card key={m.id} className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <MatchTypeBadge type={m.matchType} />
                    <div className="flex items-center gap-1.5">
                      <span className="num text-[11px] text-[var(--text-faint)]">
                        {formatJalaliDate(m.scheduledAt)} —{" "}
                        {formatTime(m.scheduledAt)}
                      </span>
                      <MatchStatusBadge status={m.status} />
                    </div>
                  </div>
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
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="edit">
          {completed.length === 0 ? (
            <Card className="p-10 text-center text-sm text-[var(--text-faint)]">
              هنوز نتیجه‌ای ثبت نشده است.
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {completed.map((m) => {
                const a = PLAYER_BY_ID.get(m.playerAId) as PlayerSeed;
                const b = PLAYER_BY_ID.get(m.playerBId) as PlayerSeed;
                const aWon = m.winnerId === m.playerAId;
                return (
                  <Card key={m.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <MatchTypeBadge type={m.matchType} />
                      <div className="flex flex-1 items-center gap-2">
                        <PlayerAvatar player={a} size={32} />
                        <span
                          className={`text-sm font-bold ${aWon ? "text-victory" : "text-[var(--text-muted)]"}`}
                        >
                          {a.name}
                        </span>
                        <span className="num clay-pressed rounded-lg px-2.5 py-1 text-sm font-black">
                          {toPersianDigits(m.towersA!)} —{" "}
                          {toPersianDigits(m.towersB!)}
                        </span>
                        <span
                          className={`text-sm font-bold ${!aWon ? "text-victory" : "text-[var(--text-muted)]"}`}
                        >
                          {b.name}
                        </span>
                        <PlayerAvatar player={b} size={32} />
                      </div>
                      <span className="num text-[11px] text-[var(--text-faint)]">
                        {formatJalaliDate(m.scheduledAt)}
                      </span>
                      <DeleteResultButton matchId={m.id} />
                    </div>
                    <details className="mt-3">
                      <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-royal-light">
                        <PencilLine className="size-3.5" aria-hidden />
                        ویرایش این نتیجه
                      </summary>
                      <div className="mt-3 rounded-2xl border border-[var(--border)] p-4">
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
                          mode="edit"
                          compact
                        />
                      </div>
                    </details>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {cancelled.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold">
            <Filter className="size-4 text-[var(--text-faint)]" aria-hidden />
            مسابقات لغوشده ({toPersianDigits(cancelled.length)})
          </h2>
          <p className="text-xs text-[var(--text-faint)]">
            مسابقات لغوشده در جدول امتیازات لحاظ نمی‌شوند.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cancelled.map((m) => (
              <Badge key={m.id} variant="muted" className="num">
                #{toPersianDigits(m.id)}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export { Clock };
