import { test, expect } from "@playwright/test";
test("public and admin pages fit mobile, tablet and desktop viewports", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("pwa-dismissed", String(Date.now())),
  );
  await page.goto("/admin/login");
  await page.getByLabel("ایمیل مدیر").fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel("رمز عبور").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "ورود به داشبورد" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/schedule",
      "/standings",
      "/tower-leaders",
      "/matches/1",
      "/players/dashli",
      "/admin/players",
      "/admin/settings",
      "/admin/results",
    ]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      try {
        await expect
          .poll(
            () =>
              page.evaluate(
                () =>
                  document.documentElement.scrollWidth <= window.innerWidth + 1,
              ),
            { timeout: 5000, message: `${width}px ${route}` },
          )
          .toBe(true);
      } catch (e) {
        console.log(
          await page.evaluate(() => ({
            viewport: innerWidth,
            scroll: document.documentElement.scrollWidth,
            overflow: [...document.querySelectorAll("body *")]
              .map((el) => ({
                tag: el.tagName,
                class: el.className,
                x: el.getBoundingClientRect().x,
                width: el.getBoundingClientRect().width,
              }))
              .filter((r) => r.x < -1 || r.x + r.width > innerWidth + 1)
              .slice(0, 15),
          })),
        );
        throw e;
      }
    }
    console.log(`PASS responsive ${width}px`);
  }
});
