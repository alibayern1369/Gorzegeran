/**
 * اجرای مهاجرت‌های پایگاه داده
 * npm run db:migrate
 */
import { loadLocalEnv } from "../src/lib/env";
import { runMigrations } from "../src/lib/db/migrate";
import { isProductionDriver } from "../src/lib/db/client";

loadLocalEnv();


async function main() {
  console.log(
    isProductionDriver()
      ? "در حال اجرای مهاجرت‌ها روی PostgreSQL (DATABASE_URL)…"
      : "در حال اجرای مهاجرت‌ها روی PGlite محلی…",
  );
  await runMigrations();
  console.log("مهاجرت‌ها با موفقیت اجرا شدند. ✓");
  process.exit(0);
}

main().catch((err) => {
  console.error("خطا در اجرای مهاجرت‌ها:", err);
  process.exit(1);
});
