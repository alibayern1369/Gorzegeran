import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/league/player-avatar";
import { loadLeagueData } from "@/lib/queries";
import { matchTypeLabel } from "@/lib/engine/types";
import { formatJalaliDate, toPersianDigits } from "@/lib/jalali";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "آیین‌نامهٔ لیگ" };
export default async function RulesPage() {
  const data = await loadLeagueData();
  const types = data.settings?.matchTypes ?? [];
  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 sm:px-6">
      <h1 className="text-2xl font-black">آیین‌نامهٔ لیگ</h1>
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-bold">بازیکنان و ساختار مسابقات</h2>
        <div className="flex flex-wrap gap-4">
          {data.visualPlayers.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <PlayerAvatar player={p} size={36} />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-8">
          لیگ دارای {toPersianDigits(data.players.length)} بازیکن و{" "}
          {toPersianDigits(data.matches.length)} مسابقه است. هر جفت بازیکن{" "}
          {toPersianDigits(types.length)} بازی انجام می‌دهند. برنامه برای تعداد
          زوج و فرد بازیکنان ساخته می‌شود؛ در دورهای فرد یک نفر استراحت می‌کند.
        </p>
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="mb-3 text-lg font-bold">مدل‌های بازی در هر رویارویی</h2>
        <ol className="list-inside list-decimal space-y-2">
          {types.map((t, i) => (
            <li key={i}>{matchTypeLabel(t)}</li>
          ))}
        </ol>
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="mb-3 text-lg font-bold">شروع رسمی و برنامه</h2>
        <p className="text-sm leading-8">
          شروع رسمی:{" "}
          {formatJalaliDate(`${data.tournament.startDate}T12:00:00+03:30`)}،
          ساعت <span dir="ltr">{data.settings?.startTime ?? "00:00"}</span>{" "}
          تهران. فاصلهٔ دورها{" "}
          {toPersianDigits(data.tournament.nightIntervalDays)} روز و فاصلهٔ شروع
          بازی‌ها {toPersianDigits(data.settings?.slotMinutes ?? 15)} دقیقه است.
          مدیر می‌تواند زمان هر مسابقه را جداگانه تغییر دهد؛ زمان قطعی هر بازی
          در صفحهٔ برنامه نمایش داده می‌شود.
        </p>
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="mb-3 text-lg font-bold">امتیازدهی و نتیجهٔ معتبر</h2>
        <p className="text-sm leading-8">
          هر برد ۲ امتیاز و باخت صفر امتیاز دارد. تساوی مجاز نیست. نتایج مجاز
          ۱–۰، ۲–۰، ۲–۱ و ۳–۰ و حالت‌های معکوس هستند. پیروزی سه‌تاجی فقط برابر
          صفر تاج حریف معتبر است. تفاضل برج برابر برج زده منهای برج خورده است.
          بازی‌های ناتمام یا لغوشده در آمار رسمی شمرده نمی‌شوند.
        </p>
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="mb-3 text-lg font-bold">رتبه‌بندی و جوایز</h2>
        <p className="text-sm leading-8">
          ترتیب رتبه‌بندی: امتیاز لیگ، رویارویی مستقیم تکمیل‌شده، تفاضل برج و
          برج زده. برای تساوی سه نفر یا بیشتر، مینی‌لیگ بین هم‌امتیازها محاسبه
          می‌شود. تساوی کامل در پایان به بازی تکلیفی نیاز دارد. رتبه‌بندی تا
          پایان مسابقات موقت است. دژگشای برتر بر اساس برج تخریب‌شده، سپس میانگین
          برج در هر بازی و تفاضل برج مشخص می‌شود.
        </p>
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="mb-3 text-lg font-bold">مدیریت تغییرات</h2>
        <p className="text-sm leading-8">
          تغییر نام، عکس، برنامه و نتیجه فقط در اختیار مدیر است و در تاریخچه ثبت
          می‌شود. حذف بازیکن با تأیید مدیر، مسابقات و نتایج مربوط به او را حذف
          می‌کند و جدول دوباره محاسبه می‌شود.
        </p>
      </Card>
    </div>
  );
}
