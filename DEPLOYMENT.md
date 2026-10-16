# استقرار روی Vercel و Neon

پروژهٔ Neon: `withered-block-95337261`، شاخه: `production`.
پیکربندی سرویس در `neon.ts` و اتصال پروژه در `.neon` قرار دارد.
احراز هویت مدیر داخل برنامه است؛ سرویس موردنیاز Neon فقط PostgreSQL است.

## متغیرهای محیطی

مقادیر واقعی در `.env.local` هستند و نباید در Git ثبت شوند.
در Vercel، بخش Settings → Environment Variables این متغیرها را تنظیم کنید:

- `DATABASE_URL`: اتصال pooled برای ترافیک برنامه.
- `DATABASE_URL_UNPOOLED`: اتصال مستقیم برای مهاجرت‌ها.
- `SESSION_SECRET`: یک مقدار تصادفی قوی، حداقل ۱۶ کاراکتر.
- `NEXT_PUBLIC_APP_URL`: آدرس نهایی سایت با `https://`.

`ADMIN_EMAIL` و `ADMIN_PASSWORD` فقط هنگام ساخت یا بازنشانی حساب مدیر لازم‌اند.
این اطلاعات را در چت، خروجی فرمان یا مخزن منتشر نکنید.

## راه‌اندازی دیتابیس

پس از دریافت متغیرها با `npx neon@latest deploy`:

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run build
npm start
```

در ترمینال دیگر، بررسی دیتابیس و صفحات برنامه:

```bash
npm run test:neon
```

این بررسی خواندن داده‌های لیگ و نوشتن داخل تراکنش با rollback را آزمایش می‌کند،
صفحات عمومی را از HTTP می‌خواند، نسخهٔ API را با دیتابیس مقایسه می‌کند و
ورود مدیر از Server Action و دسترسی به داشبورد را آزمایش می‌کند.
برای آدرس دیگر، `SMOKE_APP_URL` را تنظیم کنید.

در Vercel چارچوب Next.js و Build Command برابر `npm run build` باشد.
مهاجرت و seed را در هر build اجرا نکنید. محیط Preview باید به شاخهٔ جداگانهٔ
Neon متصل شود تا داده‌های production تغییر نکند.
