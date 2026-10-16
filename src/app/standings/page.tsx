import type { Metadata } from "next";
import { Trophy, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  StandingsTable,
  RankingRulesHint,
} from "@/components/league/standings-table";
import { loadLeagueData } from "@/lib/queries";
import { computeStandings, hasOfficialChampion } from "@/lib/engine/ranking";
import { CHAMPION_TITLE } from "@/lib/constants";
import { toPersianDigits } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "جدول رده‌بندی لیگ",
  description: "رتبه‌بندی کامل پهلوانان لیگ گرز گران؛ امتیازات، برج‌ها و تفاضل‌ها.",
};

export default async function StandingsPage() {
  const data = await loadLeagueData();
  const standings = computeStandings(data.enginePlayers, data.engineMatches, {
    isTournamentComplete: false,
  });
  const champion = hasOfficialChampion(standings);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-black sm:text-3xl">
            <Trophy className="size-7 text-gold" aria-hidden />
            جدول رده‌بندی لیگ
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {standings.isComplete
              ? "رتبه‌بندی نهایی فصل"
              : "رتبه‌بندی موقت — تا پایان مسابقات قابل تغییر است"}
          </p>
        </div>
        <Badge variant={champion ? "gold" : "muted"}>
          {champion
            ? `${CHAMPION_TITLE}: ${standings.rows[0]?.player.name}`
            : `${toPersianDigits(standings.completedMatches)} از ${toPersianDigits(standings.totalMatches)} مسابقه برگزار شده`}
        </Badge>
      </div>

      {!standings.isComplete && (
        <Card className="mb-5 border-elixir/30 bg-[linear-gradient(135deg,rgba(139,92,246,0.1),var(--surface))] p-4">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 size-4.5 shrink-0 text-elixir-light" aria-hidden />
            <p className="text-sm leading-7 text-[var(--text-muted)]">
              این جدول <strong className="text-[var(--text)]">موقت</strong> است و بر اساس
              مسابقات برگزارشده محاسبه می‌شود. مسابقات ناتمام هرگز باخت محسوب نمی‌شوند و
              رتبهٔ نهایی تا تکمیل همهٔ مسابقات و تعیین بازی‌های تکلیفی اعلام نخواهد شد.
            </p>
          </div>
        </Card>
      )}

      <StandingsTable rows={standings.rows} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RankingRulesHint />
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold">
            <Info className="size-4.5 text-royal-light" aria-hidden />
            محاسبهٔ امتیازها
          </h2>
          <ul className="space-y-2.5 text-sm leading-7 text-[var(--text-muted)]">
            <li>
              ✦ هر <strong className="text-victory">برد</strong> در مسابقهٔ انفرادی:{" "}
              <strong className="text-victory">۲ امتیاز</strong>
            </li>
            <li>
              ✦ هر <strong className="text-defeat">باخت</strong>: <strong className="text-defeat">۰ امتیاز</strong> (تعداد برج‌ها
              در امتیاز برد تأثیری ندارد)
            </li>
            <li>✦ نتیجهٔ مساوی در مسابقات انفرادی وجود ندارد</li>
            <li>
              ✦ تفاضل برج = برج‌های تخریب‌شده منهای برج‌های ازدست‌رفته
            </li>
            <li>
              ✦ نتیجهٔ رویارویی چهارمسابقه‌ای (۴–۰، ۳–۱، ۲–۲، ۱–۳، ۰–۴) به‌صورت خودکار
              محاسبه می‌شود
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
