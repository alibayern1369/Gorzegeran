import { test, expect } from "@playwright/test";
test("PWA service worker, manifest and install action", async ({ page }) => {
  await page.goto("/");
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.dir).toBe("rtl");
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(
    expect.arrayContaining(["192x192", "512x512"]),
  );
  if (process.env.E2E_LOCAL !== "1")
    await expect
      .poll(
        async () =>
          page.evaluate(
            async () =>
              (await navigator.serviceWorker.getRegistration())?.active?.state,
          ),
        { timeout: 30_000 },
      )
      .toBe("activated");
  await expect(
    page.getByRole("complementary", { name: "نصب نرم‌افزار" }),
  ).toBeVisible();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.documentElement.dataset.promptCalled = "yes";
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
  await page
    .getByRole("complementary", { name: "نصب نرم‌افزار" })
    .getByRole("button", { name: "نصب برنامه", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-prompt-called",
    "yes",
  );
  await expect(
    page.getByRole("complementary", { name: "نصب نرم‌افزار" }),
  ).toHaveCount(0);
});
test("iPhone shows Share / Add to Home Screen instructions", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  await page.addInitScript(() =>
    window.addEventListener("beforeinstallprompt", (event) =>
      event.stopImmediatePropagation(),
    ),
  );
  await page.goto("http://localhost:3000/");
  const banner = page.getByRole("complementary", { name: "نصب نرم‌افزار" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "افزودن به صفحهٔ اصلی" }).click();
  await expect(banner.getByRole("status")).toContainText("Add to Home Screen");
  await context.close();
});
