import { describe, it, expect } from "vitest";
import {
  formatJalaliDate,
  formatJalaliDateWithWeekday,
  formatTime,
  gregorianToJalali,
  jalaliToGregorian,
  isSameTehranDay,
  toPersianDigits,
  weekdayNameFa,
  TEHRAN_TIMEZONE,
} from "@/lib/jalali";

describe("تقویم جلالی و وقت تهران", () => {
  it("۲۳) تبدیل ۲۵ مهر ۱۴۰۵ ↔ ۲۰۲۶-۱۰-۱۷ درست است", () => {
    const g = jalaliToGregorian(1405, 7, 25);
    expect(g.toISOString().slice(0, 10)).toBe("2026-10-17");
    const j = gregorianToJalali(new Date(Date.UTC(2026, 9, 17)));
    expect(j).toEqual({ jy: 1405, jm: 7, jd: 25 });
  });

  it("۲۳ب) ۲۵ مهر ۱۴۰۵ شنبه است (به وقت تهران)", () => {
    const d = new Date("2026-10-17T00:00:00+03:30");
    expect(weekdayNameFa(d)).toBe("شنبه");
    expect(formatJalaliDateWithWeekday(d)).toBe("شنبه ۲۵ مهر ۱۴۰۵");
  });

  it("قالب‌بندی تاریخ و ساعت فارسی", () => {
    const d = new Date("2026-10-17T00:15:00+03:30");
    expect(formatJalaliDate(d)).toBe("۲۵ مهر ۱۴۰۵");
    expect(formatTime(d)).toBe("۰۰:۱۵");
    expect(toPersianDigits(40)).toBe("۴۰");
  });

  it("تشخیص روز یکسان به وقت تهران", () => {
    // ۰۰:۳۰ بامداد به وقت تهران = ۲۱:۰۰ روز قبل UTC
    const a = new Date("2026-10-17T00:30:00+03:30");
    const b = new Date("2026-10-16T21:00:00Z");
    expect(isSameTehranDay(a, b)).toBe(true);
    const c = new Date("2026-10-18T00:30:00+03:30");
    expect(isSameTehranDay(a, c)).toBe(false);
  });

  it("نام تقویم و منطقهٔ زمانی درست است", () => {
    expect(TEHRAN_TIMEZONE).toBe("Asia/Tehran");
    // یکم ژانویه ۲۰۲۶ = ۱۱ دی ۱۴۰۴
    expect(formatJalaliDate(new Date("2026-01-01T12:00:00+03:30"))).toBe("۱۱ دی ۱۴۰۴");
  });

  it("ساعت شروع مسابقات پس از نیمه‌شب است", () => {
    const d = new Date("2026-10-17T00:00:00+03:30");
    expect(formatTime(d)).toBe("۰۰:۰۰");
  });
});
