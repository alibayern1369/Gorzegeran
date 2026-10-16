/**
 * تبدیل و قالب‌بندی تقویم جلالی — همهٔ نمایش‌ها به وقت تهران
 */
import { toGregorian, toJalaali } from "jalaali-js";

export const TEHRAN_TIMEZONE = "Asia/Tehran";

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

/** ماه‌های جلالی */
export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export const JALALI_MONTHS_SHORT = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

const faNumber = new Intl.NumberFormat("fa-IR", { useGrouping: false });

export function toPersianDigits(value: number | string): string {
  return faNumber.format(typeof value === "number" ? value : Number(value));
}

export function toPersianNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

/** تاریخ میلادی (Date) → جلالی */
export function gregorianToJalali(date: Date): JalaliDate {
  const { jy, jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return { jy, jm, jd };
}

/** جلالی → تاریخ میلادی (نیمه‌شب UTC همان روز) */
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return new Date(Date.UTC(gy, gm - 1, gd));
}

/** «۲۵ مهر ۱۴۰۵» */
export function formatJalaliDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const { jy, jm, jd } = gregorianToJalaliInTehran(d);
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

/** «شنبه ۲۵ مهر ۱۴۰۵» */
export function formatJalaliDateWithWeekday(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${weekdayNameFa(d)} ${formatJalaliDate(d)}`;
}

/** «۰۰:۱۵» */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "۰۰";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "۰۰";
  return `${hour}:${minute}`;
}

/** «شنبه» */
export function weekdayNameFa(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN_TIMEZONE,
    weekday: "long",
  }).format(d);
}

/** «شنبه ۲۵ مهر ۱۴۰۵ — ساعت ۰۰:۱۵» */
export function formatJalaliDateTime(date: Date | string): string {
  return `${formatJalaliDateWithWeekday(date)} — ساعت ${formatTime(date)}`;
}

/** تاریخ جلالی روز جاری به وقت تهران */
export function todayJalali(now: Date = new Date()): JalaliDate {
  return gregorianToJalaliInTehran(now);
}

/** اجزای تاریخ یک لحظه در تهران */
export function tehranDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function gregorianToJalaliInTehran(date: Date): JalaliDate {
  const { year, month, day } = tehranDateParts(date);
  const { jy, jm, jd } = toJalaali(year, month, day);
  return { jy, jm, jd };
}

/** آیا دو لحظه از نظر تاریخ تهران در یک روز هستند؟ */
export function isSameTehranDay(a: Date | string, b: Date | string): boolean {
  const da = typeof a === "string" ? new Date(a) : a;
  const db = typeof b === "string" ? new Date(b) : b;
  const pa = tehranDateParts(da);
  const pb = tehranDateParts(db);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

/** «۲ روز دیگر» / «امشب» */
export function relativeDayLabel(date: Date | string, now: Date = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isSameTehranDay(d, now)) return "امشب";
  const a = tehranDateParts(now);
  const b = tehranDateParts(d);
  const dayMs = 86_400_000;
  const da = Date.UTC(a.year, a.month - 1, a.day);
  const db = Date.UTC(b.year, b.month - 1, b.day);
  const diff = Math.round((db - da) / dayMs);
  if (diff === 1) return "فردا شب";
  if (diff === -1) return "دیشب";
  if (diff > 1 && diff <= 14) return `${toPersianDigits(diff)} شب دیگر`;
  if (diff < -1 && diff >= -14) return `${toPersianDigits(-diff)} شب پیش`;
  return formatJalaliDate(d);
}

export { toJalaali, toGregorian };
