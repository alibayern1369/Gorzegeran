import { test, expect, type Page, type Locator } from "@playwright/test";
async function saved(form: Locator) {
  await expect(form.getByRole("status")).toContainText(
    "تغییرات با موفقیت ذخیره شد.",
    { timeout: 60000 },
  );
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
    `overflow at ${page.url()}`,
  ).toBe(true);
}
test("admin can configure league, manage players and images; mobile UI and PWA work", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("test-show-install"))
      localStorage.setItem("pwa-dismissed", String(Date.now()));
  });
  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/admin\/login/);
  await page.getByLabel("ایمیل مدیر").fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel("رمز عبور").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "ورود به داشبورد" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/players");
  for (const name of ["بازیکن آزمایشی ششم", "بازیکن ویرایش‌شده"]) {
    const heading = page.getByRole("heading", { name, exact: true });
    if (await heading.count()) {
      const card = page.locator(".clay").filter({ has: heading }).last();
      await card.getByText("حذف بازیکن", { exact: true }).click();
      await card.getByRole("checkbox").last().check();
      page.once("dialog", (d) => d.accept());
      await card
        .getByRole("button", { name: "حذف بازیکن و مسابقات او" })
        .click();
      await expect(heading).toHaveCount(0, { timeout: 60000 });
    }
  }
  await page.goto("/admin/settings");
  const league = page.getByRole("form", { name: "تنظیمات مسابقات" });
  while ((await league.getByRole("button", { name: /^حذف بازی / }).count()) > 4)
    await league
      .getByRole("button", { name: /^حذف بازی / })
      .last()
      .click();
  await league.getByLabel("تاریخ رسمی شروع (شمسی)").fill("1405/08/01");
  await league.getByLabel("ساعت شروع به وقت تهران").fill("20:00");
  await league
    .getByRole("button", { name: "افزودن بازی", exact: true })
    .click();
  await league
    .getByRole("button", { name: "افزودن بازی", exact: true })
    .click();
  await league.getByLabel("مدل بازی 5", { exact: true }).fill("درفت ویژه");
  await league.getByLabel("مدل بازی 6", { exact: true }).fill("اکسیر دوبرابر");
  await league.getByRole("button", { name: "ذخیره و تنظیم برنامه" }).click();
  await saved(league);
  await page.reload();
  await expect(league.getByLabel("مدل بازی 6", { exact: true })).toHaveValue(
    "اکسیر دوبرابر",
  );
  await expect(league.getByLabel("ساعت شروع به وقت تهران")).toHaveValue(
    "20:00",
  );
  console.log("PASS six-game plan and official start persisted");
  await page.goto("/schedule");
  await expect(page.locator("main")).toContainText("درفت ویژه");
  await page.goto("/admin/players");
  const create = page.getByRole("form", { name: "افزودن بازیکن", exact: true });
  await create
    .getByLabel("نام بازیکن", { exact: true })
    .fill("بازیکن آزمایشی ششم");
  await create.getByLabel("لقب", { exact: true }).fill("آزمون مرورگر");
  await create
    .getByLabel("عکس پروفایل", { exact: true })
    .setInputFiles("public/icon-512.png");
  await create
    .getByRole("button", { name: "افزودن بازیکن", exact: true })
    .click();
  await saved(create);
  await expect(
    page.getByRole("heading", { name: "بازیکن آزمایشی ششم", exact: true }),
  ).toBeVisible();
  const edit = page.getByRole("form", {
    name: "ویرایش بازیکن آزمایشی ششم",
    exact: true,
  });
  await expect(edit.locator('img[src^="/media/"]')).toBeVisible();
  const uploaded = await edit
    .locator('img[src^="/media/"]')
    .getAttribute("src");
  const asset = await page.request.get(uploaded!);
  expect(asset.status()).toBe(200);
  expect(asset.headers()["content-type"]).toBe("image/png");
  await edit
    .getByLabel("نام بازیکن", { exact: true })
    .fill("بازیکن ویرایش‌شده");
  await edit.getByRole("button", { name: "ذخیره بازیکن" }).click();
  await saved(
    page.getByRole("form", { name: "ویرایش بازیکن ویرایش‌شده", exact: true }),
  );
  console.log("PASS player create, edit and profile image upload");
  await page.goto("/standings");
  await expect(page.locator("main")).toContainText("بازیکن ویرایش‌شده");
  await page.goto("/admin/settings");
  const branding = page.getByRole("form", { name: "هویت بصری برنامه" });
  await branding
    .getByLabel("نام نرم‌افزار", { exact: true })
    .fill("گرز گران آزمایشی");
  await branding.getByLabel("نام زیر آیکون گوشی").fill("گرز تست");
  for (const label of [
    "لوگوی نرم‌افزار",
    "فاویکن مرورگر",
    "آیکون نصب روی گوشی",
  ])
    await branding
      .getByLabel(label, { exact: true })
      .setInputFiles("public/icon-512.png");
  await branding.getByRole("button", { name: "ذخیره تغییرات" }).click();
  await saved(branding);
  await page.reload();
  await expect(
    page.locator('header img[alt="گرز گران آزمایشی"]'),
  ).toBeVisible();
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.short_name).toBe("گرز تست");
  expect(manifest.icons[0].src).toMatch(/^\/media\//);
  expect(
    await page.locator('link[rel="icon"]').last().getAttribute("href"),
  ).toMatch(/^\/media\//);
  expect((await page.request.get(manifest.icons[0].src)).status()).toBe(200);
  console.log("PASS app logo, favicon, manifest and install icon");
  await page.goto("/admin/matches");
  await page.getByText("تغییر تاریخ و ساعت", { exact: true }).first().click();
  const targetDateForm = page.locator('form:has(input[name="date"])').first();
  const targetMatchId = await targetDateForm
    .locator('input[name="id"]')
    .inputValue();
  const dateForm = page.locator(
    `form:has(input[name="date"]):has(input[name="id"][value="${targetMatchId}"])`,
  );
  await dateForm.getByLabel("تاریخ شمسی").fill("1405/08/05");
  await dateForm.getByLabel("ساعت تهران").fill("21:30");
  await dateForm.getByRole("button", { name: "ذخیره تغییرات" }).click();
  await saved(dateForm);
  await page.goto("/admin/results");
  await page
    .getByRole("button", { name: "ثبت نتیجه", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(391);
  await dialog
    .getByRole("radiogroup")
    .nth(0)
    .getByRole("radio", { name: "۲", exact: true })
    .click();
  await dialog
    .getByRole("radiogroup")
    .nth(1)
    .getByRole("radio", { name: "۱", exact: true })
    .click();
  const recordedMatchId = await dialog
    .locator('input[name="matchId"]')
    .inputValue();
  await dialog.getByRole("button", { name: "ثبت نتیجه", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.goto(`/matches/${recordedMatchId}`);
  await expect(page.getByText("نتیجهٔ نهایی", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/admin/players");
  const card = page
    .locator(".clay")
    .filter({
      has: page.getByRole("heading", {
        name: "بازیکن ویرایش‌شده",
        exact: true,
      }),
    })
    .last();
  await card.getByText("حذف بازیکن", { exact: true }).click();
  await card.getByRole("checkbox").last().check();
  page.once("dialog", (d) => d.accept());
  await card.getByRole("button", { name: "حذف بازیکن و مسابقات او" }).click();
  await expect(
    page.getByRole("heading", { name: "بازیکن ویرایش‌شده", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const font = await page.evaluate(() => ({
    family: getComputedStyle(document.body).fontFamily,
    variable: getComputedStyle(document.documentElement).getPropertyValue(
      "--font-vazirmatn",
    ),
    loaded: [...document.fonts].some((f) => f.status === "loaded"),
  }));
  expect(font.variable.trim().length).toBeGreaterThan(0);
  expect(font.family).toContain(
    font.variable.split(",")[0]!.trim().replaceAll('"', ""),
  );
  expect(font.loaded).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.goto("/admin/settings");
  await page.screenshot({
    path: "test-results/admin-settings-mobile.png",
    fullPage: true,
  });
  await page.evaluate(() => {
    sessionStorage.setItem("test-show-install", "1");
    localStorage.removeItem("pwa-dismissed");
  });
  await page.reload();
  await expect(
    page.getByRole("complementary", { name: "نصب نرم‌افزار" }),
  ).toBeVisible();
  if (process.env.E2E_LOCAL !== "1")
    await expect
      .poll(async () =>
        page.evaluate(async () => {
          const registration = await navigator.serviceWorker.getRegistration();
          return registration?.active?.state;
        }),
      )
      .toBe("activated");
  expect((await page.request.get("/sw.js")).status()).toBe(200);
});
