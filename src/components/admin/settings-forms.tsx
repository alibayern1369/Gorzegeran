"use client";
import { useActionState, useEffect, useState, useId } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { PlayerSeed } from "@/lib/constants";
import type { Branding } from "@/lib/branding";
import type { LeagueConfiguration } from "@/lib/services/league-admin";
import { MATCH_TYPES, matchTypeLabel } from "@/lib/engine/types";
import { gregorianToJalaliInTehran, toPersianDigits } from "@/lib/jalali";
import {
  savePlayerAction,
  deletePlayerAction,
  saveLeagueAction,
  saveBrandingAction,
  rescheduleMatchAction,
  type SettingsState,
} from "@/lib/actions/settings";

function useSettingsAction(
  action: (prev: SettingsState, form: FormData) => Promise<SettingsState>,
) {
  const [state, formAction, pending] = useActionState(action, {});
  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state]);
  return { state, formAction, pending };
}
function Feedback({ state }: { state: SettingsState }) {
  return state.error ? (
    <p role="alert" className="rounded-xl bg-defeat/10 p-3 text-sm text-defeat">
      {state.error}
    </p>
  ) : state.ok ? (
    <p role="status" className="text-sm text-victory">
      {state.message}
    </p>
  ) : null;
}
function Submit({
  pending,
  label = "ذخیره تغییرات",
}: {
  pending: boolean;
  label?: string;
}) {
  return (
    <Button type="submit" disabled={pending}>
      <Save className="size-4" />
      {pending ? "در حال ذخیره…" : label}
    </Button>
  );
}
export function ImageField({
  name,
  label,
  current,
}: {
  name: string;
  label: string;
  current?: string | null;
}) {
  const id = useId();
  const [preview, setPreview] = useState<string>();
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={`image-${id}`}>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {(preview ?? current) && (
          <img
            src={preview ?? current!}
            width={64}
            height={64}
            alt={`پیش‌نمایش ${label}`}
            className="size-16 rounded-xl object-cover"
          />
        )}
        <input
          id={`image-${id}`}
          name={name}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="w-full min-w-0 text-sm file:me-3 file:rounded-xl file:border-0 file:bg-[var(--surface-3)] file:p-2 file:text-[var(--text)]"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : undefined);
          }}
        />
      </div>
      <p className="text-xs text-[var(--text-faint)]">
        PNG، JPG یا WebP؛ حداکثر ۱ مگابایت. تصویر به‌صورت مربع ذخیره می‌شود.
      </p>
      {current && (
        <label className="flex items-center gap-2 text-sm">
          <input
            name={name === "photo" ? "removePhoto" : `remove-${name}`}
            type="checkbox"
          />
          حذف تصویر فعلی
        </label>
      )}
    </div>
  );
}
export function PlayerEditor({ player }: { player?: PlayerSeed }) {
  const { state, formAction, pending } = useSettingsAction(savePlayerAction);
  return (
    <form
      action={formAction}
      className="space-y-4"
      aria-label={player ? `ویرایش ${player.name}` : "افزودن بازیکن"}
    >
      <input type="hidden" name="id" value={player?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`name-${player?.id ?? "new"}`}>نام بازیکن</Label>
          <Input
            id={`name-${player?.id ?? "new"}`}
            name="name"
            defaultValue={player?.name}
            maxLength={120}
            required
          />
        </div>
        <div>
          <Label htmlFor={`title-${player?.id ?? "new"}`}>لقب</Label>
          <Input
            id={`title-${player?.id ?? "new"}`}
            name="title"
            defaultValue={player?.title}
            maxLength={160}
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`color-${player?.id ?? "new"}`}>رنگ بازیکن</Label>
        <Input
          id={`color-${player?.id ?? "new"}`}
          name="accentColor"
          type="color"
          defaultValue={player?.accent ?? "#2563eb"}
          className="w-24 p-1"
        />
      </div>
      <ImageField name="photo" label="عکس پروفایل" current={player?.photoUrl} />
      <Feedback state={state} />
      <Submit
        pending={pending}
        label={player ? "ذخیره بازیکن" : "افزودن بازیکن"}
      />
    </form>
  );
}
export function DeletePlayer({ player }: { player: PlayerSeed }) {
  const { state, formAction, pending } = useSettingsAction(deletePlayerAction);
  return (
    <details className="mt-4 border-t border-[var(--border)] pt-3">
      <summary className="cursor-pointer text-sm font-bold text-defeat">
        حذف بازیکن
      </summary>
      <form
        action={formAction}
        className="mt-3 space-y-3"
        onSubmit={(e) => {
          if (
            !window.confirm(
              `حذف ${player.name} و تمام مسابقات و نتایج مربوط به او؟`,
            )
          )
            e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={player.id} />
        <label className="flex items-start gap-2 text-sm leading-6">
          <input name="confirm" type="checkbox" required className="mt-1" />
          تأیید می‌کنم که {player.name} و تمام مسابقات و نتایج او حذف شوند و
          جدول لیگ دوباره محاسبه شود.
        </label>
        <Feedback state={state} />
        <Button type="submit" variant="danger" disabled={pending}>
          <Trash2 className="size-4" />
          {pending ? "در حال حذف…" : "حذف بازیکن و مسابقات او"}
        </Button>
      </form>
    </details>
  );
}
export function jalaliInput(iso: string) {
  const { jy, jm, jd } = gregorianToJalaliInTehran(
    new Date(iso.length === 10 ? `${iso}T12:00:00+03:30` : iso),
  );
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}
export function LeagueSettingsForm({
  config,
}: {
  config: LeagueConfiguration;
}) {
  const { state, formAction, pending } = useSettingsAction(saveLeagueAction);
  const [types, setTypes] = useState(config.matchTypes);
  return (
    <form
      action={formAction}
      className="space-y-5"
      aria-label="تنظیمات مسابقات"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startDate">تاریخ رسمی شروع (شمسی)</Label>
          <Input
            id="startDate"
            name="startDate"
            dir="ltr"
            defaultValue={jalaliInput(config.startDate)}
            placeholder="1405/07/25"
            required
          />
        </div>
        <div>
          <Label htmlFor="startTime">ساعت شروع به وقت تهران</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            dir="ltr"
            defaultValue={config.startTime}
            required
          />
        </div>
        <div>
          <Label htmlFor="nightIntervalDays">فاصلهٔ شب‌ها (روز)</Label>
          <Input
            id="nightIntervalDays"
            name="nightIntervalDays"
            type="number"
            min={1}
            max={30}
            defaultValue={config.nightIntervalDays}
            required
          />
        </div>
        <div>
          <Label htmlFor="slotMinutes">فاصلهٔ شروع بازی‌ها (دقیقه)</Label>
          <Input
            id="slotMinutes"
            name="slotMinutes"
            type="number"
            min={5}
            max={120}
            defaultValue={config.slotMinutes}
            required
          />
        </div>
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-3 font-bold">بازی‌های هر رویارویی</legend>
        <p className="text-sm leading-7 text-[var(--text-muted)]">
          برای هر جفت بازیکن {toPersianDigits(types.length)} بازی ساخته می‌شود.
          مدل آماده انتخاب کنید یا نام دلخواه بنویسید. تکرار مدل مجاز است.
        </p>
        <input type="hidden" name="matchTypes" value={JSON.stringify(types)} />
        <datalist id="game-models">
          {MATCH_TYPES.map((t) => (
            <option key={t} value={matchTypeLabel(t)} />
          ))}
        </datalist>
        {types.map((type, i) => (
          <div key={i} className="flex min-w-0 items-center gap-2">
            <span className="w-7 shrink-0 text-center">
              {toPersianDigits(i + 1)}
            </span>
            <Input
              aria-label={`مدل بازی ${i + 1}`}
              list="game-models"
              value={matchTypeLabel(type)}
              onChange={(e) => {
                const text = e.target.value;
                const known = MATCH_TYPES.find(
                  (t) => matchTypeLabel(t) === text,
                );
                setTypes(types.map((v, n) => (n === i ? (known ?? text) : v)));
              }}
              maxLength={80}
              required
            />
            <Button
              type="button"
              variant="outline"
              aria-label={`حذف بازی ${i + 1}`}
              disabled={types.length <= 1}
              onClick={() => setTypes(types.filter((_, n) => n !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={types.length >= 12}
          onClick={() => setTypes([...types, "custom_deck"])}
        >
          <Plus className="size-4" />
          افزودن بازی
        </Button>
      </fieldset>
      <p className="rounded-xl bg-[var(--surface-2)] p-3 text-sm leading-7 text-[var(--text-muted)]">
        ذخیرهٔ تنظیمات، برنامهٔ بازی‌های برگزارنشده را دوباره می‌چیند. نتایج
        ثبت‌شده حفظ می‌شوند؛ تغییر نوع یا حذف بازی دارای نتیجه، ابتدا به حذف
        همان نتیجه نیاز دارد.
      </p>
      <Feedback state={state} />
      <Submit pending={pending} label="ذخیره و تنظیم برنامه" />
    </form>
  );
}
export function BrandingForm({ branding }: { branding: Branding }) {
  const { state, formAction, pending } = useSettingsAction(saveBrandingAction);
  return (
    <form
      action={formAction}
      className="space-y-5"
      aria-label="هویت بصری برنامه"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="app-name">نام نرم‌افزار</Label>
          <Input
            id="app-name"
            name="name"
            defaultValue={branding.name}
            required
            maxLength={80}
          />
        </div>
        <div>
          <Label htmlFor="short-name">نام زیر آیکون گوشی</Label>
          <Input
            id="short-name"
            name="shortName"
            defaultValue={branding.shortName}
            required
            maxLength={24}
          />
        </div>
      </div>
      <ImageField
        name="logo"
        label="لوگوی نرم‌افزار"
        current={branding.logoUrl}
      />
      <ImageField
        name="favicon"
        label="فاویکن مرورگر"
        current={branding.faviconUrl}
      />
      <ImageField
        name="appIcon"
        label="آیکون نصب روی گوشی"
        current={branding.appIconUrl}
      />
      <p className="text-xs leading-6 text-[var(--text-faint)]">
        برای دیدن آیکون جدید در نسخهٔ نصب‌شده ممکن است به نصب دوباره نیاز باشد.
      </p>
      <Feedback state={state} />
      <Submit pending={pending} />
    </form>
  );
}
export function MatchDateForm({
  id,
  scheduledAt,
}: {
  id: number;
  scheduledAt: string;
}) {
  const { state, formAction, pending } = useSettingsAction(
    rescheduleMatchAction,
  );
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-bold text-royal-light">
        تغییر تاریخ و ساعت
      </summary>
      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="id" value={id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`date-${id}`}>تاریخ شمسی</Label>
            <Input
              id={`date-${id}`}
              name="date"
              dir="ltr"
              defaultValue={jalaliInput(scheduledAt)}
              required
            />
          </div>
          <div>
            <Label htmlFor={`time-${id}`}>ساعت تهران</Label>
            <Input
              id={`time-${id}`}
              name="time"
              type="time"
              dir="ltr"
              defaultValue={new Intl.DateTimeFormat("en-GB", {
                timeZone: "Asia/Tehran",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
              }).format(new Date(scheduledAt))}
              required
            />
          </div>
        </div>
        <Feedback state={state} />
        <Submit pending={pending} />
      </form>
    </details>
  );
}
