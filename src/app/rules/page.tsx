import type { Metadata } from "next";
import {
  ScrollText,
  Users,
  Swords,
  Trophy,
  Scale,
  CalendarDays,
  Crown,
  Flame,
  ShieldCheck,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAYER_SEEDS } from "@/lib/constants";
import { PlayerAvatar } from "@/components/league/player-avatar";
import {
  MATCH_TYPE_LABELS,
  MATCH_TYPES,
  MATCH_TYPE_LABELS_EN,
} from "@/lib/engine/types";
import { toPersianDigits } from "@/lib/jalali";

export const metadata: Metadata = {
  title: "آیین‌نامه رسمی لیگ گرز گران",
  description:
    "قوانین کامل لیگ گرز گران: ساختار مسابقات، امتیازدهی، رویارویی مستقیم، رتبه‌بندی و جوایز.",
};

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="clay mb-8 p-6 text-center sm:p-10">
        <Badge variant="gold" className="mx-auto">
          <ScrollText className="size-3.5" aria-hidden />
          سند رسمی مسابقات
        </Badge>
        <h1 className="mt-4 text-2xl font-black leading-snug sm:text-4xl">
          آیین‌نامه رسمی <span className="text-gradient-gold">لیگ گرز گران</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--text-muted)]">
          این آیین‌نامه مرجع نهایی تمام محاسبات، امتیازدهی‌ها و رتبه‌بندی‌های لیگ است و
          پیاده‌سازی نرم‌افزار دقیقاً مطابق همین قوانین انجام می‌شود.
        </p>
      </div>

      {/* شرکت‌کنندگان */}
      <Section
        icon={<Users className="size-5 text-royal-light" />}
        title="شرکت‌کنندگان لیگ"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PLAYER_SEEDS.map((p) => (
            <div key={p.id} className="clay-sm flex flex-col items-center gap-2 p-4">
              <PlayerAvatar player={p} size={56} />
              <p className="text-sm font-extrabold">{p.name}</p>
              <p className="text-[10px] text-[var(--text-faint)]">{p.title}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ساختار */}
      <Section
        icon={<CalendarDays className="size-5 text-elixir-light" />}
        title="ساختار تورنمنت"
      >
        <ul className="space-y-2.5 text-sm leading-8 text-[var(--text-muted)]">
          <li>
            ✦ <strong className="text-[var(--text)]">۵ بازیکن</strong> در یک دورهٔ کامل
            رفت‌وبرگشتی (تک‌لیگ) رقابت می‌کنند.
          </li>
          <li>
            ✦ هر بازیکن با{" "}
            <strong className="text-[var(--text)]">۴ حریف</strong> خود یک‌بار روبه‌رو
            می‌شود؛ مجموعاً{" "}
            <strong className="text-[var(--text)]">۱۰ رویارویی</strong>.
          </li>
          <li>
            ✦ هر رویارویی شامل{" "}
            <strong className="text-[var(--text)]">۴ مسابقه</strong> است: مجموعاً{" "}
            <strong className="text-[var(--text)]">۴۰ مسابقه</strong>.
          </li>
          <li>
            ✦ هر بازیکن در مجموع{" "}
            <strong className="text-[var(--text)]">۱۶ مسابقه</strong> انفرادی دارد.
          </li>
          <li>
            ✦ مسابقات در{" "}
            <strong className="text-[var(--text)]">۱۰ شب</strong> برگزار می‌شود؛ هر شب ۴
            مسابقه، ۲ رویارویی، ۴ بازیکن فعال و{" "}
            <strong className="text-[var(--text)]">۱ بازیکن در استراحت</strong>.
          </li>
          <li>
            ✦ هر بازیکن در ۸ شب بازی می‌کند و{" "}
            <strong className="text-[var(--text)]">۲ شب</strong> استراحت دارد.
          </li>
          <li>
            ✦ مسابقات در دو مرحله:{" "}
            <strong className="text-royal-light">مرحلهٔ یک</strong> (دک انتخابی و درفت
            نوع ۱) و <strong className="text-elixir-light">مرحلهٔ دو</strong> (درفت نوع ۲
            و اکسیر بی‌نهایت).
          </li>
        </ul>
      </Section>

      {/* انواع مسابقه */}
      <Section
        icon={<Swords className="size-5 text-gold" />}
        title="چهار نوع مسابقه"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {MATCH_TYPES.map((type, i) => (
            <div key={type} className="clay-sm p-4">
              <div className="flex items-center gap-2">
                <span className="clay-sm flex size-8 items-center justify-center rounded-xl bg-[var(--table-header)] text-sm font-black text-gold">
                  <span className="num">{toPersianDigits(i + 1)}</span>
                </span>
                <p className="text-sm font-extrabold">{MATCH_TYPE_LABELS[type]}</p>
                <Badge variant="muted" className="ms-auto text-[10px]">
                  {MATCH_TYPE_LABELS_EN[type]}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-6 text-[var(--text-faint)]">
                {type === "custom_deck" &&
                  "هر بازیکن با دک اختصاصی خود وارد نبرد می‌شود؛ آمادگی قبلی و انتخاب آزادانهٔ کارت‌ها."}
                {type === "draft_type_1" &&
                  "کارت‌ها به‌صورت درفت مبادله می‌شوند؛ تطبیق سریع و انتخاب هوشمند کلید پیروزی است."}
                {type === "draft_type_2" &&
                  "نسخهٔ دوم درفت با قوانین چیدمان متفاوت؛ شناخت عمیق‌تر از متا لازم است."}
                {type === "infinite_elixir" &&
                  "اکسیر بی‌نهایت؛ نبردهای پرتنش و سریع با بیشترین نیروهای ممکن روی زمین."}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* امتیازدهی */}
      <Section
        icon={<Trophy className="size-5 text-victory" />}
        title="سیستم امتیازدهی"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="clay-sm border-victory/30 p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-victory" aria-hidden />
              <p className="text-base font-extrabold text-victory">پیروزی = ۲ امتیاز</p>
            </div>
            <p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">
              فرقی نمی‌کند با چه نتیجه‌ای پیروز شوید: برد ۳–۰، ۲–۱ یا ۱–۰ همگی{" "}
              <strong>۲ امتیاز</strong> دارند.
            </p>
          </div>
          <div className="clay-sm border-defeat/30 p-5">
            <div className="flex items-center gap-2">
              <XCircle className="size-5 text-defeat" aria-hidden />
              <p className="text-base font-extrabold text-defeat">شکست = ۰ امتیاز</p>
            </div>
            <p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">
              باخت با هر نتیجه‌ای بدون امتیاز است؛ اما تعداد برج‌های تخریب‌شده در{" "}
              <strong>تفاضل برج</strong> لحاظ می‌شود.
            </p>
          </div>
        </div>
        <div className="clay-sm mt-3 border-elixir/30 p-5">
          <p className="text-sm font-extrabold">
            <XCircle className="inline size-4 text-elixir-light" aria-hidden /> نتیجهٔ مساوی
            وجود ندارد
          </p>
          <p className="mt-1.5 text-xs leading-6 text-[var(--text-muted)]">
            هر مسابقهٔ انفرادی دقیقاً یک برنده دارد. نتایجی مانند ۰–۰، ۱–۱ یا ۲–۲ توسط
            سامانه رد می‌شوند.
          </p>
        </div>
      </Section>

      {/* نتایج مجاز */}
      <Section
        icon={<ShieldCheck className="size-5 text-royal-light" />}
        title="نتایج معتبر مسابقه"
      >
        <p className="mb-3 text-sm leading-7 text-[var(--text-muted)]">
          امتیاز برج هر بازیکن باید عدد صحیح بین{" "}
          <strong className="text-[var(--text)]">۰ تا ۳</strong> باشد و نتیجه فقط در صورتی
          معتبر است که برنده مشخص و ترکیب امتیازات قانونی باشد:
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {["۱–۰", "۲–۰", "۲–۱", "۳–۰"].map((s) => (
            <div
              key={s}
              className="clay-sm border-victory/30 p-3 text-center text-lg font-black text-victory"
            >
              {s}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-6 text-[var(--text-faint)]">
          حالت‌های قرینه (۰–۱، ۰–۲، ۱–۲، ۰–۳) نیز معتبرند. پیروزی سه‌تاجی (۳) فقط با صفر
          بودن تاج حریف پذیرفته می‌شود؛ نتایجی مانند ۳–۱ یا ۳–۲ نامعتبرند.
        </p>
      </Section>

      {/* تفاضل برج */}
      <Section
        icon={<Scale className="size-5 text-elixir-light" />}
        title="محاسبهٔ تفاضل برج"
      >
        <div className="clay-sm p-5 text-center">
          <p className="text-lg font-extrabold">
            تفاضل برج = برج‌های تخریب‌شده منهای برج‌های ازدست‌رفته
          </p>
        </div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <ExampleRow score="۳–۰" diff="+۳" />
          <ExampleRow score="۲–۱" diff="+۱" />
          <ExampleRow score="۱–۲" diff="−۱" />
          <ExampleRow score="۰–۳" diff="−۳" />
        </div>
      </Section>

      {/* رویارویی */}
      <Section
        icon={<Swords className="size-5 text-gold" />}
        title="نتیجهٔ رویارویی چهارمسابقه‌ای"
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {[
            { s: "۴–۰", p: "۸ — ۰" },
            { s: "۳–۱", p: "۶ — ۲" },
            { s: "۲–۲", p: "۴ — ۴" },
            { s: "۱–۳", p: "۲ — ۶" },
            { s: "۰–۴", p: "۰ — ۸" },
          ].map((x) => (
            <div key={x.s} className="clay-sm p-3 text-center">
              <p className="text-xl font-black">{x.s}</p>
              <p className="num mt-1 text-xs text-[var(--text-faint)]">
                امتیازها: {x.p}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
          نتیجهٔ رویارویی به‌صورت خودکار از مسابقات چهارگانه محاسبه می‌شود و قابل تغییر
          دستی نیست. تساوی ۲–۲ یعنی رویارویی مساوی است، نه این‌که مسابقه‌ای مساوی شده
          باشد. برای رویارویی‌های ناتمام، نتیجهٔ موقت نمایش داده می‌شود.
        </p>
      </Section>

      {/* رتبه‌بندی */}
      <Section
        icon={<Crown className="size-5 text-gold" />}
        title="معیارهای رتبه‌بندی لیگ"
      >
        <ol className="space-y-2.5">
          {[
            "مجموع امتیازات لیگ",
            "نتیجهٔ رویارویی مستقیم (بازی‌های تکمیل‌شدهٔ دو بازیکن)",
            "تفاضل کلی برج‌ها",
            "مجموع برج‌های تخریب‌شده",
            "بازی تکلیفی (فقط وقتی همهٔ معیارها برابر بمانند)",
          ].map((text, i) => (
            <li key={text} className="clay-sm flex items-center gap-3 p-3.5">
              <span className="clay-sm flex size-8 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#fcd34d,#f5b942)] text-sm font-black text-[#3d2c05]">
                <span className="num">{toPersianDigits(i + 1)}</span>
              </span>
              <p className="text-sm font-bold text-[var(--text-muted)]">{text}</p>
            </li>
          ))}
        </ol>
        <div className="clay-sm mt-3 p-5">
          <p className="text-sm font-extrabold">تساوی دو بازیکن</p>
          <p className="mt-1.5 text-xs leading-6 text-[var(--text-muted)]">
            اگر دو بازیکن امتیاز برابر داشته باشند، برندهٔ رویارویی مستقیم‌شان بالاتر
            می‌ایستد — حتی اگر تفاضل برج کمتری داشته باشد. اگر رویارویی ۲–۲ شده باشد،
            تفاضل برج و سپس برج‌های تخریب‌شده تعیین‌کننده است.
          </p>
          <p className="mt-2 text-sm font-extrabold">تساوی سه بازیکن یا بیشتر</p>
          <p className="mt-1.5 text-xs leading-6 text-[var(--text-muted)]">
            مینی‌لیگ متشکل از بازیکنان هم‌امتیاز برگزار می‌شود: امتیازات، تفاضل برج و
            برج‌های تخریب‌شده در بازی‌های میان خودشان ملاک است. رتبه‌بندی کاملاً قطعی و
            مستقل از ترتیب دریافت داده‌هاست.
          </p>
        </div>
      </Section>

      {/* قهرمانی */}
      <Section
        icon={<Crown className="size-5 text-gold" />}
        title="عنوان قهرمانی — شهریار گرز گران"
      >
        <p className="text-sm leading-7 text-[var(--text-muted)]">
          عنوان <strong className="text-gradient-gold">شهریار گرز گران</strong> به صدرنشین
          نهایی جدول تعلق می‌گیرد. تا پایان همهٔ مسابقات و تعیین قطعی رتبه‌ها (از جمله
          بازی‌های تکلیفی احتمالی)، قهرمان رسمی اعلام نمی‌شود و صدرنشینی فعلی موقت خواهد
          بود.
        </p>
      </Section>

      {/* دژگشا */}
      <Section
        icon={<Flame className="size-5 text-gold" />}
        title="جایزهٔ دژگشای برتر"
      >
        <p className="text-sm leading-7 text-[var(--text-muted)]">
          <strong className="text-gradient-gold">دژگشای برتر</strong> به بازیکنی می‌رسد که
          بیشترین مجموع برج‌های تخریب‌شده را داشته باشد. این جایزه مستقل از قهرمانی لیگ
          است و معیارهای آن عبارتند از:
        </p>
        <ol className="mt-3 space-y-1.5 pr-5 text-xs leading-6 text-[var(--text-faint)]">
          <li>۱. مجموع برج‌های تخریب‌شده</li>
          <li>۲. میانگین برج در هر مسابقهٔ برگزارشده</li>
          <li>۳. تفاضل کلی برج‌ها</li>
        </ol>
      </Section>

      {/* زمان‌بندی */}
      <Section
        icon={<CalendarDays className="size-5 text-royal-light" />}
        title="زمان‌بندی مسابقات"
      >
        <ul className="space-y-2 text-sm leading-7 text-[var(--text-muted)]">
          <li>
            ✦ مسابقات پس از نیمه‌شب به وقت{" "}
            <strong className="text-[var(--text)]">تهران</strong> برگزار می‌شود.
          </li>
          <li>
            ✦ هر شب چهار اسلات:{" "}
            <span className="num">۰۰:۰۰</span>، <span className="num">۰۰:۱۵</span>،{" "}
            <span className="num">۰۰:۳۰</span> و <span className="num">۰۰:۴۵</span>.
          </li>
          <li>✦ هر مسابقه حداکثر ۱۰ دقیقه و فاصلهٔ بین اسلات‌ها ۵ دقیقه است.</li>
          <li>✦ هیچ دو مسابقه‌ای هم‌زمان برگزار نمی‌شود.</li>
          <li>✦ هر بازیکن حداکثر ۲ مسابقه در یک شب دارد.</li>
          <li>
            ✦ تاریخ شروع رسمی:{" "}
            <strong className="text-[var(--text)]">شنبه ۲۵ مهر ۱۴۰۵</strong> (۲۰۲۶-۱۰-۱۷).
          </li>
        </ul>
      </Section>

      {/* ثبت نتایج */}
      <Section
        icon={<ShieldCheck className="size-5 text-victory" />}
        title="ثبت نتایج و مقررات اجرایی"
      >
        <ul className="space-y-2 text-sm leading-7 text-[var(--text-muted)]">
          <li>✦ فقط مدیر لیگ مجاز به ثبت و ویرایش نتایج است.</li>
          <li>
            ✦ نتایج نامعتبر (تساوی، امتیاز منفی، بیش از ۳، ترکیب غیرقانونی) پذیرفته
            نمی‌شوند.
          </li>
          <li>
            ✦ مسابقهٔ لغوشده در جدول امتیازات لحاظ نمی‌شود؛ مسابقهٔ ناتمام هرگز باخت
            محسوب نمی‌شود.
          </li>
          <li>
            ✦ ویرایش نتیجه با بازمحاسبهٔ کامل آمار همراه است و گزارش تغییرات ثبت می‌شود.
          </li>
          <li>
            ✦ مسابقات تکلیفی (در صورت لزوم) هیچ امتیازی به فصل عادی اضافه نمی‌کنند و
            فقط تعیین‌کنندهٔ رتبه هستند.
          </li>
        </ul>
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 flex items-center gap-2.5 text-xl font-extrabold">
        <span className="clay-sm flex size-10 items-center justify-center rounded-2xl">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ExampleRow({ score, diff }: { score: string; diff: string }) {
  return (
    <div className="clay-sm flex items-center justify-between p-3.5">
      <span className="text-base font-extrabold">{score}</span>
      <span
        className={`num rounded-lg px-2.5 py-1 text-sm font-black ${
          diff.startsWith("+")
            ? "bg-victory/12 text-victory"
            : "bg-defeat/12 text-defeat"
        }`}
      >
        {diff}
      </span>
    </div>
  );
}
